import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /api/comments
 * Add a comment to a theory
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { theory_id, body } = req.body;
        const userId = req.user!.id;

        // Validate input
        if (!theory_id || !body) {
            res.status(400).json({ error: 'theory_id and body are required' });
            return;
        }

        // SECURITY FIX: Validate UUID format
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(theory_id)) {
            res.status(400).json({ error: 'Invalid theory ID format' });
            return;
        }

        if (body.length < 10) {
            res.status(400).json({ error: 'Comment must be at least 10 characters' });
            return;
        }

        // Check if theory exists
        const { data: theory } = await supabase
            .from('theories')
            .select('id')
            .eq('id', theory_id)
            .eq('moderation_status', 'safe')
            .single();

        if (!theory) {
            res.status(404).json({ error: 'Theory not found' });
            return;
        }

        // Insert comment
        const { data: comment, error: insertError } = await supabase
            .from('comments')
            .insert({
                user_id: userId,
                theory_id,
                body,
            })
            .select(`
        *,
        users!inner(username, level)
      `)
            .single();

        if (insertError || !comment) {
            console.error('Comment insert error:', insertError);
            res.status(500).json({ error: 'Failed to create comment' });
            return;
        }

        // Refresh materialized view
        await supabase.rpc('refresh_theory_stats');

        res.status(201).json({ comment });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/comments/:theoryId
 * List comments for a theory
 */
router.get('/:theoryId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { theoryId } = req.params;

        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
        id,
        body,
        created_at,
        users!inner(username, level)
      `)
            .eq('theory_id', theoryId)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch comments error:', error);
            res.status(500).json({ error: 'Failed to fetch comments' });
            return;
        }

        res.json({ comments });
    } catch (error) {
        console.error('List comments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment (admin only, soft delete)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        // Soft delete
        const { error: deleteError } = await supabase
            .from('comments')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (deleteError) {
            console.error('Delete comment error:', deleteError);
            res.status(500).json({ error: 'Failed to delete comment' });
            return;
        }

        // Log action
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            action: 'delete_comment',
            target_type: 'comment',
            target_id: id,
        });

        // Refresh materialized view
        await supabase.rpc('refresh_theory_stats');

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
