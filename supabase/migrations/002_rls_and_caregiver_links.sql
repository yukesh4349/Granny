-- ============================================================================
-- Granny: Enhanced Row Level Security (RLS) & Caretaker Linking
-- Strict isolation: Users access only their own data; Caretakers access linked elders
-- ============================================================================

-- 1. Caregiver - Patient Linking Table
CREATE TABLE IF NOT EXISTS caregiver_patient_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship TEXT DEFAULT 'Family Member', -- 'Son', 'Daughter', 'Doctor', 'Nurse'
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'REVOKED')),
    permissions TEXT[] DEFAULT ARRAY['view_dashboard', 'manage_reminders', 'add_memories', 'view_activity']::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(caregiver_id, elder_id)
);

-- Enable RLS on caregiver_patient_links
ALTER TABLE caregiver_patient_links ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Functions (SECURITY DEFINER to avoid infinite recursion in RLS)
CREATE OR REPLACE FUNCTION is_caregiver_of(p_elder_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM caregiver_patient_links 
    WHERE caregiver_id = auth.uid() 
      AND elder_id = p_elder_id 
      AND status = 'ACTIVE'
  ) OR EXISTS (
    SELECT 1 FROM users u_elder
    JOIN users u_caregiver ON u_elder.family_group_id = u_caregiver.family_group_id
    WHERE u_elder.id = p_elder_id 
      AND u_caregiver.id = auth.uid()
      AND u_elder.caregiver_consent = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Policy definitions for all tables

-- Drop older policies if present to re-apply strictly
DROP POLICY IF EXISTS "Users access own or family" ON users;
DROP POLICY IF EXISTS "Elder profile access" ON elder_profiles;
DROP POLICY IF EXISTS "Memories access" ON memories;
DROP POLICY IF EXISTS "Game sessions access" ON game_sessions;
DROP POLICY IF EXISTS "Attempts access" ON attempts;
DROP POLICY IF EXISTS "Reminders access" ON reminders;
DROP POLICY IF EXISTS "Conversations access" ON conversations;
DROP POLICY IF EXISTS "Caregiver links access" ON caregiver_patient_links;

-- Users Table Policy: Read/Update own, or Caregivers can view their linked elder's info
CREATE POLICY "Users access own or linked" ON users
FOR SELECT USING (
    auth.uid() = id OR 
    is_caregiver_of(id)
);

CREATE POLICY "Users update own record" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own record" ON users
FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Elder Profiles Policy
CREATE POLICY "Elder profile access" ON elder_profiles
FOR SELECT USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Elder profile update" ON elder_profiles
FOR UPDATE USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Elder profile insert" ON elder_profiles
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NULL
);

-- Memories Policy: Elder has full CRUD; Caregiver can SELECT and INSERT
CREATE POLICY "Memories select" ON memories
FOR SELECT USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Memories insert" ON memories
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Memories update" ON memories
FOR UPDATE USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Memories delete" ON memories
FOR DELETE USING (
    auth.uid() = user_id
);

-- Reminders Policy: Both elder and linked caregiver can view, insert, and update
CREATE POLICY "Reminders select" ON reminders
FOR SELECT USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Reminders insert" ON reminders
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Reminders update" ON reminders
FOR UPDATE USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Reminders delete" ON reminders
FOR DELETE USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

-- Game Sessions & Attempts Policy: Caregiver can monitor elder's cognitive progress
CREATE POLICY "Game sessions select" ON game_sessions
FOR SELECT USING (
    auth.uid() = user_id OR 
    is_caregiver_of(user_id)
);

CREATE POLICY "Game sessions insert_update" ON game_sessions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Attempts select" ON attempts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM game_sessions gs 
        WHERE gs.id = attempts.session_id 
        AND (gs.user_id = auth.uid() OR is_caregiver_of(gs.user_id))
    )
);

CREATE POLICY "Attempts insert" ON attempts
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM game_sessions gs 
        WHERE gs.id = attempts.session_id 
        AND gs.user_id = auth.uid()
    )
);

-- Conversations Policy: Privacy-first (Elder owns conversation; Caregiver only if distress/consent)
CREATE POLICY "Conversations select" ON conversations
FOR SELECT USING (
    auth.uid() = user_id OR 
    (is_caregiver_of(user_id) AND distress_detected = true)
);

CREATE POLICY "Conversations insert" ON conversations
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Caregiver Patient Links Policy
CREATE POLICY "Caregiver links view" ON caregiver_patient_links
FOR SELECT USING (
    auth.uid() = caregiver_id OR 
    auth.uid() = elder_id
);

CREATE POLICY "Caregiver links manage" ON caregiver_patient_links
FOR ALL USING (
    auth.uid() = caregiver_id OR 
    auth.uid() = elder_id
);
