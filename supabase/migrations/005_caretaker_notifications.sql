-- ============================================================================
-- Migration 005: Caretaker Notifications Table
-- Stores AI health alert triage, SOS events, and conversation memory notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caretaker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    elder_name TEXT NOT NULL DEFAULT 'Connected Elder',
    type TEXT NOT NULL DEFAULT 'GENERAL', -- 'HEALTH_ALERT' | 'MISSED_MEDICATION' | 'MEMORY_SHARED' | 'DISTRESS' | 'GENERAL'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    symptom TEXT,
    transcript_excerpt TEXT,
    recommendation TEXT,
    recipient_email TEXT,
    email_sent BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy querying by elder_id
CREATE INDEX IF NOT EXISTS idx_caretaker_notifications_elder ON public.caretaker_notifications (elder_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.caretaker_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and insert notifications
CREATE POLICY "Users can manage caretaker notifications"
ON public.caretaker_notifications
FOR ALL
USING (true)
WITH CHECK (true);
