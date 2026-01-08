import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { updateReputation, REP_ACTIONS } from '../utils/levelSystem';

const router = Router();

/**
 * POST /api/stances
 * Set FOR or AGAINST stance on a theory
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { theory_id, stance_type } = req.body;
        const userId = req.user!.id;

        // Validate input
        if (!theory_id || !stance_type) {
            res.status(400).json({ error: 'theory_id and stance_type are required' });
            return;
        }

        // SECURITY FIX: Validate UUID format
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(theory_id)) {
            res.status(400).json({ error: 'Invalid theory ID format' });
            return;
        }

        if (!['for', 'against'].includes(stance_type)) {
            res.status(400).json({ error: 'stance_type must be "for" or "against"' });
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

        // Check for existing stance to prevent point farming
        const { data: existingStance } = await supabase
            .from('stances')
            .select('id')
            .eq('user_id', userId)
            .eq('theory_id', theory_id)
            .single();

        // Upsert stance (independent of vote)
        const { error: stanceError } = await supabase
            .from('stances')
            .upsert({
                user_id: userId,
                theory_id,
                stance_type,
            }, {
                onConflict: 'user_id,theory_id',
            });

        if (stanceError) {
            console.error('Stance error:', stanceError);
            res.status(500).json({ error: 'Failed to record stance' });
            return;
        }

        // Award reputation if this is a new stance
        if (!existingStance) {
            try {
                await updateReputation(userId, REP_ACTIONS.TAKE_STANCE);
            } catch (repError) {
                console.error('Failed to update reputation:', repError);
            }
        }

        // Refresh materialized view
        await supabase.rpc('refresh_theory_stats');

        res.json({ message: 'Stance recorded successfully' });
    } catch (error) {
        console.error('Stance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/stances/user/:theoryId
 * Get current user's stance for a theory
 */
router.get('/user/:theoryId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { theoryId } = req.params;
        const userId = req.user!.id;

        const { data: stance } = await supabase
            .from('stances')
            .select('stance_type')
            .eq('user_id', userId)
            .eq('theory_id', theoryId)
            .single();

        res.json({ stance: stance?.stance_type || null });
    } catch (error) {
        console.error('Get user stance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
