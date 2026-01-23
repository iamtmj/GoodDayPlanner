-- =============================================
-- Add Backlog Table to Existing Database
-- Run this if you already have the other tables
-- =============================================

CREATE TABLE IF NOT EXISTS backlog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    original_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE backlog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backlog
CREATE POLICY "Users can view their own backlog"
    ON backlog
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backlog items"
    ON backlog
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backlog items"
    ON backlog
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backlog items"
    ON backlog
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_backlog_user_id ON backlog(user_id);
CREATE INDEX idx_backlog_activity_id ON backlog(activity_id);

COMMENT ON TABLE backlog IS 'Stores incomplete activities moved from past dates';
