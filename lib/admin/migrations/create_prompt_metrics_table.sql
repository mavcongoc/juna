-- Create prompt_metrics table for tracking prompt usage metrics
CREATE TABLE IF NOT EXISTS prompt_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  duration_ms INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for efficient querying
  CONSTRAINT prompt_metrics_prompt_id_idx UNIQUE (id, prompt_id)
);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS prompt_metrics_created_at_idx ON prompt_metrics(created_at);

-- Create index on prompt_id for filtering by prompt
CREATE INDEX IF NOT EXISTS prompt_metrics_prompt_id_created_at_idx ON prompt_metrics(prompt_id, created_at);
