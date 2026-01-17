-- =============================================
-- Good Day Planner - Supabase Database Schema
-- =============================================

-- =============================================
-- Activity Catalog Table
-- =============================================
CREATE TABLE IF NOT EXISTS activity_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_name)
);

-- Enable RLS
ALTER TABLE activity_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_catalog
CREATE POLICY "Users can view their own activities"
    ON activity_catalog
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
    ON activity_catalog
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
    ON activity_catalog
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
    ON activity_catalog
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_activity_catalog_user_id ON activity_catalog(user_id);

-- =============================================
-- Plans Table
-- =============================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans
CREATE POLICY "Users can view their own plans"
    ON plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
    ON plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
    ON plans
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
    ON plans
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_date ON plans(date);
CREATE INDEX idx_plans_user_date ON plans(user_id, date);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Completions Table
-- =============================================
CREATE TABLE IF NOT EXISTS completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completion_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for completions
CREATE POLICY "Users can view their own completions"
    ON completions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
    ON completions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions"
    ON completions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
    ON completions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_completions_user_id ON completions(user_id);
CREATE INDEX idx_completions_date ON completions(date);
CREATE INDEX idx_completions_user_date ON completions(user_id, date);

-- Trigger to update updated_at
CREATE TRIGGER update_completions_updated_at
    BEFORE UPDATE ON completions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_days INTEGER,
    days_with_plans INTEGER,
    total_activities INTEGER,
    completed_activities INTEGER,
    avg_completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.date)::INTEGER as total_days,
        COUNT(DISTINCT CASE WHEN jsonb_array_length(p.activities) > 0 THEN p.date END)::INTEGER as days_with_plans,
        COALESCE(SUM(jsonb_array_length(p.activities)), 0)::INTEGER as total_activities,
        COALESCE(SUM(
            (SELECT COUNT(*)
             FROM jsonb_array_elements(p.activities) activity
             WHERE (c.completion_data->>(activity->>'id'))::boolean IS TRUE)
        ), 0)::INTEGER as completed_activities,
        CASE 
            WHEN SUM(jsonb_array_length(p.activities)) > 0 
            THEN ROUND(
                (SUM(
                    (SELECT COUNT(*)
                     FROM jsonb_array_elements(p.activities) activity
                     WHERE (c.completion_data->>(activity->>'id'))::boolean IS TRUE)
                )::NUMERIC / SUM(jsonb_array_length(p.activities))::NUMERIC) * 100,
                2
            )
            ELSE 0
        END as avg_completion_rate
    FROM plans p
    LEFT JOIN completions c ON c.user_id = p.user_id AND c.date = p.date
    WHERE p.user_id = p_user_id
      AND p.date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes for Performance
-- =============================================

-- GIN index for JSONB queries
CREATE INDEX idx_plans_activities_gin ON plans USING GIN (activities);
CREATE INDEX idx_completions_data_gin ON completions USING GIN (completion_data);

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE activity_catalog IS 'Stores unique activity names for each user';
COMMENT ON TABLE plans IS 'Stores daily plans with activities array in JSONB format';
COMMENT ON TABLE completions IS 'Stores completion status for activities in JSONB format';

COMMENT ON COLUMN plans.activities IS 'JSONB array of activity objects: [{id: string, name: string}, ...]';
COMMENT ON COLUMN completions.completion_data IS 'JSONB object mapping activity IDs to completion status: {activity_id: boolean, ...}';
