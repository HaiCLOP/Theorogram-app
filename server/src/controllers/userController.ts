import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { firebaseAuth, isDevMode } from '../config/firebase';

const router = Router();

/**
 * POST /api/users/register
 * Register a new user after Firebase signup
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
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
            res.status(400).json({ error: 'User already registered' });
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
            .select('id, username, level, reputation_score, created_at, banned_status')
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

        // Get user ID
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let query = supabase
            .from('theories')
            .select(`
        id,
        title,
        body,
        created_at,
        id,
        title,
        body,
        created_at
      `)
            .eq('user_id', user.id)
            .eq('moderation_status', 'safe')
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        // Apply sorting
        if (sort === 'most_upvoted') {
            query = query.order('upvotes', {
                foreignTable: 'theory_stats',
                ascending: false
            });
        } else if (sort === 'popular') {
            query = query.order('interaction_score', {
                foreignTable: 'theory_stats',
                ascending: false
            });
        } else {
            // recent
            query = query.order('created_at', { ascending: false });
        }

        const { data: theories, error } = await query;

        if (error) {
            console.error('Fetch user theories error:', error);
            res.status(500).json({ error: 'Failed to fetch theories' });
            return;
        }

        res.json({ theories });
    } catch (error) {
        console.error('Get user theories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
