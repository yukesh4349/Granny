-- Granny Database Schema (PostgreSQL + pgvector for Supabase)
-- Cognitive Gaming, Memory Assistance, and AI Companion for Elderly Care

-- 1. Enable pgvector extension for semantic memory embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('ELDER', 'CAREGIVER');
CREATE TYPE memory_type AS ENUM ('FAMILY', 'PHOTO', 'ROUTINE', 'STORY', 'FAVORITE', 'EVENT');
CREATE TYPE asset_source AS ENUM ('pexels', 'pixabay', 'dicebear', 'pollinations', 'user_upload');
CREATE TYPE reminder_type AS ENUM ('MEDICATION', 'WATER', 'MEAL', 'EXERCISE', 'CALL_FAMILY', 'CUSTOM');

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'ELDER',
    name TEXT NOT NULL,
    phone TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    avatar_url TEXT,
    family_group_id UUID,
    caregiver_consent BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ELDER PROFILES
CREATE TABLE IF NOT EXISTS elder_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cognitive_level INT NOT NULL DEFAULT 2 CHECK (cognitive_level BETWEEN 1 AND 5),
    interests TEXT[] DEFAULT ARRAY['gardening', 'music', 'cooking', 'family', 'travel']::TEXT[],
    cultural_tags TEXT[] DEFAULT ARRAY['general']::TEXT[],
    daily_streak INT NOT NULL DEFAULT 1,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    emergency_contact_phone TEXT,
    notes_for_ai TEXT DEFAULT 'Enjoys talking about 1970s classical music, family memories, and cooking recipes. Speaks gently and clearly.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MEMORIES TABLE (with 1536-dim embeddings for RAG)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type memory_type NOT NULL DEFAULT 'PHOTO',
    title TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    embedding vector(1536),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for semantic vector search
CREATE INDEX IF NOT EXISTS memories_embedding_idx 
ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. GAMES CATALOG
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    primary_skills TEXT[] NOT NULL DEFAULT ARRAY['memory']::TEXT[],
    min_level INT NOT NULL DEFAULT 1,
    max_level INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. GAME SESSIONS
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_key TEXT NOT NULL REFERENCES games(key) ON DELETE CASCADE,
    difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 100,
    completed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 8. ATTEMPTS TABLE (Detailed cognitive telemetry for adaptive difficulty)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    item_index INT NOT NULL DEFAULT 0,
    correct BOOLEAN NOT NULL,
    latency_ms INT NOT NULL CHECK (latency_ms >= 0),
    error_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. GAME ASSETS TABLE
CREATE TABLE IF NOT EXISTS game_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_key TEXT NOT NULL REFERENCES games(key) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    source asset_source NOT NULL DEFAULT 'pexels',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    text TEXT NOT NULL,
    emotion TEXT,
    distress_detected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type reminder_type NOT NULL DEFAULT 'MEDICATION',
    time_of_day TIME NOT NULL,
    schedule_cron TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. SEED INITIAL 10 COGNITIVE GAMES
INSERT INTO games (key, name, description, icon, primary_skills, min_level, max_level)
VALUES
    ('remember-my-home', 'Remember My Home', 'Place objects into a living room scene, then remember where they were located.', 'Home', ARRAY['spatial_memory', 'visual_recall'], 1, 5),
    ('memory-market', 'Memory Market', 'Review a grocery shopping list with real photos, then select matching items in the market grid.', 'ShoppingCart', ARRAY['short_term_memory', 'recognition'], 1, 5),
    ('name-face-match', 'Name & Face Match', 'Flip matching cards to connect familiar friendly faces with their names.', 'Users', ARRAY['associative_memory', 'face_recognition'], 1, 5),
    ('recipe-recall', 'Recipe Recall', 'Sequence cooking step photographs in their correct culinary order.', 'Utensils', ARRAY['sequential_memory', 'executive_function'], 1, 5),
    ('memory-journey', 'Memory Journey', 'Travel through a scenic photographic path and recreate the journey sequence.', 'Navigation', ARRAY['working_memory', 'spatial_orientation'], 1, 5),
    ('complete-the-tune', 'Complete the Tune', 'Listen to a warm musical melody and identify the matching album cover.', 'Music', ARRAY['auditory_memory', 'pattern_recognition'], 1, 5),
    ('story-detective', 'Story Detective', 'Listen to an engaging illustrated short story and answer visual clues.', 'BookOpen', ARRAY['comprehension', 'focus', 'recall'], 1, 5),
    ('where-did-i-keep-it', 'Where Did I Keep It?', 'Spot the exact hotspot in the room where your cherished item was kept.', 'Eye', ARRAY['spatial_attention', 'precision_recall'], 1, 5),
    ('memory-garden', 'Memory Garden', 'Design a persistent tranquil garden by placing flowers and plants.', 'Flower2', ARRAY['creative_memory', 'spatial_cognition'], 1, 5),
    ('memory-album', 'Memory Album', 'Browse a photo album and identify which memories you have seen before.', 'Image', ARRAY['recognition_memory', 'processing_speed'], 1, 5)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    primary_skills = EXCLUDED.primary_skills;

-- 13. ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE elder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Public read for games catalog
CREATE POLICY "Public games read" ON games FOR SELECT USING (true);

-- Elder & Caregiver Family Policies (Users)
CREATE POLICY "Users access own or family" ON users
FOR ALL USING (
    auth.uid() = id OR 
    (family_group_id IS NOT NULL AND family_group_id IN (
        SELECT family_group_id FROM users WHERE id = auth.uid() AND caregiver_consent = true
    ))
);

-- Elder Profile Access
CREATE POLICY "Elder profile access" ON elder_profiles
FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = elder_profiles.user_id 
        AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
        AND u.caregiver_consent = true
    )
);

-- Memories Access
CREATE POLICY "Memories access" ON memories
FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = memories.user_id 
        AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
        AND u.caregiver_consent = true
    )
);

-- Game Sessions & Attempts Access
CREATE POLICY "Game sessions access" ON game_sessions
FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = game_sessions.user_id 
        AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Attempts access" ON attempts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM game_sessions gs 
        WHERE gs.id = attempts.session_id 
        AND (gs.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = gs.user_id 
            AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
        ))
    )
);

-- Game Assets Access
CREATE POLICY "Game assets access" ON game_assets
FOR ALL USING (
    user_id IS NULL OR 
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = game_assets.user_id 
        AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
    )
);

-- Conversations Access
CREATE POLICY "Conversations access" ON conversations
FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = conversations.user_id 
        AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
    )
);

-- Reminders Access
CREATE POLICY "Reminders access" ON reminders
FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = reminders.user_id 
        AND u.family_group_id = (SELECT family_group_id FROM users WHERE id = auth.uid())
    )
);

-- 14. HELPER FUNCTION: Vector Semantic Search for Companion RAG
CREATE OR REPLACE FUNCTION match_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  type memory_type,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.content,
    m.type,
    m.image_url,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memories m
  WHERE m.user_id = p_user_id
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
