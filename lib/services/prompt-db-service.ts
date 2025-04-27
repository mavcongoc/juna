import { getSupabaseClient } from "@/lib/supabase-client"
import { LRUCache } from "lru-cache"

// Types
export interface Prompt {
  id: string
  name: string
  description: string
  system_prompt: string
  temperature: number
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  system_prompt: string
  temperature: number
  created_at: string
  created_by: string
  change_notes: string
}

export interface PromptUsage {
  id: string
  prompt_id: string
  location: string
  description: string
  component_path: string
}

export interface PromptMetrics {
  id: string
  prompt_id: string
  duration_ms: number
  input_tokens: number
  output_tokens: number
  success: boolean
  created_at: string
}

export interface PromptTestResult {
  id: string
  prompt_version_id: string
  input: string
  output: string
  duration: number
  tokens_used: number
  created_at: string
  created_by: string
}

// Cache for prompt templates
const promptCache = new LRUCache<string, { prompt: Prompt; timestamp: number }>({
  max: 100, // Maximum number of items to store
  ttl: 1000 * 60 * 5, // 5 minutes TTL
})

/**
 * Service for interacting with the prompt database
 */
export class PromptDBService {
  /**
   * Get a prompt by name
   */
  static async getPromptByName(name: string): Promise<Prompt | null> {
    // Check cache first
    const cachedPrompt = promptCache.get(name)
    if (cachedPrompt) {
      return cachedPrompt.prompt
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("prompts").select("*").eq("name", name).eq("is_active", true).single()

      if (error || !data) {
        console.error(`Error fetching prompt "${name}":`, error)
        return null
      }

      // Store in cache
      promptCache.set(name, {
        prompt: data as Prompt,
        timestamp: Date.now(),
      })

      return data as Prompt
    } catch (error) {
      console.error(`Error fetching prompt "${name}":`, error)
      return null
    }
  }

  /**
   * Get all prompts
   */
  static async getAllPrompts(): Promise<Prompt[]> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("prompts").select("*").order("name")

      if (error) {
        console.error("Error fetching prompts:", error)
        return []
      }

      return data as Prompt[]
    } catch (error) {
      console.error("Error fetching prompts:", error)
      return []
    }
  }

  /**
   * Get prompt versions
   */
  static async getPromptVersions(promptId: string): Promise<PromptVersion[]> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", promptId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error(`Error fetching versions for prompt ${promptId}:`, error)
        return []
      }

      return data as PromptVersion[]
    } catch (error) {
      console.error(`Error fetching versions for prompt ${promptId}:`, error)
      return []
    }
  }

  /**
   * Get prompt usage
   */
  static async getPromptUsage(promptId: string): Promise<PromptUsage[]> {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("prompt_usage").select("*").eq("prompt_id", promptId)

      if (error) {
        console.error(`Error fetching usage for prompt ${promptId}:`, error)
        return []
      }

      return data as PromptUsage[]
    } catch (error) {
      console.error(`Error fetching usage for prompt ${promptId}:`, error)
      return []
    }
  }

  /**
   * Get prompt metrics
   */
  static async getPromptMetrics(
    promptId: string,
    timeframe: "day" | "week" | "month" = "week",
  ): Promise<PromptMetrics[]> {
    try {
      const supabase = getSupabaseClient()

      // Calculate date range based on timeframe
      const now = new Date()
      const startDate = new Date()

      switch (timeframe) {
        case "day":
          startDate.setDate(now.getDate() - 1)
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
      }

      const { data, error } = await supabase
        .from("prompt_metrics")
        .select("*")
        .eq("prompt_id", promptId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        console.error(`Error fetching metrics for prompt ${promptId}:`, error)
        return []
      }

      return data as PromptMetrics[]
    } catch (error) {
      console.error(`Error fetching metrics for prompt ${promptId}:`, error)
      return []
    }
  }

  /**
   * Record prompt usage metrics
   */
  static async recordPromptMetrics(
    promptId: string,
    duration_ms: number,
    input_tokens: number,
    output_tokens: number,
    success: boolean,
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("prompt_metrics").insert({
        prompt_id: promptId,
        duration_ms,
        input_tokens,
        output_tokens,
        success,
      })

      if (error) {
        console.error(`Error recording metrics for prompt ${promptId}:`, error)
      }
    } catch (error) {
      console.error(`Error recording metrics for prompt ${promptId}:`, error)
    }
  }

  /**
   * Create or update a prompt
   */
  static async savePrompt(
    prompt: Partial<Prompt>,
    adminUserId: string,
    changeNotes?: string,
  ): Promise<{ success: boolean; promptId?: string; error?: string }> {
    try {
      const supabase = getSupabaseClient()

      if (prompt.id) {
        // Update existing prompt
        const { error } = await supabase.rpc("update_prompt_with_version", {
          p_prompt_id: prompt.id,
          p_name: prompt.name,
          p_description: prompt.description,
          p_system_prompt: prompt.system_prompt,
          p_temperature: prompt.temperature,
          p_category: prompt.category,
          p_is_active: prompt.is_active,
          p_admin_user_id: adminUserId,
          p_change_notes: changeNotes || "Updated prompt",
        })

        if (error) {
          console.error("Error updating prompt:", error)
          return { success: false, error: error.message }
        }

        // Invalidate cache
        if (prompt.name) {
          promptCache.delete(prompt.name)
        }

        return { success: true, promptId: prompt.id }
      } else {
        // Create new prompt
        const { data, error } = await supabase
          .from("prompts")
          .insert({
            name: prompt.name,
            description: prompt.description,
            system_prompt: prompt.system_prompt,
            temperature: prompt.temperature,
            category: prompt.category,
            is_active: prompt.is_active !== undefined ? prompt.is_active : true,
          })
          .select("id")
          .single()

        if (error || !data) {
          console.error("Error creating prompt:", error)
          return { success: false, error: error?.message || "Failed to create prompt" }
        }

        // Create initial version
        const { error: versionError } = await supabase.from("prompt_versions").insert({
          prompt_id: data.id,
          system_prompt: prompt.system_prompt!,
          temperature: prompt.temperature!,
          created_by: adminUserId,
          change_notes: changeNotes || "Initial version",
        })

        if (versionError) {
          console.error("Error creating prompt version:", versionError)
          return { success: false, error: versionError.message }
        }

        return { success: true, promptId: data.id }
      }
    } catch (error) {
      console.error("Error saving prompt:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Delete a prompt
   */
  static async deletePrompt(promptId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient()

      // Get the prompt name first to invalidate cache
      const { data: promptData } = await supabase.from("prompts").select("name").eq("id", promptId).single()

      // Use the stored procedure to delete the prompt and all related data
      const { error } = await supabase.rpc("delete_prompt_cascade", {
        p_prompt_id: promptId,
      })

      if (error) {
        console.error("Error deleting prompt:", error)
        return { success: false, error: error.message }
      }

      // Invalidate cache if we got the prompt name
      if (promptData?.name) {
        promptCache.delete(promptData.name)
      }

      return { success: true }
    } catch (error) {
      console.error("Error deleting prompt:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Clear the prompt cache
   */
  static clearCache(): void {
    promptCache.clear()
  }
}
