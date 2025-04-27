/**
 * Legacy prompt templates - these will be migrated to the database
 * and this file will eventually be deprecated
 */
export const PromptTemplates = {
  journalAnalysis: {
    system: `You are an empathetic and insightful AI assistant specialized in analyzing journal entries.
Your task is to analyze the provided journal entry and extract key insights.
Respond with a JSON object containing the following fields:
- emotions: Array of emotions expressed in the entry (limit to 3-5 most prominent)
- themes: Array of key themes or topics discussed (limit to 3-5)
- sentiment: Overall sentiment score from -10 (very negative) to 10 (very positive)
- summary: A brief 2-3 sentence summary of the entry
- insights: 1-2 gentle observations that might help the user gain perspective

Be thoughtful, nuanced, and avoid making assumptions beyond what's in the text.
Focus on understanding rather than advice-giving.`,
    temperature: 0.3,
  },

  conversationalChat: {
    system: `You are Juna, an empathetic and thoughtful AI companion focused on supporting mental wellbeing.

GUIDELINES:
- Be warm, supportive, and genuinely interested in the user's thoughts and feelings
- Ask thoughtful follow-up questions that encourage reflection
- Avoid giving prescriptive advice unless explicitly asked
- Never diagnose medical or psychological conditions
- If the user seems to be in crisis, gently suggest professional resources
- Keep responses concise (2-4 sentences) unless depth is needed
- Use a conversational, friendly tone that feels human and authentic

Your goal is to help users gain insight through reflection, not to solve their problems for them.`,
    temperature: 0.7,
  },

  insightsSummary: {
    system: `You are an insightful AI assistant specialized in analyzing journal entries and conversations.
Your task is to synthesize patterns and insights from the provided data.

Respond with a JSON object containing:
- topEmotions: Array of the 3-5 most common emotions with their frequency
- topThemes: Array of the 3-5 most common themes with their frequency
- overallSentiment: A number from -10 (very negative) to 10 (very positive)
- patterns: Array of 2-3 observed patterns in thinking or behavior
- insights: 2-3 gentle observations that might help the user gain perspective

Be thoughtful and nuanced. Focus on understanding rather than advice-giving.
Base your analysis only on the provided data.`,
    temperature: 0.4,
  },

  // Add migration function to move these to the database
  async migrateToDatabase(adminUserId: string) {
    const { getGPTService } = await import("./gpt-service")
    const { PromptService } = await import("./admin/prompt-service")

    try {
      console.log("Starting prompt template migration...")
      const migratedCount = await PromptService.migratePromptsFromCode(
        {
          journalAnalysis: this.journalAnalysis,
          conversationalChat: this.conversationalChat,
          insightsSummary: this.insightsSummary,
        },
        adminUserId,
      )

      console.log(`Successfully migrated ${migratedCount} prompt templates to the database`)

      // Clear the cache to ensure we use the database versions
      const gptService = getGPTService()
      gptService.clearPromptCache()

      return {
        success: true,
        migratedCount,
      }
    } catch (error) {
      console.error("Error migrating prompt templates:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

/**
 * Get a prompt template from the database or fall back to the legacy templates
 * This function helps with the transition from code-based to database-based prompts
 */
export async function getPromptTemplate(name: string): Promise<{ system: string; temperature: number }> {
  try {
    // Try to get from database first
    const { PromptService } = await import("./admin/prompt-service")
    const dbPrompt = await PromptService.getActivePromptByName(name)

    if (dbPrompt) {
      return dbPrompt
    }

    // Fall back to legacy templates
    const legacyTemplate = (PromptTemplates as any)[name]
    if (legacyTemplate) {
      console.warn(`Using legacy prompt template for "${name}". Consider migrating to the database.`)
      return {
        system: legacyTemplate.system,
        temperature: legacyTemplate.temperature,
      }
    }

    // If not found anywhere, return a generic template
    console.error(`Prompt template "${name}" not found in database or legacy templates`)
    return {
      system: "You are a helpful assistant. Provide a thoughtful and accurate response.",
      temperature: 0.5,
    }
  } catch (error) {
    console.error(`Error getting prompt template "${name}":`, error)
    // Return a safe fallback
    return {
      system: "You are a helpful assistant. Provide a thoughtful and accurate response.",
      temperature: 0.5,
    }
  }
}

// Helper function to build the prompt for journal analysis
export function buildJournalAnalysisPrompt(content: string, categories: any[], tags: any[]): string {
  return `
    Analyze the following journal entry and identify relevant emotional patterns, cognitive patterns, 
    behavioral patterns, self-identity themes, relational dynamics, resilience/coping mechanisms, 
    and stressors/triggers.
    
    Journal Entry:
    "${content}"
    
    Based on the entry, identify the most relevant tags from the following list, organized by category.
    Only select tags that are clearly present in the text (maximum 5-7 tags total):
    
    ${categories
      .map(
        (cat) => `
        ${cat.name}:
        ${tags
          .filter((tag) => tag.category_id === cat.id)
          .map((tag) => tag.name)
          .join(", ")}
      `,
      )
      .join("\n")}
    
    Return your analysis as a JSON object with this structure:
    {
      "tags": [
        {"id": "tag_id", "name": "tag_name", "confidence": 0.0-1.0, "explanation": "brief explanation"}
      ],
      "sentiment": 0.0 (between -1.0 and 1.0),
      "summary": "brief summary of key insights",
      "cbt_insight": "cognitive behavioral therapy perspective",
      "ifs_insight": "internal family systems perspective"
    }
  `
}

// Helper function to build the prompt for insights generation
export function buildInsightsPrompt(entries: any[], tagsByCategory: Record<string, string[]>): string {
  const entryList = entries.map((entry) => `- ${entry.content.substring(0, 100)}...`).join("\n")
  const tagsList = Object.entries(tagsByCategory)
    .map(([category, tagNames]) => `Category: ${category}\nTags: ${tagNames.join(", ")}`)
    .join("\n")

  return `
    Analyze the following journal entries and their associated tags to provide meaningful insights:
    
    Journal Entries:
    ${entryList}
    
    Tags by Category:
    ${tagsList}
    
    Provide your analysis in valid JSON format with the following structure:
    {
      "summary": "Summary of main emotional and psychological themes",
      "insights": ["Insight 1", "Insight 2", "Insight 3"],
      "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
  `
}
