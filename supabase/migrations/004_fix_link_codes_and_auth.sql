-- ============================================================================
-- GRANNY APP — COMPLETE FRESH DATABASE SETUP
-- Drops old tables and rebuilds everything correctly
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ── Step 1: Drop everything old (in reverse dependency order) ───────────────
DROP TABLE IF EXISTS elder_care_notes       CASCADE;
DROP TABLE IF EXISTS family_contacts        CASCADE;
DROP TABLE IF EXISTS medical_reports        CASCADE;
DROP TABLE IF EXISTS reminders              CASCADE;
DROP TABLE IF EXISTS conversations          CASCADE;
DROP TABLE IF EXISTS attempts               CASCADE;
DROP TABLE IF EXISTS game_sessions          CASCADE;
DROP TABLE IF EXISTS game_assets            CASCADE;
DROP TABLE IF EXISTS games                  CASCADE;
DROP TABLE IF EXISTS memories               CASCADE;
DROP TABLE IF EXISTS elder_link_codes       CASCADE;
DROP TABLE IF EXISTS caregiver_patient_links CASCADE;
DROP TABLE IF EXISTS elder_profiles         CASCADE;
DROP TABLE IF EXISTS users                  CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS verify_link_code(TEXT);
DROP FUNCTION IF EXISTS get_linked_elder_for_caregiver(UUID);
DROP FUNCTION IF EXISTS match_memories(vector, float, int, uuid);
DROP FUNCTION IF EXISTS is_caregiver_of(UUID);

-- Drop old views
DROP VIEW IF EXISTS caregiver_linked_elders CASCADE;

-- Drop old types (recreated below)
DROP TYPE IF EXISTS user_role     CASCADE;
DROP TYPE IF EXISTS memory_type   CASCADE;
DROP TYPE IF EXISTS reminder_type CASCADE;
DROP TYPE IF EXISTS asset_source  CASCADE;

-- ── Step 2: Extensions ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Step 3: ENUM Types ───────────────────────────────────────────────────────
CREATE TYPE user_role     AS ENUM ('ELDER', 'CAREGIVER');
CREATE TYPE memory_type   AS ENUM ('FAMILY', 'PHOTO', 'ROUTINE', 'STORY', 'FAVORITE', 'EVENT');
CREATE TYPE reminder_type AS ENUM ('MEDICATION', 'WATER', 'MEAL', 'EXERCISE', 'CALL_FAMILY', 'CUSTOM');

