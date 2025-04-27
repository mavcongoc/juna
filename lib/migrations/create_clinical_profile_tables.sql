-- Create clinical_profiles table
CREATE TABLE IF NOT EXISTS clinical_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  primary_focus JSONB DEFAULT '[]'::JSONB,
  primary_diagnosis TEXT,
  secondary_diagnosis TEXT,
  dominant_behavioral_traits JSONB DEFAULT '[]'::JSONB,
  dominant_cognitive_patterns JSONB DEFAULT '[]'::JSONB,
  preferred_therapeutic_techniques JSONB DEFAULT '[]'::JSONB
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_clinical_profiles_user_id ON clinical_profiles(user_id);

-- Create mental_health_domains table
CREATE TABLE IF NOT EXISTS mental_health_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES clinical_profiles(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Low', 'Medium', 'High')),
  recent_notes TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_mental_health_domains_profile_id ON mental_health_domains(profile_id);

-- Create profile_tags table
CREATE TABLE IF NOT EXISTS profile_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES clinical_profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 1.0,
  UNIQUE(profile_id, tag_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_tags_profile_id ON profile_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_tags_tag_id ON profile_tags(tag_id);

-- Create growth_milestones table
CREATE TABLE IF NOT EXISTS growth_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES clinical_profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  evidence_type TEXT NOT NULL,
  evidence_id UUID
);

-- Create index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_growth_milestones_profile_id ON growth_milestones(profile_id);

-- Create linked_evidence table
CREATE TABLE IF NOT EXISTS linked_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES clinical_profiles(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  evidence_id UUID NOT NULL,
  relevance_note TEXT,
  relevance_score FLOAT NOT NULL DEFAULT 1.0
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_linked_evidence_profile_id ON linked_evidence(profile_id);
CREATE INDEX IF NOT EXISTS idx_linked_evidence_evidence_id ON linked_evidence(evidence_id);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_clinical_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_updated timestamp
CREATE TRIGGER update_clinical_profile_timestamp
BEFORE UPDATE ON clinical_profiles
FOR EACH ROW
EXECUTE FUNCTION update_clinical_profile_timestamp();
