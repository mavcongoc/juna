import { createClient } from "@supabase/supabase-js"

// Function to migrate the clinical profile analysis prompt
async function migrateClinicalProfilePrompt() {
  try {
    console.log("Starting clinical profile prompt migration...")

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find an admin user to use for the migration
    console.log("Finding an admin user...")
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("is_admin", true)
      .limit(1)

    if (adminError || !adminUsers || adminUsers.length === 0) {
      throw new Error("No admin users found: " + (adminError?.message || ""))
    }

    const adminUserId = adminUsers[0].user_id
    console.log(`Using admin user ID: ${adminUserId}`)

    // Check if the prompt already exists
    console.log("Checking if prompt already exists...")
    const { data: existingPrompts, error: promptError } = await supabase
      .from("prompts")
      .select("id")
      .eq("name", "clinicalProfileAnalysis")
      .limit(1)

    if (promptError) {
      throw new Error("Error checking for existing prompt: " + promptError.message)
    }

    if (existingPrompts && existingPrompts.length > 0) {
      console.log("Prompt already exists with ID:", existingPrompts[0].id)
      return { success: true, message: "Prompt already exists", promptId: existingPrompts[0].id }
    }

    // Create the prompt
    console.log("Creating new clinical profile analysis prompt...")
    const { data: newPrompt, error: createError } = await supabase
      .from("prompts")
      .insert({
        name: "clinicalProfileAnalysis",
        description: "Analyzes journal entries to update the user's clinical profile",
        category: "Clinical",
        created_by: adminUserId,
        is_active: true,
        usage_count: 0,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError || !newPrompt) {
      throw new Error("Error creating prompt: " + (createError?.message || ""))
    }

    console.log("Created prompt with ID:", newPrompt.id)

    // Create the prompt version
    const promptTemplate = `You are a clinical psychologist assistant that analyzes journal entries to identify patterns related to mental health. 
Extract relevant information to update a user's clinical profile.

Current profile information:
Primary Focus: {{primary_focus}}
Primary Diagnosis: {{primary_diagnosis}}
Secondary Diagnosis: {{secondary_diagnosis}}
Dominant Behavioral Traits: {{dominant_behavioral_traits}}
Dominant Cognitive Patterns: {{dominant_cognitive_patterns}}
Preferred Therapeutic Techniques: {{preferred_therapeutic_techniques}}

Analyze the journal entry and provide updates to the clinical profile in JSON format. Include:
1. Any new or confirmed primary/secondary focus areas
2. Any evidence of behavioral traits or cognitive patterns
3. Suggested therapeutic techniques based on the content
4. Potential tags in these categories: Emotional Regulation, Behavioral Pattern, Cognitive Distortion, Attachment Style, Defense Mechanism, Communication Style
5. Any potential growth milestones evident in the entry
6. Assessment of mental health domains (Emotional, Cognitive, Behavioral, Relational, Self-Identity, Resilience)

Return ONLY valid JSON with no additional text.`

    console.log("Creating prompt version...")
    const { data: promptVersion, error: versionError } = await supabase
      .from("prompt_versions")
      .insert({
        prompt_id: newPrompt.id,
        version: 1,
        template: promptTemplate,
        created_by: adminUserId,
        is_active: true,
        model: "gpt-4o",
        temperature: 0.2,
        max_tokens: 1000,
      })
      .select()
      .single()

    if (versionError || !promptVersion) {
      throw new Error("Error creating prompt version: " + (versionError?.message || ""))
    }

    console.log("Created prompt version with ID:", promptVersion.id)

    // Add usage information
    console.log("Adding usage information...")
    const { error: usageError } = await supabase.from("prompt_usage").insert({
      prompt_id: newPrompt.id,
      component: "ProfileAnalyzerService",
      method: "analyzeEntryContent",
      description: "Analyzes journal entries to update clinical profiles",
    })

    if (usageError) {
      console.warn("Warning: Error adding usage information:", usageError.message)
    }

    console.log("Migration completed successfully!")
    return {
      success: true,
      message: "Clinical profile analysis prompt migrated successfully",
      promptId: newPrompt.id,
    }
  } catch (error) {
    console.error("Migration failed:", error)
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
    }
  }
}

// Execute the migration
migrateClinicalProfilePrompt()
  .then((result) => {
    console.log("Migration result:", result)
    if (result.success) {
      console.log("✅ Migration completed successfully!")
    } else {
      console.log("❌ Migration failed!")
    }
  })
  .catch((error) => {
    console.error("Unhandled error during migration:", error)
  })
