-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Manual',
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('youtube', 'loom', 'file')),
  source_url TEXT,
  source_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'transcribing', 'extracting', 'done', 'error')),
  error_message TEXT,
  transcript TEXT,
  manual_data JSONB,
  estimated_time TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job sections table
CREATE TABLE IF NOT EXISTS job_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job steps table
CREATE TABLE IF NOT EXISTS job_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  section_id UUID REFERENCES job_sections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  note TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS job_sections_job_id_idx ON job_sections(job_id);
CREATE INDEX IF NOT EXISTS job_steps_job_id_idx ON job_steps(job_id);
CREATE INDEX IF NOT EXISTS job_steps_section_id_idx ON job_steps(section_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_usage
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Jobs: users can only access their own jobs
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid()::text = user_id);

-- Service role bypasses RLS for API routes
-- (handled by using service role key in API routes)

-- Job sections: accessible if parent job is accessible
CREATE POLICY "Users can view own job sections"
  ON job_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_sections.job_id
        AND jobs.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own job sections"
  ON job_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_sections.job_id
        AND jobs.user_id = auth.uid()::text
    )
  );

-- Job steps: same pattern
CREATE POLICY "Users can view own job steps"
  ON job_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_steps.job_id
        AND jobs.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own job steps"
  ON job_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_steps.job_id
        AND jobs.user_id = auth.uid()::text
    )
  );

-- User usage: users can only view/update their own
CREATE POLICY "Users can view own usage"
  ON user_usage FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own usage"
  ON user_usage FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Waitlist: anyone can insert
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Storage bucket (run this after creating the bucket in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);
