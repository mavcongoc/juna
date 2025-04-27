import { getServiceClient, getSupabaseClient } from "../supabase-client"
import type { PromptWithUsage, PromptUpdatePayload, PromptTestResult, PromptMetrics } from "./types"

/**
 * Service for managing prompts in the database
 */
export class PromptService {
  /**
   * Get all prompts with their usage information
   */
  static async getAllPrompts(): Promise<PromptWithUsage[]> {
    const supabase = getSupabaseClient()

    try {
      // Get all prompts
      const { data: prompts, error: promptsError } = await supabase
        .from("prompts")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true })

      if (promptsError) {
        console.error("Error fetching prompts:", promptsError)
        return []
      }

      // Get usage information for all prompts
      const { data: usageData, error: usageError } = await supabase.from("prompt_usage").select("*")

      if (usageError) {
        console.error("Error fetching prompt usage:", usageError)
        return prompts.map((p) => ({ ...p, usage: [], versions: [] }))
      }

      // Get the latest version for each prompt
      const { data: versionsData, error: versionsError } = await supabase
        .from("prompt_versions")
        .select("*")
        .order("created_at", { ascending: false })

      if (versionsError) {
        console.error("Error fetching prompt versions:", versionsError)
        return prompts.map((p) => ({ ...p, usage: usageData.filter((u) => u.prompt_id === p.id), versions: [] }))
      }

      // Combine the data
      const promptsWithUsage = prompts.map((prompt) => {
        const usage = usageData.filter((u) => u.prompt_id === prompt.id)
        const versions = versionsData.filter((v) => v.prompt_id === prompt.id)

        return {
          ...prompt,
          usage,
          versions,
        }
      })

