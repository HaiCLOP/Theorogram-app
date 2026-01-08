import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { firebaseAuth, isDevMode } from '../config/firebase';
import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate limit for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { error: 'Too many registration attempts, please try again later' },
});

/**
 * POST /api/users/register
 * Register a new user after Firebase signup
 */
router.post('/register', registerLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.body;
        const authHeader = req.headers.authorization;

        // DEV MODE: Skip Firebase verification
        if (isDevMode) {
            console.log('[DEV MODE] Registering user without Firebase verification');

            // Check if username exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .single();

            if (existingUser) {
                res.status(400).json({ error: 'Username already taken' });
                return;
            }

            let uidToUse = `dev_${Date.now()}`;

            // Try to extract real UID from token
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const parts = token.split('.');
                if (parts.length >= 2) {
                    try {
                        const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
                        if (payload.sub || payload.user_id) uidToUse = payload.sub || payload.user_id;
                    } catch (e) {
                        console.warn('[DEV MODE] Failed to decode token in register:', e);
                    }
                }
            }

            // Create user with dev/real firebase_uid
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    firebase_uid: uidToUse,
                    username,
                    role: 'user',
                })
                .select()
                .single();

            if (createError || !newUser) {
                console.error('Create user error:', createError);
                res.status(500).json({ error: 'Failed to create user' });
                return;
            }

            res.status(201).json({ user: newUser });
            return;
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.substring(7);

        if (!firebaseAuth) {
            res.status(500).json({ error: 'Auth configuration error' });
            return;
        }

        // Verify token
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`firebase_uid.eq.${firebaseUid},username.eq.${username}`)
            .single();

        if (existingUser) {
            // SECURITY: Use generic message to prevent enumeration
            res.status(400).json({ error: 'Registration failed. Please try a different username.' });
            return;
        }

        // Create user
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                firebase_uid: firebaseUid,
                username,
                role: 'user',
            })
            .select()
            .single();

        if (createError || !newUser) {
            console.error('Create user error:', createError);
            res.status(500).json({ error: 'Failed to create user' });
            return;
        }

        res.status(201).json({ user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * GET /api/users/:username
 * Get user profile and metrics
 */
router.get('/:username', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        // Fetch user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, level, reputation_score, role, created_at, banned_status')
            .eq('username', username)
            .single();

        if (userError || !user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Calculate metrics (simplified - avoiding theory_stats view)
        const { count: totalTheories } = await supabase
            .from('theories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('moderation_status', 'safe');

        // Count votes received on user's theories
        const { data: userTheories } = await supabase
            .from('theories')
            .select('id')
            .eq('user_id', user.id);

        const theoryIds = userTheories?.map(t => t.id) || [];

        let totalUpvotes = 0;
        if (theoryIds.length > 0) {
            const { count } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .in('theory_id', theoryIds)
                .eq('vote_type', 'upvote');
            totalUpvotes = count || 0;
        }

        const { count: debateParticipation } = await supabase
            .from('stances')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const metrics = {
            total_theories: totalTheories || 0,
            total_upvotes_received: totalUpvotes,
            debate_participation: debateParticipation || 0,
        };

        // Fetch recent activity
        const { data: recentStances } = await supabase
            .from('stances')
            .select(`
                stance_type,
                created_at,
                theories (id, title)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

        const { data: recentCreated } = await supabase
            .from('theories')
            .select('id, title, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

        const activity = [
            ...(recentStances || []).map((s: any) => ({
                type: 'stance',
                label: `Took Stance: ${s.stance_type.toUpperCase()}`,
                detail: s.theories?.title,
                points: '+5 RP',
                created_at: s.created_at
            })),
            ...(recentCreated || []).map(t => ({
                type: 'theory',
                label: 'Published Theory',
                detail: t.title,
                points: '+50 RP',
                created_at: t.created_at
            }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);

        res.json({ user, metrics, recent_activity: activity });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/users/:username/theories
 * Get user's theories with sorting
 */
router.get('/:username/theories', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { sort = 'recent', limit = 20, offset = 0 } = req.query;

        // Get user info for the theories
        const { data: userData } = await supabase
            .from('users')
            .select('id, username, level')
            .eq('username', username)
            .single();

        if (!userData) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let query = supabase
            .from('theories')
            .select(`
                id,
                title,
                body,
                created_at
            `)
            .eq('user_id', userData.id)
            .eq('moderation_status', 'safe')
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Math.min(Number(limit) || 20, 100) - 1);

        const { data: theories, error } = await query;

        if (error) {
            console.error('Fetch user theories error:', error);
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

        // Add user info and actual stats to each theory
        const theoriesWithUserData = (theories || []).map(theory => ({
            ...theory,
            users: {
                username: userData.username,
                level: userData.level || 1
            },
            theory_stats: statsMap[theory.id] || {
                upvotes: 0,
                downvotes: 0,
                for_count: 0,
                against_count: 0,
                comment_count: 0,
                interaction_score: 0
            }
        }));

        res.json({ theories: theoriesWithUserData });
    } catch (error) {
        console.error('Get user theories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
