import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateClinicalProfilePrompt() {
  try {
    console.log("Starting clinical profile prompt migration...")

    // First, check if we have an admin user to use for the migration
    console.log("Finding an admin user...")
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("is_admin", true)
      .limit(1)

    if (adminError || !adminUsers || adminUsers.length === 0) {
      console.error("Error finding admin user:", adminError || "No admin users found")
      return { success: false, error: "No admin users found" }
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
      console.error("Error checking for existing prompt:", promptError)
      return { success: false, error: promptError.message }
    }

    if (existingPrompts && existingPrompts.length > 0) {
      console.log("Prompt already exists, skipping migration")
      return { success: true, message: "Prompt already exists", promptId: existingPrompts[0].id }
    }

    // Create the prompt
    console.log("Creating clinical profile analysis prompt...")
    const { data: prompt, error: createError } = await supabase
      .from("prompts")
      .insert({
        name: "clinicalProfileAnalysis",
        description: "Analyzes journal entries to update the user's clinical profile",
        category: "Clinical",
        created_by: adminUserId,
        is_active: true,
        metadata: {
          usage: "Used to analyze journal entries and update clinical profiles",
          model: "gpt-4o",
          temperature: 0.2,
          max_tokens: 1000,
        },
      })
      .select()

    if (createError || !prompt) {
      console.error("Error creating prompt:", createError)
      return { success: false, error: createError?.message }
    }

    const promptId = prompt[0].id
    console.log(`Created prompt with ID: ${promptId}`)

    // Create the prompt version
    console.log("Creating prompt version...")
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

    const { data: version, error: versionError } = await supabase
      .from("prompt_versions")
      .insert({
        prompt_id: promptId,
        version: 1,
        content: promptTemplate,
        created_by: adminUserId,
        is_active: true,
        metadata: {
          notes: "Initial version of clinical profile analysis prompt",
        },
      })
      .select()

    if (versionError || !version) {
      console.error("Error creating prompt version:", versionError)
      return { success: false, error: versionError?.message }
    }

    console.log(`Created prompt version with ID: ${version[0].id}`)

    // Add usage information
    console.log("Adding usage information...")
    const { error: usageError } = await supabase.from("prompt_usage").insert({
      prompt_id: promptId,
      component: "ProfileAnalyzerService",
      function: "analyzeEntryContent",
      description: "Analyzes journal entries to update clinical profiles",
    })

    if (usageError) {
      console.error("Error adding usage information:", usageError)
      // Non-critical error, continue
    }

    console.log("Migration completed successfully!")
    return {
      success: true,
      message: "Clinical profile analysis prompt migrated successfully",
      promptId,
      versionId: version[0].id,
    }
  } catch (error) {
    console.error("Unexpected error during migration:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

// Execute the migration
migrateClinicalProfilePrompt()
  .then((result) => {
    console.log("Migration result:", result)
    if (result.success) {
      console.log("✅ Migration completed successfully!")
    } else {
      console.log("❌ Migration failed:", result.error)
    }
  })
  .catch((error) => {
    console.error("Error executing migration:", error)
  })
