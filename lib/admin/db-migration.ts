import { getServiceClient } from "../supabase-client"

/**
 * Run database migrations for the prompt management system
 */
export async function runPromptMigrations(): Promise<boolean> {
  const supabase = getServiceClient()

  try {
    // Read the migration SQL
    const migrationSql = `
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
      
      -- Create prompt test results table
      CREATE TABLE IF NOT EXISTS prompt_test_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        duration INTEGER NOT NULL,
        tokens_used INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID NOT NULL
      );
      
      -- Create admin users table
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        is_super_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create stored procedures
      CREATE OR REPLACE FUNCTION update_prompt_with_version(
        p_prompt_id UUID,
        p_name VARCHAR,
        p_description TEXT,
        p_system_prompt TEXT,
        p_temperature FLOAT,
        p_category VARCHAR,
        p_is_active BOOLEAN,
        p_admin_user_id UUID,
        p_change_notes TEXT
      ) RETURNS VOID AS $$
      BEGIN
        -- Update the prompt
        UPDATE prompts
        SET 
          name = COALESCE(p_name, name),
          description = COALESCE(p_description, description),
          system_prompt = COALESCE(p_system_prompt, system_prompt),
          temperature = COALESCE(p_temperature, temperature),
          category = COALESCE(p_category, category),
          is_active = COALESCE(p_is_active, is_active),
          updated_at = NOW()
        WHERE id = p_prompt_id;
        
        -- Create a new version
        INSERT INTO prompt_versions (
          prompt_id,
          system_prompt,
          temperature,
          created_by,
          change_notes
        ) VALUES (
          p_prompt_id,
          COALESCE(p_system_prompt, (SELECT system_prompt FROM prompts WHERE id = p_prompt_id)),
          COALESCE(p_temperature, (SELECT temperature FROM prompts WHERE id = p_prompt_id)),
          p_admin_user_id,
          p_change_notes
        );
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE OR REPLACE FUNCTION delete_prompt_cascade(
        p_prompt_id UUID
      ) RETURNS VOID AS $$
      BEGIN
        -- Delete test results for all versions
        DELETE FROM prompt_test_results
        WHERE prompt_version_id IN (
          SELECT id FROM prompt_versions WHERE prompt_id = p_prompt_id
        );
        
        -- Delete versions
        DELETE FROM prompt_versions
        WHERE prompt_id = p_prompt_id;
        
        -- Delete usage
        DELETE FROM prompt_usage
        WHERE prompt_id = p_prompt_id;
        
        -- Delete the prompt
        DELETE FROM prompts
        WHERE id = p_prompt_id;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt_id ON prompt_usage(prompt_id);
      CREATE INDEX IF NOT EXISTS idx_prompt_test_results_version_id ON prompt_test_results(prompt_version_id);
      CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
      CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(name);
    `

    // Execute the migration SQL
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSql })

    if (error) {
      console.error("Error running prompt migrations:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error in runPromptMigrations:", error)
    return false
  }
}

/**
 * Add an admin user
 */
export async function addAdminUser(email: string, isSuperAdmin = false): Promise<boolean> {
  const supabase = getServiceClient()

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error(`Error checking if admin user ${email} exists:`, checkError)
      return false
    }

    if (existingUser) {
      // User already exists, update super admin status if needed
      if (isSuperAdmin) {
        const { error: updateError } = await supabase
          .from("admin_users")
          .update({ is_super_admin: true })
          .eq("id", existingUser.id)

        if (updateError) {
          console.error(`Error updating admin user ${email}:`, updateError)
          return false
        }
      }
      return true
    }

    // Insert new admin user
    const { error } = await supabase.from("admin_users").insert({
      email,
      is_super_admin: isSuperAdmin,
    })

    if (error) {
      console.error(`Error adding admin user ${email}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Unexpected error in addAdminUser for ${email}:`, error)
    return false
  }
}

/**
 * Run all database migrations
 * This is a wrapper function that runs all migration functions
 */
export async function runMigrations(): Promise<boolean> {
  try {
    console.log("Running database migrations...")

    // Run prompt migrations
    const promptMigrationsResult = await runPromptMigrations()
    if (!promptMigrationsResult) {
      console.error("Failed to run prompt migrations")
      return false
    }

    console.log("All migrations completed successfully")
    return true
  } catch (error) {
    console.error("Unexpected error in runMigrations:", error)
    return false
  }
}
