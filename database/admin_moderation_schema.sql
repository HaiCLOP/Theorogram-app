-- =====================================================
-- THEOROGRAM ADMIN MODERATION SYSTEM
-- Complete SQL Schema Update
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- 1. Add is_mature column to theories
ALTER TABLE theories ADD COLUMN IF NOT EXISTS is_mature BOOLEAN DEFAULT FALSE;

-- 2. Update users table with moderation fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shadowbanned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_restricted_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create admin stats view for dashboard
CREATE OR REPLACE VIEW admin_stats AS
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE banned_status = false) as active_users,
    (SELECT COUNT(*) FROM users WHERE banned_status = true) as banned_users,
    (SELECT COUNT(*) FROM users WHERE shadowbanned = true) as shadowbanned_users,
    (SELECT COUNT(*) FROM users WHERE suspended_until > NOW()) as suspended_users,
    (SELECT COUNT(*) FROM users WHERE post_restricted_until > NOW()) as post_restricted_users,
    (SELECT COUNT(*) FROM users WHERE last_active_at > NOW() - INTERVAL '24 hours') as users_active_24h,
    (SELECT COUNT(*) FROM users WHERE last_active_at > NOW() - INTERVAL '7 days') as users_active_7d,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
    (SELECT COUNT(*) FROM theories) as total_theories,
    (SELECT COUNT(*) FROM theories WHERE moderation_status = 'safe') as published_theories,
    (SELECT COUNT(*) FROM theories WHERE moderation_status = 'shadowbanned') as shadowbanned_theories,
    (SELECT COUNT(*) FROM theories WHERE moderation_status = 'unsafe') as blocked_theories,
    (SELECT COUNT(*) FROM theories WHERE is_mature = true) as mature_theories,
    (SELECT COUNT(*) FROM theories WHERE created_at > NOW() - INTERVAL '24 hours') as new_theories_24h,
    (SELECT COUNT(*) FROM theories WHERE created_at > NOW() - INTERVAL '7 days') as new_theories_7d,
    (SELECT COUNT(*) FROM comments) as total_comments,
    (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '24 hours') as new_comments_24h,
    (SELECT COUNT(*) FROM votes) as total_votes,
    (SELECT COUNT(*) FROM stances) as total_stances,
    (SELECT pg_database_size(current_database()) / 1024 / 1024) as database_size_mb;

-- 4. Create moderation actions table for history
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    reason TEXT,
    duration_hours INTEGER,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES users(id)
);

-- 5. Create user reports table
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reported_theory_id UUID REFERENCES theories(id),
    reported_comment_id UUID REFERENCES comments(id),
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create function to update last_active_at
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_active_at = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers to track activity
DROP TRIGGER IF EXISTS track_theory_activity ON theories;
CREATE TRIGGER track_theory_activity
    AFTER INSERT ON theories
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

DROP TRIGGER IF EXISTS track_comment_activity ON comments;
CREATE TRIGGER track_comment_activity
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

DROP TRIGGER IF EXISTS track_vote_activity ON votes;
CREATE TRIGGER track_vote_activity
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

-- 8. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned_status);
CREATE INDEX IF NOT EXISTS idx_users_shadowbanned ON users(shadowbanned);
CREATE INDEX IF NOT EXISTS idx_theories_mature ON theories(is_mature);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);

-- 9. Grant access to authenticated users (RLS policies if needed)
-- Note: Only admins should access these via backend middleware

-- Done! Your database is now ready for the admin moderation system.
