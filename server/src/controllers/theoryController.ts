import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { classifyContent, calculateComplexityScore } from '../services/moderation';
import { updateReputation, REP_ACTIONS } from '../utils/levelSystem';
import { cache, CACHE_KEYS } from '../utils/cache';

const router = Router();

/**
 * POST /api/theories
 * Submit a new theory (auth required)
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, body, refs } = req.body;
        const userId = req.user!.id;

        // Validate input
        if (!title || !body) {
            res.status(400).json({ error: 'Title and body are required' });
            return;
        }

        if (title.length < 10 || title.length > 200) {
            res.status(400).json({ error: 'Title must be between 10 and 200 characters' });
            return;
        }

        if (body.length < 50) {
            res.status(400).json({ error: 'Body must be at least 50 characters' });
            return;
        }

        // Pre-publish moderation with Gemini
        const moderation = await classifyContent(title, body);
        const complexityScore = calculateComplexityScore(body);

        // Determine action based on classification
        let moderationStatus: string;
        let actionTaken: string;

        if (moderation.classification === 'unsafe') {
            moderationStatus = 'unsafe';
            actionTaken = 'blocked';
        } else if (moderation.classification === 'nsfw') {
            moderationStatus = 'shadowbanned';
            actionTaken = 'shadowbanned';
        } else {
            moderationStatus = 'safe';
            actionTaken = 'published';
        }

        // Block unsafe content immediately
        if (moderationStatus === 'unsafe') {
            await supabase.from('moderation_logs').insert({
                theory_id: null,
                classification: moderation.classification,
                confidence: moderation.confidence,
                action_taken: 'blocked',
                gemini_response: { reasoning: moderation.reasoning },
            });

            res.status(403).json({
                error: 'Theory submission blocked due to content policy violation',
                reason: moderation.reasoning,
            });
            return;
        }

        // Insert theory
        const { data: theory, error: insertError } = await supabase
            .from('theories')
            .insert({
                user_id: userId,
                title,
                body,
                refs: refs || null,
                moderation_status: moderationStatus,
                complexity_score: complexityScore,
            })
            .select()
            .single();

        if (insertError || !theory) {
            console.error('Theory insert error:', insertError);
            res.status(500).json({ error: 'Failed to create theory' });
            return;
        }

        // Log moderation decision
        await supabase.from('moderation_logs').insert({
            theory_id: theory.id,
            classification: moderation.classification,
            confidence: moderation.confidence,
            action_taken: actionTaken,
            gemini_response: { reasoning: moderation.reasoning },
        });

        // Refresh materialized view (ignore errors - view may not exist yet)
        try {
            await supabase.rpc('refresh_theory_stats');
        } catch (e) {
            console.warn('Could not refresh theory_stats:', e);
        }

        // Update user reputation
        try {
            await updateReputation(userId, REP_ACTIONS.CREATE_THEORY);
        } catch (repError) {
            console.error('Failed to update reputation:', repError);
        }

        res.status(201).json({
            theory,
            moderation: {
                status: moderationStatus,
                classification: moderation.classification,
                message: moderationStatus === 'shadowbanned'
                    ? 'Theory submitted but flagged for review'
                    : 'Theory published successfully',
            },
        });
    } catch (error) {
        console.error('Create theory error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/theories
 * List theories with pagination and filtering
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sort = 'latest',
            limit = 20,
            offset = 0
        } = req.query;

        // Fetch theories with user data
        let query = supabase
            .from('theories')
            .select(`
                id,
                title,
                body,
                created_at,
                is_mature,
                users!inner(username, level)
            `)
            .eq('moderation_status', 'safe')
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        // Apply sorting
        if (sort === 'latest') {
            query = query.order('created_at', { ascending: false });
        }

        const { data: theories, error } = await query;

        if (error) {
            console.error('Fetch theories error:', error);
            res.status(500).json({ error: 'Failed to fetch theories' });
            return;
        }

        // Fetch actual stats from materialized view
        const theoryIds = (theories || []).map(t => t.id);
        let statsMap: Record<string, any> = {};

        if (theoryIds.length > 0) {
            const { data: stats } = await supabase
                .from('theory_stats')
                .select('*')
                .in('theory_id', theoryIds);

            if (stats) {
                statsMap = stats.reduce((acc, s) => {
                    acc[s.theory_id] = s;
                    return acc;
                }, {} as Record<string, any>);
            }
        }

        // Combine theories with their actual stats
        const theoriesWithStats = (theories || []).map(theory => ({
            ...theory,
            theory_stats: statsMap[theory.id] || {
                upvotes: 0,
                downvotes: 0,
                for_count: 0,
                against_count: 0,
                comment_count: 0,
                interaction_score: 0
            }
        }));

        res.json({ theories: theoriesWithStats });
    } catch (error) {
        console.error('List theories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/theories/:id
 * Get single theory with full details
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: theory, error } = await supabase
            .from('theories')
            .select(`
                *,
                is_mature,
                users!inner(id, username, level)
            `)
            .eq('id', id)
            .eq('moderation_status', 'safe')
            .single();

        if (error || !theory) {
            console.error('Get theory error:', error);
            res.status(404).json({ error: 'Theory not found' });
            return;
        }

        // Fetch actual stats from materialized view
        const { data: stats } = await supabase
            .from('theory_stats')
            .select('*')
            .eq('theory_id', id)
            .single();

        // Combine theory with actual stats
        const theoryWithStats = {
            ...theory,
            theory_stats: stats || {
                upvotes: 0,
                downvotes: 0,
                for_count: 0,
                against_count: 0,
                comment_count: 0,
                interaction_score: 0
            }
        };

        res.json({ theory: theoryWithStats });
    } catch (error) {
        console.error('Get theory error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
