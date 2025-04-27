import { getServiceClient } from "../supabase-client"
import { PromptService } from "./prompt-service"
import * as promptTemplates from "../prompt-templates"
import { runPromptMigrations } from "./prompt-migrations"
import { addAdminUser } from "./admin-user"

/**
 * Seed the database with prompts from the code
 */
export async function seedPromptsFromCode(adminUserId: string): Promise<number> {
  try {
    // Extract prompts from the prompt-templates.ts file
    const prompts = {
      journalAnalysis: promptTemplates.journalAnalysis,
      insightsGeneration: promptTemplates.insightsGeneration,
      conversationalChat: promptTemplates.conversationalChat,
      promptGeneration: promptTemplates.promptGeneration,
      entrySummarization: promptTemplates.entrySummarization,
    }

    // Migrate prompts to the database
    const migratedCount = await PromptService.migratePromptsFromCode(prompts, adminUserId)

    return migratedCount
  } catch (error) {
    console.error("Error seeding prompts from code:", error)
    return 0
  }
}

/**
 * Add usage information for prompts
 */
export async function seedPromptUsage(): Promise<boolean> {
  try {
    const supabase = getServiceClient()

    // Get all prompts
    const { data: prompts, error } = await supabase.from("prompts").select("id, name")

    if (error) {
      console.error("Error fetching prompts for usage seeding:", error)
      return false
    }

    // Map of prompt names to their usage information
    const usageMap: Record<string, { location: string; description: string; componentPath: string }[]> = {
      journalAnalysis: [
        {
          location: "Journal Entry Analysis",
          description: "Used to analyze journal entries and extract psychological patterns",
          componentPath: "app/api/analyze-entry/route.ts",
        },
      ],
      insightsGeneration: [
        {
          location: "Insights Page",
          description: "Used to generate insights from multiple journal entries",
          componentPath: "app/api/insights/route.ts",
        },
      ],
      conversationalChat: [
        {
          location: "AI Chat",
          description: "Used for conversational interactions with the AI companion",
          componentPath: "app/api/chat/route.ts",
        },
      ],
      promptGeneration: [
        {
          location: "Journal Prompts",
          description: "Used to generate journal prompts for users",
          componentPath: "app/api/prompts/route.ts",
        },
      ],
      entrySummarization: [
        {
          location: "Journal Entry Summary",
          description: "Used to create concise summaries of journal entries",
          componentPath: "app/api/entry/route.ts",
        },
      ],
    }

    // Add usage information for each prompt
    for (const prompt of prompts) {
      const usageInfo = usageMap[prompt.name]

      if (usageInfo) {
        for (const usage of usageInfo) {
          await PromptService.addPromptUsage(prompt.id, usage.location, usage.description, usage.componentPath)
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error seeding prompt usage:", error)
    return false
  }
}

/**
 * Initialize the admin system
 */
export async function initializeAdminSystem(adminEmail: string): Promise<boolean> {
  try {
    // Run migrations
    const migrationsSuccess = await runPromptMigrations()

    if (!migrationsSuccess) {
      console.error("Failed to run prompt migrations")
      return false
    }

    // Add the admin user
    const adminSuccess = await addAdminUser(adminEmail, true)

    if (!adminSuccess) {
      console.error("Failed to add admin user")
      return false
    }

    // Get the admin user ID
    const supabase = getServiceClient()
    const { data: adminUser, error } = await supabase.from("admin_users").select("id").eq("email", adminEmail).single()

    if (error || !adminUser) {
      console.error("Failed to get admin user ID:", error)
      return false
    }

    // Seed prompts
    const migratedCount = await seedPromptsFromCode(adminUser.id)

    if (migratedCount === 0) {
      console.warn("No prompts were migrated from code")
    } else {
      console.log(`Successfully migrated ${migratedCount} prompts from code`)
    }

    // Seed usage information
    const usageSuccess = await seedPromptUsage()

    if (!usageSuccess) {
      console.warn("Failed to seed prompt usage information")
    }

    return true
  } catch (error) {
    console.error("Error initializing admin system:", error)
    return false
  }
}

/**
 * Seeds the database with the initial prompts from prompt-templates.ts
 */
export async function seedPrompts(adminUserId: string) {
  const supabase = getServiceClient()

  try {
    console.log("Seeding initial prompts...")

    // Map of prompt names to their database IDs
    const promptIds: Record<string, string> = {}

    // Insert each prompt from the prompt-templates.ts file
    for (const [key, value] of Object.entries(promptTemplates)) {
      // Insert the prompt
      const { data: promptData, error: promptError } = await supabase
        .from("prompts")
        .insert({
          name: key,
          description: getPromptDescription(key),
          system_prompt: value.system,
          temperature: value.temperature,
          category: getPromptCategory(key),
          is_active: true,
        })
        .select("id")
        .single()

      if (promptError) {
        console.error(`Error inserting prompt ${key}:`, promptError)
        continue
      }

      const promptId = promptData.id
      promptIds[key] = promptId

      // Insert the initial version
      const { error: versionError } = await supabase.from("prompt_versions").insert({
        prompt_id: promptId,
        system_prompt: value.system,
        temperature: value.temperature,
        created_by: adminUserId,
        change_notes: "Initial version imported from code",
      })

      if (versionError) {
        console.error(`Error inserting version for prompt ${key}:`, versionError)
      }

      // Insert usage information
      const { error: usageError } = await supabase.from("prompt_usage").insert(getPromptUsage(key, promptId))

      if (usageError) {
        console.error(`Error inserting usage for prompt ${key}:`, usageError)
      }
    }

    console.log("Prompt seeding completed successfully")
    return { success: true, promptIds }
  } catch (error) {
    console.error("Prompt seeding failed:", error)
    return { success: false, error }
  }
}

/**
 * Get a description for each prompt type
 */
function getPromptDescription(promptKey: string): string {
  switch (promptKey) {
    case "journalAnalysis":
      return "Analyzes journal entries to identify emotional patterns, cognitive patterns, and other psychological themes."
    case "insightsGeneration":
      return "Generates insights based on multiple journal entries and their associated psychological tags."
    case "conversationalChat":
      return "Provides a warm, empathetic conversational experience focused on mental wellbeing."
    case "promptGeneration":
      return "Creates journal prompts that encourage self-reflection and emotional awareness."
    case "entrySummarization":
      return "Summarizes journal entries with a focus on emotional content and key themes."
    default:
      return "System prompt for AI interaction."
  }
}

/**
 * Get a category for each prompt type
 */
function getPromptCategory(promptKey: string): string {
  switch (promptKey) {
    case "journalAnalysis":
    case "insightsGeneration":
      return "Analysis"
    case "conversationalChat":
      return "Conversation"
    case "promptGeneration":
      return "Content Generation"
    case "entrySummarization":
      return "Summarization"
    default:
      return "Other"
  }
}

/**
 * Get usage information for each prompt type
 */
function getPromptUsage(promptKey: string, promptId: string): any[] {
  switch (promptKey) {
    case "journalAnalysis":
      return [
        {
          prompt_id: promptId,
          location: "Journal Entry Analysis",
          description: "Used when analyzing new journal entries",
          component_path: "app/api/analyze-entry/route.ts",
        },
      ]
    case "insightsGeneration":
      return [
        {
          prompt_id: promptId,
          location: "Insights Generation",
          description: "Used to generate insights from multiple journal entries",
          component_path: "app/api/insights/route.ts",
        },
      ]
    case "conversationalChat":
      return [
        {
          prompt_id: promptId,
          location: "AI Chat",
          description: "Used for the conversational AI chat feature",
          component_path: "app/api/chat/route.ts",
        },
      ]
    case "promptGeneration":
      return [
        {
          prompt_id: promptId,
          location: "Journal Prompts",
          description: "Used to generate journal writing prompts",
          component_path: "app/api/prompts/route.ts",
        },
      ]
    case "entrySummarization":
      return [
        {
          prompt_id: promptId,
          location: "Entry Summarization",
          description: "Used to create concise summaries of journal entries",
          component_path: "app/api/process-entry/route.ts",
        },
      ]
    default:
      return []
  }
}
