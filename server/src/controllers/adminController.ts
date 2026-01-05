import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * DELETE /api/admin/theories/:id
 * Delete a theory (permanent)
 */
router.delete('/theories/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        const { error: deleteError } = await supabase
            .from('theories')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete theory error:', deleteError);
            res.status(500).json({ error: 'Failed to delete theory' });
            return;
        }

        // Log action
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            action: 'delete_theory',
            target_type: 'theory',
            target_id: id,
            reason: reason || 'No reason provided',
        });

        res.json({ message: 'Theory deleted successfully' });
    } catch (error) {
        console.error('Admin delete theory error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/ban
 * Ban a user
 */
router.post('/users/:id/ban', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        const { error: banError } = await supabase
            .from('users')
            .update({ banned_status: true })
            .eq('id', id);

        if (banError) {
            console.error('Ban user error:', banError);
            res.status(500).json({ error: 'Failed to ban user' });
            return;
        }

        // Log action
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            action: 'ban_user',
            target_type: 'user',
            target_id: id,
            reason: reason || 'No reason provided',
        });

        res.json({ message: 'User banned successfully' });
    } catch (error) {
        console.error('Admin ban user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/unban
 * Unban a user
 */
router.post('/users/:id/unban', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        const { error: unbanError } = await supabase
            .from('users')
            .update({ banned_status: false })
            .eq('id', id);

        if (unbanError) {
            console.error('Unban user error:', unbanError);
            res.status(500).json({ error: 'Failed to unban user' });
            return;
        }

        // Log action
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            action: 'unban_user',
            target_type: 'user',
            target_id: id,
            reason: reason || 'No reason provided',
        });

        res.json({ message: 'User unbanned successfully' });
    } catch (error) {
        console.error('Admin unban user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/moderation-logs
 * View moderation logs
 */
router.get('/moderation-logs', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const { data: logs, error } = await supabase
            .from('moderation_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (error) {
            console.error('Fetch moderation logs error:', error);
            res.status(500).json({ error: 'Failed to fetch logs' });
            return;
        }

        res.json({ logs });
    } catch (error) {
        console.error('Get moderation logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/audit-logs
 * View audit logs
 */
router.get('/audit-logs', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const { data: logs, error } = await supabase
            .from('audit_logs')
            .select(`
        *,
        users!inner(username)
      `)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (error) {
            console.error('Fetch audit logs error:', error);
            res.status(500).json({ error: 'Failed to fetch logs' });
            return;
        }

        res.json({ logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
