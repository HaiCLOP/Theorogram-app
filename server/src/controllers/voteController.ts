import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /api/votes
 * Upvote or downvote a theory
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { theory_id, vote_type } = req.body;
        const userId = req.user!.id;

        // Validate input
        if (!theory_id || !vote_type) {
            res.status(400).json({ error: 'theory_id and vote_type are required' });
            return;
        }

        if (!['upvote', 'downvote'].includes(vote_type)) {
            res.status(400).json({ error: 'vote_type must be "upvote" or "downvote"' });
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

        // Upsert vote (insert or update if exists)
        const { error: voteError } = await supabase
            .from('votes')
            .upsert({
                user_id: userId,
                theory_id,
                vote_type,
            }, {
                onConflict: 'user_id,theory_id',
            });

        if (voteError) {
            console.error('Vote error:', voteError);
            res.status(500).json({ error: 'Failed to record vote' });
            return;
        }

        // Refresh materialized view
        await supabase.rpc('refresh_theory_stats');

        res.json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/votes/user/:theoryId
 * Get current user's vote for a theory
 */
router.get('/user/:theoryId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { theoryId } = req.params;
        const userId = req.user!.id;

        const { data: vote } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('user_id', userId)
            .eq('theory_id', theoryId)
            .single();

        res.json({ vote: vote?.vote_type || null });
    } catch (error) {
        console.error('Get user vote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