      return promptsWithUsage
    } catch (error) {
      console.error("Unexpected error in getAllPrompts:", error)
      return []
    }
  }

  /**
   * Get a single prompt with all its versions and usage information
   */
  static async getPromptById(id: string): Promise<PromptWithUsage | null> {
    const supabase = getSupabaseClient()

    try {
      // Get the prompt
      const { data: prompt, error: promptError } = await supabase.from("prompts").select("*").eq("id", id).single()

      if (promptError) {
        console.error(`Error fetching prompt ${id}:`, promptError)
        return null
      }

      // Get usage information
      const { data: usage, error: usageError } = await supabase.from("prompt_usage").select("*").eq("prompt_id", id)

      if (usageError) {
        console.error(`Error fetching usage for prompt ${id}:`, usageError)
        return { ...prompt, usage: [], versions: [] }
      }

      // Get all versions
      const { data: versions, error: versionsError } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", id)
        .order("created_at", { ascending: false })

      if (versionsError) {
        console.error(`Error fetching versions for prompt ${id}:`, versionsError)
        return { ...prompt, usage, versions: [] }
      }

      return {
        ...prompt,
        usage,
        versions,
      }
    } catch (error) {
      console.error(`Unexpected error in getPromptById for ${id}:`, error)
      return null
    }
  }

  /**
   * Update a prompt and create a new version
   */
  static async updatePrompt(
    id: string,
    payload: PromptUpdatePayload,
    adminUserId: string,
  ): Promise<PromptWithUsage | null> {
    const supabase = getServiceClient()

    try {
      // Start a transaction using a stored procedure
      // This ensures both the prompt update and version creation happen atomically
      const { data: result, error } = await supabase.rpc("update_prompt_with_version", {
        p_prompt_id: id,
        p_name: payload.name,
        p_description: payload.description,
        p_system_prompt: payload.system_prompt,
        p_temperature: payload.temperature,
        p_category: payload.category,
        p_is_active: payload.is_active,
        p_admin_user_id: adminUserId,
        p_change_notes: payload.change_notes || "Updated prompt",
      })

      if (error) {
        console.error(`Error updating prompt ${id}:`, error)
        return null
      }

      // Get the updated prompt with all information
      return this.getPromptById(id)
    } catch (error) {
      console.error(`Unexpected error in updatePrompt for ${id}:`, error)
      return null
    }
  }

  /**
   * Create a new prompt
   */
  static async createPrompt(payload: PromptUpdatePayload, adminUserId: string): Promise<PromptWithUsage | null> {
    const supabase = getServiceClient()

    try {
      // Insert the prompt
      const { data: promptData, error: promptError } = await supabase
        .from("prompts")
        .insert({
          name: payload.name || "New Prompt",
          description: payload.description || "",
          system_prompt: payload.system_prompt || "",
          temperature: payload.temperature || 0.7,
          category: payload.category || "Other",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
        })
        .select("id")
        .single()

      if (promptError) {
        console.error("Error creating prompt:", promptError)
        return null
      }

      const promptId = promptData.id

      // Insert the initial version
      const { error: versionError } = await supabase.from("prompt_versions").insert({
        prompt_id: promptId,
        system_prompt: payload.system_prompt || "",
        temperature: payload.temperature || 0.7,
        created_by: adminUserId,
        change_notes: payload.change_notes || "Initial version",
      })

      if (versionError) {
        console.error(`Error creating version for prompt ${promptId}:`, versionError)
        // Continue anyway, as the prompt was created
      }

      // Get the created prompt with all information
      return this.getPromptById(promptId)
    } catch (error) {
      console.error("Unexpected error in createPrompt:", error)
      return null
    }
  }

  /**
   * Delete a prompt and all associated data
   */
  static async deletePrompt(id: string): Promise<boolean> {
    const supabase = getServiceClient()

    try {
      // Use a stored procedure to delete the prompt and all related data
      const { error } = await supabase.rpc("delete_prompt_cascade", {
        p_prompt_id: id,
      })

      if (error) {
        console.error(`Error deleting prompt ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Unexpected error in deletePrompt for ${id}:`, error)
      return false
    }
  }

  /**
   * Add usage information for a prompt
   */
  static async addPromptUsage(
    promptId: string,
    location: string,
    description: string,
    componentPath: string,
  ): Promise<boolean> {
    const supabase = getServiceClient()

    try {
      // Check if this usage already exists to avoid duplicates
      const { data: existingUsage, error: checkError } = await supabase
        .from("prompt_usage")
        .select("id")
        .eq("prompt_id", promptId)
        .eq("component_path", componentPath)
        .maybeSingle()

      if (checkError) {
        console.error(`Error checking existing usage for prompt ${promptId}:`, checkError)
      } else if (existingUsage) {
        // Usage already exists, update it
        const { error: updateError } = await supabase
          .from("prompt_usage")
          .update({
            location,
            description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUsage.id)

        if (updateError) {
          console.error(`Error updating usage for prompt ${promptId}:`, updateError)
          return false
        }
        return true
      }

      // Insert new usage
      const { error } = await supabase.from("prompt_usage").insert({
        prompt_id: promptId,
        location,
        description,
        component_path: componentPath,
      })

      if (error) {
        console.error(`Error adding usage for prompt ${promptId}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Unexpected error in addPromptUsage for ${promptId}:`, error)
      return false
    }
  }

  /**
   * Store a test result for a prompt version
   */
  static async storeTestResult(
    promptVersionId: string,
    input: string,
    output: string,
    duration: number,
    tokensUsed: number,
    adminUserId: string,
  ): Promise<PromptTestResult | null> {
    const supabase = getServiceClient()

    try {
      const { data, error } = await supabase
        .from("prompt_test_results")
        .insert({
          prompt_version_id: promptVersionId,
          input,
          output,
          duration,
          tokens_used: tokensUsed,
          created_by: adminUserId,
        })
        .select("*")
        .single()

      if (error) {
        console.error(`Error storing test result for version ${promptVersionId}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Unexpected error in storeTestResult for ${promptVersionId}:`, error)
      return null
    }
  }

  /**
   * Get test results for a prompt version
   */
  static async getTestResults(promptVersionId: string): Promise<PromptTestResult[]> {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("prompt_test_results")
        .select("*")
        .eq("prompt_version_id", promptVersionId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error(`Error fetching test results for version ${promptVersionId}:`, error)
        return []
      }

      return data
    } catch (error) {
      console.error(`Unexpected error in getTestResults for ${promptVersionId}:`, error)
      return []
    }
  }

  /**
   * Get all prompt categories
   */
  static async getCategories(): Promise<string[]> {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase.from("prompts").select("category").order("category", { ascending: true })

      if (error) {
        console.error("Error fetching prompt categories:", error)
        return []
      }

      // Extract unique categories
      const categories = [...new Set(data.map((p) => p.category))]
      return categories
    } catch (error) {
      console.error("Unexpected error in getCategories:", error)
      return []
    }
  }

  /**
   * Get the active version of a prompt by name
   * This is used by the application to get the current prompt to use
   */
  static async getActivePromptByName(name: string): Promise<{ system: string; temperature: number } | null> {
    const supabase = getSupabaseClient()

    try {
      // Get the prompt
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .select("*")
        .eq("name", name)
        .eq("is_active", true)
        .maybeSingle()

      if (promptError || !prompt) {
        console.error(`Error fetching active prompt ${name}:`, promptError)
        return null
      }

      // Get the latest version
      const { data: version, error: versionError } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", prompt.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (versionError || !version) {
        console.error(`Error fetching latest version for prompt ${name}:`, versionError)
        return null
      }

      return {
        system: version.system_prompt,
        temperature: version.temperature,
      }
    } catch (error) {
      console.error(`Unexpected error in getActivePromptByName for ${name}:`, error)
      return null
    }
  }

  /**
   * Record prompt usage metrics
   */
  static async recordPromptUsageMetrics(
    promptName: string,
    duration: number,
    inputTokens: number,
    outputTokens: number,
    success: boolean,
  ): Promise<boolean> {
    const supabase = getServiceClient()

    try {
      // First, get the prompt ID from the name
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .select("id")
        .eq("name", promptName)
        .maybeSingle()

      if (promptError || !prompt) {
        console.error(`Error finding prompt with name ${promptName}:`, promptError)
        return false
      }

      // Insert the metrics
      const { error } = await supabase.from("prompt_metrics").insert({
        prompt_id: prompt.id,
        duration_ms: duration,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        success: success,
      })

      if (error) {
        console.error(`Error recording metrics for prompt ${promptName}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Unexpected error in recordPromptUsageMetrics for ${promptName}:`, error)
      return false
    }
  }

  /**
   * Get metrics for a prompt
   */
  static async getPromptMetrics(
    promptId: string,
    timeRange: "day" | "week" | "month" = "week",
  ): Promise<PromptMetrics> {
    const supabase = getSupabaseClient()

    try {
      // Calculate the start date based on the time range
      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case "day":
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 1)
          break
        case "month":
          startDate = new Date(now)
          startDate.setMonth(now.getMonth() - 1)
          break
        case "week":
        default:
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 7)
          break
      }

      // Format the date for Postgres
      const startDateStr = startDate.toISOString()

      // Get metrics for the prompt within the time range
      const { data, error } = await supabase
        .from("prompt_metrics")
        .select("*")
        .eq("prompt_id", promptId)
        .gte("created_at", startDateStr)
        .order("created_at", { ascending: true })

      if (error) {
        console.error(`Error fetching metrics for prompt ${promptId}:`, error)
        return {
          totalCalls: 0,
          successRate: 0,
          avgDuration: 0,
          totalTokens: 0,
          timeSeriesData: [],
        }
      }

      // Calculate aggregate metrics
      const totalCalls = data.length
      const successfulCalls = data.filter((m) => m.success).length
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
      const totalDuration = data.reduce((sum, m) => sum + m.duration_ms, 0)
      const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
      const totalTokens = data.reduce((sum, m) => sum + m.input_tokens + m.output_tokens, 0)

      // Group data by day for time series
      const timeSeriesMap = new Map<string, { date: string; calls: number; avgDuration: number; tokens: number }>()

      data.forEach((metric) => {
        const date = new Date(metric.created_at).toISOString().split("T")[0]
        const existing = timeSeriesMap.get(date)

        if (existing) {
          existing.calls += 1
          existing.avgDuration = (existing.avgDuration * (existing.calls - 1) + metric.duration_ms) / existing.calls
          existing.tokens += metric.input_tokens + metric.output_tokens
        } else {
          timeSeriesMap.set(date, {
            date,
            calls: 1,
            avgDuration: metric.duration_ms,
            tokens: metric.input_tokens + metric.output_tokens,
          })
        }
      })

      const timeSeriesData = Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date))

      return {
        totalCalls,
        successRate,
        avgDuration,
        totalTokens,
        timeSeriesData,
      }
    } catch (error) {
      console.error(`Unexpected error in getPromptMetrics for ${promptId}:`, error)
      return {
        totalCalls: 0,
        successRate: 0,
        avgDuration: 0,
        totalTokens: 0,
        timeSeriesData: [],
      }
    }
  }

  /**
   * Migrate prompts from code to database
   * This is used to initialize the database with prompts from the code
   */
  static async migratePromptsFromCode(
    prompts: Record<string, { system: string; temperature: number }>,
    adminUserId: string,
  ): Promise<number> {
    let migratedCount = 0

    for (const [name, prompt] of Object.entries(prompts)) {
      try {
        // Check if prompt already exists
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("prompts").select("id").eq("name", name).maybeSingle()

        if (error) {
          console.error(`Error checking if prompt ${name} exists:`, error)
          continue
        }

        if (data) {
          // Prompt already exists, skip
          continue
        }

        // Create the prompt
        const result = await this.createPrompt(
          {
            name,
            description: `Auto-migrated from code: ${name}`,
            system_prompt: prompt.system,
            temperature: prompt.temperature,
            category: "Migrated",
            is_active: true,
            change_notes: "Initial migration from code",
          },
          adminUserId,
        )

        if (result) {
          migratedCount++
        }
      } catch (error) {
        console.error(`Error migrating prompt ${name}:`, error)
      }
    }

    return migratedCount
  }
}
