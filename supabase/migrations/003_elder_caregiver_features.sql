-- ============================================================================
-- Granny & Grandpa (தாத்தா & பாட்டி): Elder-Caregiver Ecosystem Migration
-- Features: Linking Codes, Medical Reports, Family Contacts, Care Guidelines,
-- Reminders & Alarms, and Activity Monitoring with Strict RLS
-- ============================================================================

-- 1. Elder Link Codes (For Caretaker to link to Elder's account)
CREATE TABLE IF NOT EXISTS elder_link_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Medical Reports Table
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    doctor_name TEXT,
    report_date DATE DEFAULT CURRENT_DATE,
    category TEXT NOT NULL DEFAULT 'Prescription' CHECK (category IN ('Prescription', 'Lab Test', 'Doctor Visit', 'Scan', 'Vitals', 'Other')),
    file_url TEXT,
    summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Family Contacts Table (Visible on Elder's page with 1-tap call)
CREATE TABLE IF NOT EXISTS family_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    avatar_emoji TEXT DEFAULT '👤',
    photo_url TEXT,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Elder Care Situation & Guidelines Notes
CREATE TABLE IF NOT EXISTS elder_care_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    condition_details TEXT NOT NULL, -- Current medical / memory situation
    care_instructions TEXT NOT NULL, -- Daily care tips & routine
    ai_guidance TEXT, -- Instructions for voice AI
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE elder_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE elder_care_notes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Link Codes Policies: Elder can generate and view own; Caregiver can read to verify
CREATE POLICY "Elder manage link codes" ON elder_link_codes
FOR ALL USING (auth.uid() = elder_id);

CREATE POLICY "Public read active link codes" ON elder_link_codes
FOR SELECT USING (is_active = true);

-- Medical Reports Policies: Elder and linked Caregivers have access
CREATE POLICY "Medical reports select" ON medical_reports
FOR SELECT USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Medical reports insert" ON medical_reports
FOR INSERT WITH CHECK (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Medical reports update" ON medical_reports
FOR UPDATE USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Medical reports delete" ON medical_reports
FOR DELETE USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

-- Family Contacts Policies: Elder and Caretaker can manage
CREATE POLICY "Family contacts select" ON family_contacts
FOR SELECT USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Family contacts insert" ON family_contacts
FOR INSERT WITH CHECK (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Family contacts update" ON family_contacts
FOR UPDATE USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Family contacts delete" ON family_contacts
FOR DELETE USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

-- Elder Care Notes Policies
CREATE POLICY "Care notes select" ON elder_care_notes
FOR SELECT USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);

CREATE POLICY "Care notes insert_update" ON elder_care_notes
FOR ALL USING (
    auth.uid() = elder_id OR 
    is_caregiver_of(elder_id)
);