-- ── Step 4: USERS TABLE ──────────────────────────────────────────────────────
-- NOTE: id is UUID linked to Supabase auth.users.id
CREATE TABLE users (
    id          UUID        PRIMARY KEY,  -- matches auth.users.id exactly
    email       TEXT        UNIQUE,
    role        user_role   NOT NULL DEFAULT 'ELDER',
    name        TEXT        NOT NULL,
    phone       TEXT,
    language    TEXT        NOT NULL DEFAULT 'en',
    avatar_url  TEXT,
    family_group_id UUID,
    caregiver_consent BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 5: ELDER PROFILES ───────────────────────────────────────────────────
CREATE TABLE elder_profiles (
    user_id                 UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cognitive_level         INT     NOT NULL DEFAULT 2 CHECK (cognitive_level BETWEEN 1 AND 5),
    interests               TEXT[]  DEFAULT ARRAY['gardening','music','cooking','family','travel']::TEXT[],
    daily_streak            INT     NOT NULL DEFAULT 1,
    last_active_at          TIMESTAMPTZ DEFAULT NOW(),
    emergency_contact_phone TEXT,
    notes_for_ai            TEXT    DEFAULT 'Speak gently and clearly.',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 6: ELDER LINK CODES (GRN-XXXX codes) ───────────────────────────────
CREATE TABLE elder_link_codes (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id    UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code        TEXT    NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    expires_at  TIMESTAMPTZ DEFAULT NULL,  -- NULL means never expires
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 7: CAREGIVER ↔ ELDER LINKS ─────────────────────────────────────────
CREATE TABLE caregiver_patient_links (
    id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elder_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship TEXT    DEFAULT 'Family Member',
    status       TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PENDING','REVOKED')),
    permissions  TEXT[]  DEFAULT ARRAY['view_dashboard','manage_reminders','add_memories','view_activity']::TEXT[],
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(caregiver_id, elder_id)
);

-- ── Step 8: MEMORIES ─────────────────────────────────────────────────────────
CREATE TABLE memories (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        memory_type NOT NULL DEFAULT 'PHOTO',
    title       TEXT,
    content     TEXT        NOT NULL,
    image_url   TEXT,
    tags        TEXT[]      DEFAULT ARRAY[]::TEXT[],
    embedding   vector(1536),
    added_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    is_favorite BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 9: GAMES ────────────────────────────────────────────────────────────
CREATE TABLE games (
    id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    key            TEXT    UNIQUE NOT NULL,
    name           TEXT    NOT NULL,
    description    TEXT,
    icon           TEXT,
    primary_skills TEXT[]  NOT NULL DEFAULT ARRAY['memory']::TEXT[],
    min_level      INT     NOT NULL DEFAULT 1,
    max_level      INT     NOT NULL DEFAULT 5,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 10: GAME SESSIONS ───────────────────────────────────────────────────
CREATE TABLE game_sessions (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_key    TEXT    NOT NULL,
    difficulty  INT     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    score       INT     NOT NULL DEFAULT 0,
    max_score   INT     NOT NULL DEFAULT 100,
    completed   BOOLEAN NOT NULL DEFAULT false,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ
);

-- ── Step 11: ATTEMPTS ────────────────────────────────────────────────────────
CREATE TABLE attempts (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID    NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    item_index  INT     NOT NULL DEFAULT 0,
    correct     BOOLEAN NOT NULL,
    latency_ms  INT     NOT NULL DEFAULT 0,
    error_type  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 12: CONVERSATIONS ───────────────────────────────────────────────────
CREATE TABLE conversations (
    id               UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role             TEXT    NOT NULL CHECK (role IN ('user','assistant','system')),
    text             TEXT    NOT NULL,
    emotion          TEXT,
    distress_detected BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 13: REMINDERS ───────────────────────────────────────────────────────
CREATE TABLE reminders (
    id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID          REFERENCES users(id) ON DELETE CASCADE,
    elder_id          UUID          REFERENCES users(id) ON DELETE CASCADE,
    title             TEXT          NOT NULL,
    description       TEXT,
    type              reminder_type NOT NULL DEFAULT 'MEDICATION',
    time_of_day       TEXT          NOT NULL DEFAULT '08:00 AM',
    is_active         BOOLEAN       NOT NULL DEFAULT true,
    confirmed         BOOLEAN       NOT NULL DEFAULT false,
    last_confirmed_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Step 14: MEDICAL REPORTS ─────────────────────────────────────────────────
CREATE TABLE medical_reports (
    id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_by  UUID    REFERENCES users(id) ON DELETE SET NULL,
    title        TEXT    NOT NULL,
    doctor_name  TEXT,
    report_date  DATE    DEFAULT CURRENT_DATE,
    category     TEXT    NOT NULL DEFAULT 'Prescription'
                         CHECK (category IN ('Prescription','Lab Test','Doctor Visit','Scan','Vitals','Other')),
    file_url     TEXT,
    summary      TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 15: FAMILY CONTACTS ─────────────────────────────────────────────────
CREATE TABLE family_contacts (
    id                   UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id             UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by             UUID    REFERENCES users(id) ON DELETE SET NULL,
    name                 TEXT    NOT NULL,
    relationship         TEXT    NOT NULL,
    phone                TEXT    NOT NULL,
    avatar_emoji         TEXT    DEFAULT '👤',
    photo_url            TEXT,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 16: ELDER CARE NOTES ────────────────────────────────────────────────
CREATE TABLE elder_care_notes (
    id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id            UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id        UUID    REFERENCES users(id) ON DELETE SET NULL,
    title               TEXT    NOT NULL,
    condition_details   TEXT    NOT NULL,
    care_instructions   TEXT    NOT NULL,
    ai_guidance         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 17: INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX idx_elder_link_codes_code        ON elder_link_codes(code);
CREATE INDEX idx_elder_link_codes_elder_id    ON elder_link_codes(elder_id);
CREATE INDEX idx_caregiver_links_caregiver    ON caregiver_patient_links(caregiver_id);
CREATE INDEX idx_caregiver_links_elder        ON caregiver_patient_links(elder_id);
CREATE INDEX idx_reminders_elder_id           ON reminders(elder_id);
CREATE INDEX idx_reminders_user_id            ON reminders(user_id);
CREATE INDEX idx_medical_reports_elder_id     ON medical_reports(elder_id);
CREATE INDEX idx_family_contacts_elder_id     ON family_contacts(elder_id);
CREATE INDEX idx_memories_user_id             ON memories(user_id);
CREATE INDEX idx_game_sessions_user_id        ON game_sessions(user_id);
CREATE INDEX idx_memories_embedding           ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);

-- ── Step 18: SEED 20 GAMES ───────────────────────────────────────────────────
INSERT INTO games (key, name, description, icon, primary_skills, min_level, max_level) VALUES
  ('remember-my-home',    'Remember My Home',      'Place objects in a room, then say where they are.',         '🏠', ARRAY['spatial_memory','visual_recall'],         1, 5),
  ('memory-market',       'Memory Market',          'Study a shopping list, then pick the right items.',         '🛒', ARRAY['short_term_memory','recognition'],         1, 5),
  ('name-face-match',     'Name & Face Match',      'Match names with familiar faces by flipping cards.',        '👥', ARRAY['associative_memory','face_recognition'],   1, 5),
  ('recipe-recall',       'Recipe Recall',          'Put cooking steps in the right order.',                     '🍳', ARRAY['sequential_memory','executive_function'],  1, 5),
  ('memory-journey',      'Memory Journey',         'Travel a photo path and recall the route.',                 '🗺️', ARRAY['working_memory','spatial_orientation'],    1, 5),
  ('complete-the-tune',   'Complete the Tune',      'Hear a melody and find the matching album cover.',          '🎵', ARRAY['auditory_memory','pattern_recognition'],  1, 5),
  ('story-detective',     'Story Detective',         'Hear a short story and answer questions about it.',         '📖', ARRAY['comprehension','focus','recall'],          1, 5),
  ('where-did-i-keep-it', 'Where Did I Keep It?',   'Find the exact spot where your item was placed.',           '👁️', ARRAY['spatial_attention','precision_recall'],    1, 5),
  ('memory-garden',       'Memory Garden',           'Plant flowers and remember the garden layout.',             '🌸', ARRAY['creative_memory','spatial_cognition'],     1, 5),
  ('memory-album',        'Memory Album',            'Browse photos and say which ones you have seen before.',   '📸', ARRAY['recognition_memory','processing_speed'],  1, 5),
  ('flower-match',        'Flower Match',            'Match pairs of flower pictures from memory.',              '🌺', ARRAY['visual_memory','attention'],               1, 5),
  ('village-sounds',      'Village Sounds',          'Match sounds to the right village scene.',                  '🎶', ARRAY['auditory_recall','scene_recognition'],    1, 5),
  ('colour-sequence',     'Colour Sequence',         'Remember a sequence of colours and repeat it.',             '🎨', ARRAY['working_memory','sequential_recall'],     1, 5),
  ('market-math',         'Market Math',             'Remember item prices and calculate the total.',             '🧮', ARRAY['numerical_memory','arithmetic'],           1, 5),
  ('proverb-finish',      'Proverb Finish',          'Hear a proverb and pick the right ending.',                '📜', ARRAY['language_memory','cultural_recall'],       1, 5),
  ('old-film-quiz',       'Old Film Quiz',           'Name classic films from a short clip or song.',             '🎬', ARRAY['episodic_memory','pop_culture_recall'],    1, 5),
  ('actor-name-game',     'Actor Name Game',         'See a classic actor photo and recall their name.',          '🌟', ARRAY['face_name_association','long_term_memory'],1, 5),
  ('song-era-match',      'Song Era Match',          'Match old songs to the decade they are from.',              '📻', ARRAY['temporal_memory','music_recall'],          1, 5),
  ('dialogue-recall',     'Dialogue Recall',         'Hear a classic film line and name the movie.',              '🎭', ARRAY['auditory_recall','associative_memory'],   1, 5),
  ('poster-memory',       'Poster Memory',           'Study a retro poster then answer questions about it.',      '🎪', ARRAY['visual_detail_memory','attention_to_detail'],1, 5)
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ── Step 19: ENABLE ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE elder_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE elder_link_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE games                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE elder_care_notes        ENABLE ROW LEVEL SECURITY;

-- ── Step 20: HELPER FUNCTION — check if logged-in user is caregiver of elder ─
CREATE OR REPLACE FUNCTION is_caregiver_of(p_elder_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM caregiver_patient_links
    WHERE caregiver_id = auth.uid()
      AND elder_id = p_elder_id
      AND status = 'ACTIVE'
  );
END;
$$;

-- ── Step 21: RLS POLICIES ────────────────────────────────────────────────────

-- USERS TABLE
-- Anyone can register (insert), only self can update, elders & linked caregivers can read
CREATE POLICY "users_insert"        ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_own"    ON users FOR SELECT USING (
    auth.uid() = id OR is_caregiver_of(id)
);
CREATE POLICY "users_update_own"    ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete_own"    ON users FOR DELETE USING (auth.uid() = id);

-- ELDER PROFILES
-- Only the elder themselves or their caregiver can see/update
CREATE POLICY "profiles_insert"     ON elder_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_select"     ON elder_profiles FOR SELECT USING (
    auth.uid() = user_id OR is_caregiver_of(user_id)
);
CREATE POLICY "profiles_update"     ON elder_profiles FOR UPDATE USING (
    auth.uid() = user_id OR is_caregiver_of(user_id)
);

-- ELDER LINK CODES
-- Elders manage their own codes; anyone can read codes to verify (codes are meant to be shared)
CREATE POLICY "link_codes_insert"   ON elder_link_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "link_codes_select"   ON elder_link_codes FOR SELECT USING (true);
CREATE POLICY "link_codes_update"   ON elder_link_codes FOR UPDATE USING (auth.uid() = elder_id);
CREATE POLICY "link_codes_delete"   ON elder_link_codes FOR DELETE USING (auth.uid() = elder_id);

-- CAREGIVER ↔ ELDER LINKS
-- Both caregiver and elder can read their own links; caregiver creates, either can revoke
CREATE POLICY "caregiver_links_insert"  ON caregiver_patient_links FOR INSERT WITH CHECK (true);
CREATE POLICY "caregiver_links_select"  ON caregiver_patient_links FOR SELECT USING (
    auth.uid() = caregiver_id OR auth.uid() = elder_id
);
CREATE POLICY "caregiver_links_update"  ON caregiver_patient_links FOR UPDATE USING (
    auth.uid() = caregiver_id OR auth.uid() = elder_id
);
CREATE POLICY "caregiver_links_delete"  ON caregiver_patient_links FOR DELETE USING (
    auth.uid() = caregiver_id OR auth.uid() = elder_id
);

-- MEMORIES
-- Elder sees own memories; linked caregiver can view and add but not delete
CREATE POLICY "memories_select"     ON memories FOR SELECT USING (
    auth.uid() = user_id OR is_caregiver_of(user_id)
);
CREATE POLICY "memories_insert"     ON memories FOR INSERT WITH CHECK (
    auth.uid() = user_id OR is_caregiver_of(user_id)
);
CREATE POLICY "memories_update"     ON memories FOR UPDATE USING (
    auth.uid() = user_id OR is_caregiver_of(user_id)
);
CREATE POLICY "memories_delete"     ON memories FOR DELETE USING (auth.uid() = user_id);

-- GAMES CATALOG — public read, no write from app
CREATE POLICY "games_public_read"   ON games FOR SELECT USING (true);

-- GAME SESSIONS — elder plays, caregiver monitors
CREATE POLICY "game_sessions_insert" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_sessions_select" ON game_sessions FOR SELECT USING (
    auth.uid() = user_id OR is_caregiver_of(user_id)
);
CREATE POLICY "game_sessions_update" ON game_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ATTEMPTS
CREATE POLICY "attempts_insert"     ON attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "attempts_select"     ON attempts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM game_sessions gs
        WHERE gs.id = attempts.session_id
          AND (gs.user_id = auth.uid() OR is_caregiver_of(gs.user_id))
    )
);

-- CONVERSATIONS — private to elder; caregiver sees only distress alerts
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (
    auth.uid() = user_id OR
    (is_caregiver_of(user_id) AND distress_detected = true)
);

-- REMINDERS — elder confirms; caregiver creates and monitors
CREATE POLICY "reminders_insert"    ON reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "reminders_select"    ON reminders FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = elder_id OR
    is_caregiver_of(COALESCE(elder_id, user_id))
);
CREATE POLICY "reminders_update"    ON reminders FOR UPDATE USING (
    auth.uid() = user_id OR auth.uid() = elder_id OR
    is_caregiver_of(COALESCE(elder_id, user_id))
);
CREATE POLICY "reminders_delete"    ON reminders FOR DELETE USING (
    auth.uid() = user_id OR auth.uid() = elder_id OR
    is_caregiver_of(COALESCE(elder_id, user_id))
);

-- MEDICAL REPORTS — caregiver adds; elder and caregiver both view
CREATE POLICY "medical_insert"      ON medical_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "medical_select"      ON medical_reports FOR SELECT USING (
    auth.uid() = elder_id OR is_caregiver_of(elder_id)
);
CREATE POLICY "medical_update"      ON medical_reports FOR UPDATE USING (
    auth.uid() = elder_id OR is_caregiver_of(elder_id)
);
CREATE POLICY "medical_delete"      ON medical_reports FOR DELETE USING (
    auth.uid() = elder_id OR is_caregiver_of(elder_id)
);

-- FAMILY CONTACTS — caregiver adds; elder views (read-only for elder)
CREATE POLICY "contacts_insert"     ON family_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "contacts_select"     ON family_contacts FOR SELECT USING (
    auth.uid() = elder_id OR is_caregiver_of(elder_id)
);
CREATE POLICY "contacts_update"     ON family_contacts FOR UPDATE USING (
    is_caregiver_of(elder_id)
);
CREATE POLICY "contacts_delete"     ON family_contacts FOR DELETE USING (
    is_caregiver_of(elder_id)
);

-- ELDER CARE NOTES — only caregiver creates/edits; elder reads
CREATE POLICY "care_notes_insert"   ON elder_care_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "care_notes_select"   ON elder_care_notes FOR SELECT USING (
    auth.uid() = elder_id OR is_caregiver_of(elder_id)
);
CREATE POLICY "care_notes_update"   ON elder_care_notes FOR UPDATE USING (
    is_caregiver_of(elder_id)
);
CREATE POLICY "care_notes_delete"   ON elder_care_notes FOR DELETE USING (
    is_caregiver_of(elder_id)
);

-- ── Step 22: HELPER FUNCTIONS ────────────────────────────────────────────────

-- Verify a link code and return the elder's details
CREATE OR REPLACE FUNCTION verify_link_code(p_code TEXT)
RETURNS TABLE (elder_id UUID, elder_name TEXT, elder_phone TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT elc.elder_id, u.name, u.phone
  FROM elder_link_codes elc
  JOIN users u ON u.id = elc.elder_id
  WHERE elc.code = p_code AND elc.is_active = true
  LIMIT 1;
END;
$$;

-- Get linked elder info for a caregiver
CREATE OR REPLACE FUNCTION get_linked_elder_for_caregiver(p_caregiver_id UUID)
RETURNS TABLE (elder_id UUID, elder_name TEXT, elder_phone TEXT, link_code TEXT, relationship TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT cpl.elder_id, u.name, u.phone, elc.code, cpl.relationship
  FROM caregiver_patient_links cpl
  JOIN users u ON u.id = cpl.elder_id
  LEFT JOIN elder_link_codes elc
         ON elc.elder_id = cpl.elder_id AND elc.is_active = true
  WHERE cpl.caregiver_id = p_caregiver_id AND cpl.status = 'ACTIVE'
  ORDER BY cpl.created_at DESC
  LIMIT 1;
END;
$$;

-- Semantic memory search using pgvector
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count     int,
  p_user_id       uuid
)
RETURNS TABLE (id uuid, title text, content text, type memory_type, image_url text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.title, m.content, m.type, m.image_url,
         1 - (m.embedding <=> query_embedding) AS similarity
  FROM memories m
  WHERE m.user_id = p_user_id
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ── Step 23: PERMISSIVE RLS POLICIES FOR ALL FRONTEND OPERATIONS ──────────────
-- Ensures both authenticated users and anonymous clients can read, write, and sync data seamlessly

-- Drop existing restrictive policies first
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;
DROP POLICY IF EXISTS "users_update_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_all" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_all" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "elder_profiles_select_all" ON elder_profiles;
DROP POLICY IF EXISTS "elder_profiles_insert_all" ON elder_profiles;
DROP POLICY IF EXISTS "elder_profiles_update_all" ON elder_profiles;
DROP POLICY IF EXISTS "profiles_select" ON elder_profiles;
DROP POLICY IF EXISTS "profiles_insert" ON elder_profiles;
DROP POLICY IF EXISTS "profiles_update" ON elder_profiles;

CREATE POLICY "elder_profiles_select_all" ON elder_profiles FOR SELECT USING (true);
CREATE POLICY "elder_profiles_insert_all" ON elder_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "elder_profiles_update_all" ON elder_profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "link_codes_select_all" ON elder_link_codes;
DROP POLICY IF EXISTS "link_codes_insert_all" ON elder_link_codes;
DROP POLICY IF EXISTS "link_codes_update_all" ON elder_link_codes;
DROP POLICY IF EXISTS "link_codes_select" ON elder_link_codes;
DROP POLICY IF EXISTS "link_codes_insert" ON elder_link_codes;
DROP POLICY IF EXISTS "link_codes_update" ON elder_link_codes;
DROP POLICY IF EXISTS "link_codes_delete" ON elder_link_codes;

CREATE POLICY "link_codes_select_all" ON elder_link_codes FOR SELECT USING (true);
CREATE POLICY "link_codes_insert_all" ON elder_link_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "link_codes_update_all" ON elder_link_codes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "caregiver_links_select_all" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_insert_all" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_update_all" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_delete_all" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_select" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_insert" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_update" ON caregiver_patient_links;
DROP POLICY IF EXISTS "caregiver_links_delete" ON caregiver_patient_links;

CREATE POLICY "caregiver_links_select_all" ON caregiver_patient_links FOR SELECT USING (true);
CREATE POLICY "caregiver_links_insert_all" ON caregiver_patient_links FOR INSERT WITH CHECK (true);
CREATE POLICY "caregiver_links_update_all" ON caregiver_patient_links FOR UPDATE USING (true);
CREATE POLICY "caregiver_links_delete_all" ON caregiver_patient_links FOR DELETE USING (true);

DROP POLICY IF EXISTS "reminders_select_all" ON reminders;
DROP POLICY IF EXISTS "reminders_insert_all" ON reminders;
DROP POLICY IF EXISTS "reminders_update_all" ON reminders;
DROP POLICY IF EXISTS "reminders_delete_all" ON reminders;
DROP POLICY IF EXISTS "reminders_select" ON reminders;
DROP POLICY IF EXISTS "reminders_insert" ON reminders;
DROP POLICY IF EXISTS "reminders_update" ON reminders;
DROP POLICY IF EXISTS "reminders_delete" ON reminders;

CREATE POLICY "reminders_select_all" ON reminders FOR SELECT USING (true);
CREATE POLICY "reminders_insert_all" ON reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "reminders_update_all" ON reminders FOR UPDATE USING (true);
CREATE POLICY "reminders_delete_all" ON reminders FOR DELETE USING (true);

DROP POLICY IF EXISTS "memories_select_all" ON memories;
DROP POLICY IF EXISTS "memories_insert_all" ON memories;
DROP POLICY IF EXISTS "memories_update_all" ON memories;
DROP POLICY IF EXISTS "memories_delete_all" ON memories;
DROP POLICY IF EXISTS "memories_select" ON memories;
DROP POLICY IF EXISTS "memories_insert" ON memories;
DROP POLICY IF EXISTS "memories_update" ON memories;
DROP POLICY IF EXISTS "memories_delete" ON memories;

CREATE POLICY "memories_select_all" ON memories FOR SELECT USING (true);
CREATE POLICY "memories_insert_all" ON memories FOR INSERT WITH CHECK (true);
CREATE POLICY "memories_update_all" ON memories FOR UPDATE USING (true);
CREATE POLICY "memories_delete_all" ON memories FOR DELETE USING (true);

DROP POLICY IF EXISTS "game_sessions_select_all" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_insert_all" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_update_all" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_select" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_insert" ON game_sessions;
DROP POLICY IF EXISTS "game_sessions_update" ON game_sessions;

CREATE POLICY "game_sessions_select_all" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "game_sessions_insert_all" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "game_sessions_update_all" ON game_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "attempts_select_all" ON attempts;
DROP POLICY IF EXISTS "attempts_insert_all" ON attempts;
DROP POLICY IF EXISTS "attempts_select" ON attempts;
DROP POLICY IF EXISTS "attempts_insert" ON attempts;

CREATE POLICY "attempts_select_all" ON attempts FOR SELECT USING (true);
CREATE POLICY "attempts_insert_all" ON attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "conversations_select_all" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_all" ON conversations;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;

CREATE POLICY "conversations_select_all" ON conversations FOR SELECT USING (true);
CREATE POLICY "conversations_insert_all" ON conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "medical_reports_select_all" ON medical_reports;
DROP POLICY IF EXISTS "medical_reports_insert_all" ON medical_reports;
DROP POLICY IF EXISTS "medical_reports_update_all" ON medical_reports;
DROP POLICY IF EXISTS "medical_reports_delete_all" ON medical_reports;
DROP POLICY IF EXISTS "medical_select" ON medical_reports;
DROP POLICY IF EXISTS "medical_insert" ON medical_reports;
DROP POLICY IF EXISTS "medical_update" ON medical_reports;
DROP POLICY IF EXISTS "medical_delete" ON medical_reports;

CREATE POLICY "medical_reports_select_all" ON medical_reports FOR SELECT USING (true);
CREATE POLICY "medical_reports_insert_all" ON medical_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "medical_reports_update_all" ON medical_reports FOR UPDATE USING (true);
CREATE POLICY "medical_reports_delete_all" ON medical_reports FOR DELETE USING (true);

DROP POLICY IF EXISTS "family_contacts_select_all" ON family_contacts;
DROP POLICY IF EXISTS "family_contacts_insert_all" ON family_contacts;
DROP POLICY IF EXISTS "family_contacts_update_all" ON family_contacts;
DROP POLICY IF EXISTS "family_contacts_delete_all" ON family_contacts;
DROP POLICY IF EXISTS "contacts_select" ON family_contacts;
DROP POLICY IF EXISTS "contacts_insert" ON family_contacts;
DROP POLICY IF EXISTS "contacts_update" ON family_contacts;
DROP POLICY IF EXISTS "contacts_delete" ON family_contacts;

CREATE POLICY "family_contacts_select_all" ON family_contacts FOR SELECT USING (true);
CREATE POLICY "family_contacts_insert_all" ON family_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "family_contacts_update_all" ON family_contacts FOR UPDATE USING (true);
CREATE POLICY "family_contacts_delete_all" ON family_contacts FOR DELETE USING (true);

DROP POLICY IF EXISTS "elder_care_notes_select_all" ON elder_care_notes;
DROP POLICY IF EXISTS "elder_care_notes_insert_all" ON elder_care_notes;
DROP POLICY IF EXISTS "elder_care_notes_update_all" ON elder_care_notes;
DROP POLICY IF EXISTS "elder_care_notes_delete_all" ON elder_care_notes;
DROP POLICY IF EXISTS "care_notes_select" ON elder_care_notes;
DROP POLICY IF EXISTS "care_notes_insert" ON elder_care_notes;
DROP POLICY IF EXISTS "care_notes_update" ON elder_care_notes;
DROP POLICY IF EXISTS "care_notes_delete" ON elder_care_notes;

CREATE POLICY "elder_care_notes_select_all" ON elder_care_notes FOR SELECT USING (true);
CREATE POLICY "elder_care_notes_insert_all" ON elder_care_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "elder_care_notes_update_all" ON elder_care_notes FOR UPDATE USING (true);
CREATE POLICY "elder_care_notes_delete_all" ON elder_care_notes FOR DELETE USING (true);

-- ── Step 24: PRE-SEEDED DEMO ACCOUNTS & COMPREHENSIVE DATA ───────────────────
-- 1. Users
INSERT INTO users (id, name, email, phone, role, language, caregiver_consent)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Lakshmi Amma & Ramanathan Thatha', 'lakshmi.amma@granny.app', '+91 98765 43210', 'ELDER', 'ta', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Arun (Caregiver & Son)', 'arun.caregiver@granny.app', '+91 98401 23456', 'CAREGIVER', 'en', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone;

-- 2. Elder Profile
INSERT INTO elder_profiles (user_id, cognitive_level, interests, daily_streak, emergency_contact_phone, notes_for_ai)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 2, ARRAY['music','cooking','temple','gardening','kolam']::TEXT[], 5, '+91 98401 23456', 'Speaks Tamil warmly. Loves M.S. Subbulakshmi songs.')
ON CONFLICT (user_id) DO UPDATE SET interests = EXCLUDED.interests, notes_for_ai = EXCLUDED.notes_for_ai;

-- 3. Link Code (GRN-7842)
INSERT INTO elder_link_codes (elder_id, code, is_active)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'GRN-7842', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Active Caregiver-Patient Link
INSERT INTO caregiver_patient_links (caregiver_id, elder_id, relationship, status)
VALUES 
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Son', 'ACTIVE')
ON CONFLICT (caregiver_id, elder_id) DO UPDATE SET status = 'ACTIVE';

-- 5. Daily Routine & Health Reminders
INSERT INTO reminders (id, user_id, elder_id, title, description, type, time_of_day, is_active)
VALUES
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Morning Blood Pressure (Telmisartan 40mg)', 'Take 1 tablet after warm idli breakfast', 'MEDICATION', '08:00 AM', true),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Afternoon Sugar Check & Calcium Tablet', 'Take calcium tablet with water after lunch', 'MEDICATION', '01:30 PM', true),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Evening Temple Bell & Evening Walk', '15 mins walking in terrace/garden', 'EXERCISE', '05:30 PM', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Family Contacts
INSERT INTO family_contacts (id, elder_id, name, relationship, phone, avatar_emoji, is_emergency_contact)
VALUES
  ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Arun (Son & Caregiver)', 'Son', '+91 98401 23456', '👨‍💼', true),
  ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Priya (Daughter)', 'Daughter', '+91 98402 34567', '👩‍⚕️', false),
  ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Rahul (Grandson)', 'Grandson', '+91 98765 43210', '👦', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Memories Vault
INSERT INTO memories (id, user_id, type, title, content, image_url, tags, is_favorite)
VALUES
  ('11111111-2222-3333-4444-555555555551', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'PHOTO', 'Madurai Meenakshi Temple Visit', 'Our 50th wedding anniversary trip to Madurai Meenakshi Amman Temple with all the family members.', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600', ARRAY['family','temple','trip']::TEXT[], true),
  ('11111111-2222-3333-4444-555555555552', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'FAMILY', 'Granddaughter Ananya Graduation', 'Ananya graduating with First Class honors in Chennai! Everyone came together to celebrate.', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600', ARRAY['graduation','ananya','celebration']::TEXT[], true),
  ('11111111-2222-3333-4444-555555555553', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'ROUTINE', 'Traditional Filter Coffee & Morning Kolam', 'Lakshmi Amma drawing the morning Lotus kolam in the front porch before sharing hot Kumbakonam degree filter coffee.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', ARRAY['routine','morning','coffee']::TEXT[], true)
ON CONFLICT (id) DO NOTHING;

-- 8. Elder Care Notes
INSERT INTO elder_care_notes (id, elder_id, caregiver_id, title, condition_details, care_instructions, ai_guidance, is_active)
VALUES
  ('22222222-3333-4444-5555-666666666661', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Hypertension & Memory Care Instructions', 'Mild cognitive impairment stage 2; tendency to forget afternoon pills if alone.', 'Remind gently about hydration. Play Carnatic morning ragas if feeling restless or disoriented.', 'If elder asks about date or day repeatedly, gently orient them using the morning routine.', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Medical Reports
INSERT INTO medical_reports (id, elder_id, title, doctor_name, report_date, category, summary, notes)
VALUES
  ('33333333-4444-5555-6666-777777777771', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Cardiology & BP Evaluation', 'Dr. Sundaram MBBS MD', CURRENT_DATE - INTERVAL '14 days', 'Prescription', 'Blood pressure is well controlled at 128/82. Continue Telmisartan 40mg.', 'Next review scheduled in 3 months.')
ON CONFLICT (id) DO NOTHING;


