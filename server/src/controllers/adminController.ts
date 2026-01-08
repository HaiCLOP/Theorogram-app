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

        // SECURITY FIX: Prevent banning self
        if (id === adminId) {
            res.status(400).json({ error: 'Cannot ban yourself' });
            return;
        }

        // SECURITY FIX: Validate UUID format
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(id)) {
            res.status(400).json({ error: 'Invalid user ID format' });
            return;
        }

        // SECURITY FIX: Prevent banning other admins
        const { data: targetUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', id)
            .single();

        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (targetUser.role === 'admin') {
            res.status(403).json({ error: 'Cannot ban other administrators' });
            return;
        }

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

/**
 * POST /api/admin/theories/:id/flag-mature
 * Flag a theory as mature content (admin only)
 */
router.post('/theories/:id/flag-mature', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        // Validate UUID
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(id)) {
            res.status(400).json({ error: 'Invalid theory ID format' });
            return;
        }

        // Check if theory exists
        const { data: theory } = await supabase
            .from('theories')
            .select('id')
            .eq('id', id)
            .single();

        if (!theory) {
            res.status(404).json({ error: 'Theory not found' });
            return;
        }

        // Flag as mature
        const { error: updateError } = await supabase
            .from('theories')
            .update({ is_mature: true })
            .eq('id', id);

        if (updateError) {
            console.error('Flag mature error:', updateError);
            res.status(500).json({ error: 'Failed to flag theory' });
            return;
        }

        // Log action
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            action: 'flag_mature',
            target_type: 'theory',
            target_id: id,
            reason: reason || 'Flagged as mature content',
        });

        res.json({ message: 'Theory flagged as mature content' });
    } catch (error) {
        console.error('Flag mature error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/theories/:id/unflag-mature
 * Remove mature flag from a theory (admin only)
 */
router.post('/theories/:id/unflag-mature', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const { error: updateError } = await supabase
            .from('theories')
            .update({ is_mature: false })
            .eq('id', id);

        if (updateError) {
            console.error('Unflag mature error:', updateError);
            res.status(500).json({ error: 'Failed to unflag theory' });
            return;
        }

        // Log action
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            action: 'unflag_mature',
            target_type: 'theory',
            target_id: id,
            reason: 'Removed mature content flag',
        });

        res.json({ message: 'Mature flag removed' });
    } catch (error) {
        console.error('Unflag mature error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        // Get user stats
        const { data: userStats } = await supabase.rpc('get_admin_stats');

        // If RPC doesn't exist, calculate manually
        if (!userStats) {
            const [users, theories, comments, votes] = await Promise.all([
                supabase.from('users').select('id, banned_status, shadowbanned, created_at, last_active_at', { count: 'exact' }),
                supabase.from('theories').select('id, moderation_status, is_mature, created_at', { count: 'exact' }),
                supabase.from('comments').select('id', { count: 'exact' }),
                supabase.from('votes').select('id', { count: 'exact' }),
            ]);

            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const usersData = users.data || [];
            const theoriesData = theories.data || [];

            const stats = {
                users: {
                    total: usersData.length,
                    active: usersData.filter(u => !u.banned_status).length,
                    banned: usersData.filter(u => u.banned_status).length,
                    shadowbanned: usersData.filter(u => u.shadowbanned).length,
                    active_24h: usersData.filter(u => u.last_active_at && new Date(u.last_active_at) > oneDayAgo).length,
                    active_7d: usersData.filter(u => u.last_active_at && new Date(u.last_active_at) > sevenDaysAgo).length,
                    new_24h: usersData.filter(u => new Date(u.created_at) > oneDayAgo).length,
                    new_7d: usersData.filter(u => new Date(u.created_at) > sevenDaysAgo).length,
                },
                theories: {
                    total: theoriesData.length,
                    published: theoriesData.filter(t => t.moderation_status === 'safe').length,
                    shadowbanned: theoriesData.filter(t => t.moderation_status === 'shadowbanned').length,
                    blocked: theoriesData.filter(t => t.moderation_status === 'unsafe').length,
                    mature: theoriesData.filter(t => t.is_mature).length,
                    new_24h: theoriesData.filter(t => new Date(t.created_at) > oneDayAgo).length,
                    new_7d: theoriesData.filter(t => new Date(t.created_at) > sevenDaysAgo).length,
                },
                comments: { total: comments.count || 0 },
                votes: { total: votes.count || 0 },
            };

            res.json({ stats });
            return;
        }

        res.json({ stats: userStats });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/users
 * List all users with filters
 */
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { filter = 'all', search = '', limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('users')
            .select('id, username, role, level, reputation_score, banned_status, shadowbanned, suspended_until, post_restricted_until, created_at, last_active_at')
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        // Apply filters
        if (filter === 'banned') query = query.eq('banned_status', true);
        if (filter === 'shadowbanned') query = query.eq('shadowbanned', true);
        if (filter === 'suspended') query = query.gt('suspended_until', new Date().toISOString());
        if (filter === 'admins') query = query.eq('role', 'admin');

        // Apply search
        if (search) query = query.ilike('username', `%${search}%`);

        const { data: users, error } = await query;

        if (error) {
            console.error('Fetch users error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
            return;
        }

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// USER MODERATION ACTIONS
// ============================================

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user for a specified duration
 */
router.post('/users/:id/suspend', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { duration_hours, reason } = req.body;
        const adminId = req.user!.id;

        if (!duration_hours || duration_hours < 1) {
            res.status(400).json({ error: 'Duration must be at least 1 hour' });
            return;
        }

        const suspendedUntil = new Date(Date.now() + duration_hours * 60 * 60 * 1000);

        const { error } = await supabase
            .from('users')
            .update({ suspended_until: suspendedUntil.toISOString() })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to suspend user' });
            return;
        }

        // Log action
        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'suspend',
            reason,
            duration_hours,
            expires_at: suspendedUntil.toISOString(),
        });

        res.json({ message: `User suspended until ${suspendedUntil.toISOString()}` });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/unsuspend
 * Remove suspension from a user
 */
router.post('/users/:id/unsuspend', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const { error } = await supabase
            .from('users')
            .update({ suspended_until: null })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to unsuspend user' });
            return;
        }

        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'unsuspend',
            reason: 'Suspension lifted',
        });

        res.json({ message: 'User unsuspended' });
    } catch (error) {
        console.error('Unsuspend user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/shadowban
 * Shadowban a user (their content only visible to themselves)
 */
router.post('/users/:id/shadowban', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user!.id;

        const { error } = await supabase
            .from('users')
            .update({ shadowbanned: true })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to shadowban user' });
            return;
        }

        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'shadowban',
            reason,
        });

        res.json({ message: 'User shadowbanned' });
    } catch (error) {
        console.error('Shadowban user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/unshadowban
 * Remove shadowban from a user
 */
router.post('/users/:id/unshadowban', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const { error } = await supabase
            .from('users')
            .update({ shadowbanned: false })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to unshadowban user' });
            return;
        }

        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'unshadowban',
            reason: 'Shadowban lifted',
        });

        res.json({ message: 'User unshadowbanned' });
    } catch (error) {
        console.error('Unshadowban user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/ban-timed
 * Ban a user for a specified duration
 */
router.post('/users/:id/ban-timed', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { duration_hours, reason } = req.body;
        const adminId = req.user!.id;

        if (!duration_hours || duration_hours < 1) {
            res.status(400).json({ error: 'Duration must be at least 1 hour' });
            return;
        }

        const bannedUntil = new Date(Date.now() + duration_hours * 60 * 60 * 1000);

        const { error } = await supabase
            .from('users')
            .update({
                banned_status: true,
                banned_until: bannedUntil.toISOString()
            })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to ban user' });
            return;
        }

        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'ban_timed',
            reason,
            duration_hours,
            expires_at: bannedUntil.toISOString(),
        });

        res.json({ message: `User banned until ${bannedUntil.toISOString()}` });
    } catch (error) {
        console.error('Timed ban error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/restrict-posting
 * Restrict user's ability to post for a duration
 */
router.post('/users/:id/restrict-posting', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { duration_hours, reason } = req.body;
        const adminId = req.user!.id;

        if (!duration_hours || duration_hours < 1) {
            res.status(400).json({ error: 'Duration must be at least 1 hour' });
            return;
        }

        const restrictedUntil = new Date(Date.now() + duration_hours * 60 * 60 * 1000);

        const { error } = await supabase
            .from('users')
            .update({ post_restricted_until: restrictedUntil.toISOString() })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to restrict posting' });
            return;
        }

        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'restrict_posting',
            reason,
            duration_hours,
            expires_at: restrictedUntil.toISOString(),
        });

        res.json({ message: `Posting restricted until ${restrictedUntil.toISOString()}` });
    } catch (error) {
        console.error('Restrict posting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/admin/users/:id/unrestrict-posting
 * Remove posting restriction from a user
 */
router.post('/users/:id/unrestrict-posting', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const { error } = await supabase
            .from('users')
            .update({ post_restricted_until: null })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: 'Failed to unrestrict posting' });
            return;
        }

        await supabase.from('moderation_actions').insert({
            admin_id: adminId,
            target_user_id: id,
            action_type: 'unrestrict_posting',
            reason: 'Posting restriction lifted',
        });

        res.json({ message: 'Posting restriction removed' });
    } catch (error) {
        console.error('Unrestrict posting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/moderation-history/:userId
 * Get moderation history for a user
 */
router.get('/moderation-history/:userId', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const { data: history, error } = await supabase
            .from('moderation_actions')
            .select('*, admin:users!admin_id(username)')
            .eq('target_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            res.status(500).json({ error: 'Failed to fetch history' });
            return;
        }

        res.json({ history });
    } catch (error) {
        console.error('Get moderation history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
