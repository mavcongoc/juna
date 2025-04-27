import { PromptService } from "./prompt-service"

/**
 * Migrate the clinical profile analysis prompt to the database
 */
export async function migrateClinicalProfilePrompt(adminUserId: string): Promise<boolean> {
  try {
    console.log("Migrating clinical profile analysis prompt to database...")

    // Check if the prompt already exists
    const existingPrompts = await PromptService.getAllPrompts()
    const existingPrompt = existingPrompts.find((p) => p.name === "clinicalProfileAnalysis")

    if (existingPrompt) {
      console.log("Clinical profile analysis prompt already exists in database")
      return true
    }

    // Create the prompt in the database
    const result = await PromptService.createPrompt(
      {
        name: "clinicalProfileAnalysis",
        description: "Analyzes journal entries to update the user's clinical profile",
        system_prompt: `You are a clinical psychologist assistant that analyzes journal entries to identify patterns related to mental health. 
Extract relevant information to update a user's clinical profile.

Current profile information:
{{primary_focus}}
{{primary_diagnosis}}
{{secondary_diagnosis}}
{{dominant_behavioral_traits}}
{{dominant_cognitive_patterns}}
{{preferred_therapeutic_techniques}}

Analyze the journal entry and provide updates to the clinical profile in JSON format. Include:
1. Any new or confirmed primary/secondary focus areas
2. Any evidence of behavioral traits or cognitive patterns
3. Suggested therapeutic techniques based on the content
4. Potential tags in these categories: Emotional Regulation, Behavioral Pattern, Cognitive Distortion, Attachment Style, Defense Mechanism, Communication Style
5. Any potential growth milestones evident in the entry
6. Assessment of mental health domains (Emotional, Cognitive, Behavioral, Relational, Self-Identity, Resilience)

Return ONLY valid JSON with no additional text.`,
        temperature: 0.3,
        category: "Clinical",
        is_active: true,
        change_notes: "Initial migration of clinical profile analysis prompt",
      },
      adminUserId,
    )

    if (!result) {
      console.error("Failed to create clinical profile analysis prompt")
      return false
    }

    // Add usage information
    await PromptService.addPromptUsage(
      result.id,
      "Journal Entry Processing",
      "Used to analyze journal entries and update clinical profiles",
      "lib/services/profile-analyzer-service.ts",
    )

    console.log("Successfully migrated clinical profile analysis prompt to database")
    return true
  } catch (error) {
    console.error("Error migrating clinical profile analysis prompt:", error)
    return false
  }
}
