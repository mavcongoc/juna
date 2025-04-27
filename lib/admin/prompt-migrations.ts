import { getServiceClient } from "../supabase-client"

/**
 * Run migrations for the prompt management system
 * @returns {Promise<boolean>} True if migrations were successful, false otherwise
 */
export async function runPromptMigrations(): Promise<boolean> {
  try {
    const supabase = getServiceClient()

    // Check if migrations have already been run
    const { data: existingTables, error: checkError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public")
      .eq("tablename", "prompts")

    if (checkError) {
      console.error("Error checking for existing tables:", checkError)
      return false
    }

    // If prompts table already exists, skip migrations
    if (existingTables && existingTables.length > 0) {
      console.log("Prompt tables already exist, skipping migrations")
      return true
    }

    // Run migrations
    const migrationSQL = `
      -- Enable UUID extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create prompts table
      CREATE TABLE IF NOT EXISTS prompts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        system_prompt TEXT NOT NULL,
        temperature FLOAT NOT NULL DEFAULT 0.7,
        category VARCHAR(100) NOT NULL DEFAULT 'Other',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE
      );
      
      -- Create prompt versions table
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        system_prompt TEXT NOT NULL,
        temperature FLOAT NOT NULL DEFAULT 0.7,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID NOT NULL,
        change_notes TEXT
      );
      
      -- Create prompt usage table
      CREATE TABLE IF NOT EXISTS prompt_usage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        component_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute migrations
    const { error: migrationError } = await supabase.rpc("exec_sql", { sql: migrationSQL })

    if (migrationError) {
      console.error("Error running prompt migrations:", migrationError)
      return false
    }

    console.log("Prompt migrations completed successfully")
    return true
  } catch (error) {
    console.error("Unexpected error in runPromptMigrations:", error)
    return false
  }
}
