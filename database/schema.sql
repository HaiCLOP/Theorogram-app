-- Theorogram Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE, -- For Firebase Auth
  username TEXT UNIQUE NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  reputation_score INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  banned_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- THEORIES TABLE
-- =====================================================
CREATE TABLE theories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  refs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderation_status TEXT DEFAULT 'pending' CHECK (
    moderation_status IN ('pending', 'safe', 'nsfw', 'unsafe', 'shadowbanned')
  ),
  complexity_score INTEGER
);

CREATE INDEX idx_theories_user_id ON theories(user_id);
CREATE INDEX idx_theories_created_at ON theories(created_at DESC);
CREATE INDEX idx_theories_moderation_status ON theories(moderation_status);

-- Full-text search index
CREATE INDEX idx_theories_title_body_search ON theories USING gin(
  to_tsvector('english', title || ' ' || body)
);

-- =====================================================
-- VOTES TABLE
-- =====================================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theory_id UUID NOT NULL REFERENCES theories(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, theory_id)
);

CREATE INDEX idx_votes_theory_id ON votes(theory_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- =====================================================
-- STANCES TABLE
-- =====================================================
CREATE TABLE stances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theory_id UUID NOT NULL REFERENCES theories(id) ON DELETE CASCADE,
  stance_type TEXT NOT NULL CHECK (stance_type IN ('for', 'against')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, theory_id)
);

CREATE INDEX idx_stances_theory_id ON stances(theory_id);
CREATE INDEX idx_stances_user_id ON stances(user_id);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theory_id UUID NOT NULL REFERENCES theories(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_comments_theory_id ON comments(theory_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- =====================================================
-- MODERATION LOGS TABLE
-- =====================================================
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theory_id UUID NOT NULL REFERENCES theories(id) ON DELETE CASCADE,
  classification TEXT NOT NULL CHECK (classification IN ('safe', 'nsfw', 'unsafe')),
  confidence FLOAT,
  action_taken TEXT NOT NULL,
  gemini_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moderation_logs_theory_id ON moderation_logs(theory_id);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at DESC);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('theory', 'comment', 'user')),
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);

-- =====================================================
-- MATERIALIZED VIEW: THEORY STATS (For Performance)
-- =====================================================
CREATE MATERIALIZED VIEW theory_stats AS
SELECT 
  t.id AS theory_id,
  COUNT(DISTINCT CASE WHEN v.vote_type = 'upvote' THEN v.id END) AS upvotes,
  COUNT(DISTINCT CASE WHEN v.vote_type = 'downvote' THEN v.id END) AS downvotes,
  COUNT(DISTINCT CASE WHEN s.stance_type = 'for' THEN s.id END) AS for_count,
  COUNT(DISTINCT CASE WHEN s.stance_type = 'against' THEN s.id END) AS against_count,
  COUNT(DISTINCT CASE WHEN c.deleted_at IS NULL THEN c.id END) AS comment_count,
  (
    COUNT(DISTINCT v.id) + 
    COUNT(DISTINCT s.id) + 
    COUNT(DISTINCT CASE WHEN c.deleted_at IS NULL THEN c.id END)
  ) AS interaction_score
FROM theories t
LEFT JOIN votes v ON t.id = v.theory_id
LEFT JOIN stances s ON t.id = s.theory_id
LEFT JOIN comments c ON t.id = c.theory_id
GROUP BY t.id;

CREATE UNIQUE INDEX idx_theory_stats_theory_id ON theory_stats(theory_id);

-- Refresh function (call after vote/stance/comment changes)
CREATE OR REPLACE FUNCTION refresh_theory_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY theory_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (Optional - for Supabase)
-- =====================================================
-- Enable RLS on tables if using Supabase Auth directly
-- For now, backend handles all auth logic

-- ALTER TABLE theories ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Theories are viewable by everyone" ON theories FOR SELECT USING (moderation_status = 'safe');
