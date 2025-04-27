-- Create a stored procedure to process entry analysis
CREATE OR REPLACE FUNCTION process_entry_analysis(
  p_entry_id UUID,
  p_analysis JSONB
) RETURNS void AS $$
DECLARE
  tag_record RECORD;
  tag_id UUID;
  category_id UUID;
BEGIN
  -- Update the journal entry
  UPDATE journal_entries
  SET 
    processed = TRUE,
    last_processed_at = NOW()
  WHERE id = p_entry_id;
  
  -- Process each tag
  FOR tag_record IN SELECT * FROM jsonb_to_recordset(p_analysis->'tags') AS x(name TEXT, confidence FLOAT)
  LOOP
    -- Get the tag ID
    SELECT t.id, t.category_id INTO tag_id, category_id
    FROM tags t
    WHERE t.name = tag_record.name;
    
    IF tag_id IS NOT NULL THEN
      -- Insert entry-tag relationship
      INSERT INTO entry_tags (entry_id, tag_id, confidence)
      VALUES (p_entry_id, tag_id, COALESCE(tag_record.confidence, 1.0))
      ON CONFLICT (entry_id, tag_id) DO UPDATE
      SET confidence = EXCLUDED.confidence;
      
      -- Insert entry-category relationship
      INSERT INTO entry_categories (entry_id, category_id)
      VALUES (p_entry_id, category_id)
      ON CONFLICT (entry_id, category_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
