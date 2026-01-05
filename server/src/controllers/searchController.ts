import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * GET /api/search
 * Search theories and users
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, type = 'all', limit = 20 } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Search query (q) is required' });
            return;
        }

        const results: any = {
            theories: [],
            users: [],
        };

        // Search theories using ilike for simple text matching
        if (type === 'all' || type === 'theories') {
            const { data: theories, error } = await supabase
                .from('theories')
                .select(`
                    id,
                    title,
                    body,
                    created_at,
                    users!inner(username, level)
                `)
                .eq('moderation_status', 'safe')
                .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
                .limit(Number(limit));

            if (error) {
                console.error('Theory search error:', error);
            }

            // Add default stats
            results.theories = (theories || []).map(theory => ({
                ...theory,
                theory_stats: {
                    upvotes: 0,
                    downvotes: 0,
                    for_count: 0,
                    against_count: 0,
                    comment_count: 0,
                    interaction_score: 0
                }
            }));
        }

        // Search users
        if (type === 'all' || type === 'users') {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, username, level, reputation_score')
                .ilike('username', `%${q}%`)
                .eq('banned_status', false)
                .limit(Number(limit));

            if (error) {
                console.error('User search error:', error);
            }

            results.users = users || [];
        }

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
