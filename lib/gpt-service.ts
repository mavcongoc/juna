import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { AIStreamCallbacksAndOptions } from "ai"
import type { z } from "zod"
import { PromptService } from "./admin/prompt-service"
import { LRUCache } from "lru-cache"

// Define types for our service
export type GPTServiceOptions = {
  temperature?: number
  maxTokens?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
  retries?: number
}

export type GPTServiceResponse<T = string> = {
  success: boolean
  data?: T
  error?: string
}

export type StreamCallbacks = {
  onStart?: () => void
  onToken?: (token: string) => void
  onCompletion?: (completion: string) => void
  onError?: (error: Error) => void
}

// Default options aligned with the recommended settings
const DEFAULT_OPTIONS: GPTServiceOptions = {
  temperature: 0.3,
  maxTokens: 1000,
  topP: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
  retries: 2,
}

// Cache for prompt templates
const promptCache = new LRUCache<string, { system: string; temperature: number; timestamp: number }>({
  max: 100, // Maximum number of items to store
  ttl: 1000 * 60 * 5, // 5 minutes TTL
})

/**
 * GPT Service for handling interactions with OpenAI's GPT-4o model
 */
export class GPTService {
  private apiKey: string

  constructor(apiKey: string = process.env.OPENAI_API_KEY || "") {
    this.apiKey = apiKey
  }

  /**
   * Get a prompt template from the database or cache
   */
  private async getPromptTemplate(promptName: string): Promise<{ system: string; temperature: number } | null> {
    // Check cache first
    const cachedPrompt = promptCache.get(promptName)
    if (cachedPrompt) {
      return {
        system: cachedPrompt.system,
        temperature: cachedPrompt.temperature,
      }
    }

    try {
      // Fetch from database
      const prompt = await PromptService.getActivePromptByName(promptName)

      if (prompt) {
        // Store in cache
        promptCache.set(promptName, {
          ...prompt,
          timestamp: Date.now(),
        })
        return prompt
      }

      // If not found in database, log warning and return null
      console.warn(`Prompt template "${promptName}" not found in database`)
      return null
    } catch (error) {
      console.error(`Error fetching prompt template "${promptName}":`, error)
      return null
    }
  }

  /**
   * Generate text using a named prompt template
   */
  async generateTextWithTemplate(
    promptName: string,
    promptVariables: Record<string, string>,
    options: GPTServiceOptions = {},
  ): Promise<GPTServiceResponse<string>> {
    try {
      // Get the prompt template
      const template = await this.getPromptTemplate(promptName)

      if (!template) {
        return {
          success: false,
          error: `Prompt template "${promptName}" not found`,
        }
      }

      // Merge options with template settings
      const mergedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        temperature: options.temperature ?? template.temperature,
      }

      // Replace variables in the prompt template
      let systemPrompt = template.system
      for (const [key, value] of Object.entries(promptVariables)) {
        systemPrompt = systemPrompt.replace(new RegExp(`{{${key}}}`, "g"), value)
      }

      // Track usage metrics
      const startTime = Date.now()

      // Generate text
      const result = await this.generateText(
        promptVariables.prompt || promptVariables.input || "",
        systemPrompt,
        mergedOptions,
      )

      // Record metrics
      const duration = Date.now() - startTime
      this.recordPromptUsage(promptName, duration, result)

      return result
    } catch (error) {
      console.error(`Error generating text with template "${promptName}":`, error)
      return {
        success: false,
        error: `Failed to generate text with template: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Record prompt usage metrics
   */
  private async recordPromptUsage(
    promptName: string,
    duration: number,
    result: GPTServiceResponse<string>,
  ): Promise<void> {
    try {
      // Estimate token usage (very rough estimate)
      const inputTokens = result.data ? Math.ceil(result.data.length / 4) : 0
      const outputTokens = result.data ? Math.ceil(result.data.length / 4) : 0

      // Record metrics asynchronously (don't await)
      PromptService.recordPromptUsageMetrics(promptName, duration, inputTokens, outputTokens, result.success).catch(
        (err) => {
          console.error(`Failed to record prompt usage metrics for "${promptName}":`, err)
        },
      )
    } catch (error) {
      console.error(`Error recording prompt usage metrics for "${promptName}":`, error)
    }
  }

  /**
   * Generate text using GPT-4o with a standard completion
   */
  async generateText(
    prompt: string,
    systemPrompt = "You are a professional, precise, and highly structured assistant. Always follow the instructions exactly.",
    options: GPTServiceOptions = {},
  ): Promise<GPTServiceResponse<string>> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    let attempts = 0
    let lastError: Error | null = null

    while (attempts <= mergedOptions.retries!) {
      try {
        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt,
          system: systemPrompt,
          temperature: mergedOptions.temperature,
          maxTokens: mergedOptions.maxTokens,
          topP: mergedOptions.topP,
          presencePenalty: mergedOptions.presencePenalty,
          frequencyPenalty: mergedOptions.frequencyPenalty,
        })

        return {
          success: true,
          data: text,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(
          `Error generating text with GPT-4o (attempt ${attempts + 1}/${mergedOptions.retries! + 1}):`,
          error,
        )
        attempts++

        // If this was the last attempt, break out of the loop
        if (attempts > mergedOptions.retries!) {
          break
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
      }
    }

    return {
      success: false,
      error: lastError?.message || "Unknown error occurred after multiple attempts",
    }
  }

  /**
   * Generate structured data (like JSON) using GPT-4o with schema validation
   */
  async generateStructuredData<T>(
    prompt: string,
    systemPrompt = "You are a data formatter. Output responses strictly in valid JSON format with no markdown formatting.",
    options: GPTServiceOptions = {},
    schema?: z.ZodType<T>,
  ): Promise<GPTServiceResponse<T>> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    let attempts = 0
    let lastError: Error | null = null
    let lastResponse: string | null = null

    while (attempts <= mergedOptions.retries!) {
      try {
        const response = await this.generateText(prompt, systemPrompt, options)

        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to generate structured data")
        }

        // Clean the response to handle potential markdown formatting
        const cleanedResponse = this.cleanJsonResponse(response.data)
        lastResponse = cleanedResponse

        try {
          const parsedData = JSON.parse(cleanedResponse) as T

          // Validate against schema if provided
          if (schema) {
            const validationResult = schema.safeParse(parsedData)
            if (!validationResult.success) {
              console.error("Schema validation failed:", validationResult.error)

              // If this isn't the last attempt, try again with a more explicit prompt
              if (attempts < mergedOptions.retries!) {
                const enhancedPrompt = `
                  ${prompt}
                  
                  IMPORTANT: Your previous response did not match the required schema. 
                  Please ensure your response is a valid JSON object with the exact structure requested.
                  The validation errors were: ${validationResult.error.message}
                `
                attempts++
                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
                continue
              } else {
                throw new Error(`Schema validation failed: ${validationResult.error.message}`)
              }
            }
          }

          return {
            success: true,
            data: parsedData,
          }
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError)
          console.error("Raw response:", response.data)
          console.error("Cleaned response:", cleanedResponse)

          // If this isn't the last attempt, try again with a more explicit prompt
          if (attempts < mergedOptions.retries!) {
            const enhancedPrompt = `
              ${prompt}
              
              IMPORTANT: Your previous response could not be parsed as valid JSON. 
              Please ensure your response is a valid JSON object with no markdown formatting, no code blocks, and no extra text.
              Just return the raw JSON object.
            `
            attempts++
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
            continue
          } else {
            throw new Error("Failed to parse structured data response")
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(
          `Error generating structured data with GPT-4o (attempt ${attempts + 1}/${mergedOptions.retries! + 1}):`,
          error,
        )
        attempts++

        // If this was the last attempt, break out of the loop
        if (attempts > mergedOptions.retries!) {
          break
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
      }
    }

    // If we have a last response, try to salvage it even if it didn't validate
    if (lastResponse) {
      try {
        const parsedData = JSON.parse(lastResponse) as T
        console.warn("Returning non-validated data as fallback")
        return {
          success: true,
          data: parsedData,
        }
      } catch (e) {
        // Ignore this error and fall through to the error response
      }
    }

    return {
      success: false,
      error: lastError?.message || "Unknown error occurred after multiple attempts",
    }
  }

  /**
   * Generate structured data using a named prompt template
   */
  async generateStructuredDataWithTemplate<T>(
    promptName: string,
    promptVariables: Record<string, string>,
    options: GPTServiceOptions = {},
    schema?: z.ZodType<T>,
  ): Promise<GPTServiceResponse<T>> {
    try {
      // Get the prompt template
      const template = await this.getPromptTemplate(promptName)

      if (!template) {
        return {
          success: false,
          error: `Prompt template "${promptName}" not found`,
        }
      }

      // Merge options with template settings
      const mergedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        temperature: options.temperature ?? template.temperature,
      }

      // Replace variables in the prompt template
      let systemPrompt = template.system
      for (const [key, value] of Object.entries(promptVariables)) {
        systemPrompt = systemPrompt.replace(new RegExp(`{{${key}}}`, "g"), value)
      }

      // Track usage metrics
      const startTime = Date.now()

      // Generate structured data
      const result = await this.generateStructuredData<T>(
        promptVariables.prompt || promptVariables.input || "",
        systemPrompt,
        mergedOptions,
        schema,
      )

      // Record metrics
      const duration = Date.now() - startTime
      this.recordPromptUsage(promptName, duration, result)

      return result
    } catch (error) {
      console.error(`Error generating structured data with template "${promptName}":`, error)
      return {
        success: false,
        error: `Failed to generate structured data with template: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Stream text generation using GPT-4o
   */
  async streamText(
    prompt: string,
    systemPrompt = "You are a professional, precise, and highly structured assistant. Always follow the instructions exactly.",
    callbacks: StreamCallbacks = {},
    options: GPTServiceOptions = {},
  ) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    let attempts = 0
    let lastError: Error | null = null

    while (attempts <= mergedOptions.retries!) {
      try {
        const aiCallbacks: AIStreamCallbacksAndOptions = {
          onStart: callbacks.onStart,
          onToken: callbacks.onToken,
          onCompletion: callbacks.onCompletion,
        }

        const result = streamText({
          model: openai("gpt-4o"),
          prompt,
          system: systemPrompt,
          temperature: mergedOptions.temperature,
          maxTokens: mergedOptions.maxTokens,
          topP: mergedOptions.topP,
          presencePenalty: mergedOptions.presencePenalty,
          frequencyPenalty: mergedOptions.frequencyPenalty,
          ...aiCallbacks,
        })

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(
          `Error streaming text with GPT-4o (attempt ${attempts + 1}/${mergedOptions.retries! + 1}):`,
          error,
        )
        attempts++

        // If this was the last attempt, break out of the loop
        if (attempts > mergedOptions.retries!) {
          break
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
      }
    }

    if (callbacks.onError) {
      callbacks.onError(lastError || new Error("Unknown error occurred after multiple attempts"))
    }
    throw lastError || new Error("Unknown error occurred after multiple attempts")
  }

  /**
   * Stream text using a named prompt template
   */
  async streamTextWithTemplate(
    promptName: string,
    promptVariables: Record<string, string>,
    callbacks: StreamCallbacks = {},
    options: GPTServiceOptions = {},
  ) {
    try {
      // Get the prompt template
      const template = await this.getPromptTemplate(promptName)

      if (!template) {
        if (callbacks.onError) {
          callbacks.onError(new Error(`Prompt template "${promptName}" not found`))
        }
        throw new Error(`Prompt template "${promptName}" not found`)
      }

      // Merge options with template settings
      const mergedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        temperature: options.temperature ?? template.temperature,
      }

      // Replace variables in the prompt template
      let systemPrompt = template.system
      for (const [key, value] of Object.entries(promptVariables)) {
        systemPrompt = systemPrompt.replace(new RegExp(`{{${key}}}`, "g"), value)
      }

      // Track usage metrics (start time)
      const startTime = Date.now()

      // Wrap callbacks to track metrics
      const wrappedCallbacks: StreamCallbacks = {
        onStart: callbacks.onStart,
        onToken: callbacks.onToken,
        onCompletion: (completion) => {
          // Record metrics when stream completes
          const duration = Date.now() - startTime
          this.recordPromptUsage(promptName, duration, {
            success: true,
            data: completion,
          })

          if (callbacks.onCompletion) {
            callbacks.onCompletion(completion)
          }
        },
        onError: (error) => {
          // Record failed attempt
          const duration = Date.now() - startTime
          this.recordPromptUsage(promptName, duration, {
            success: false,
            error: error.message,
          })

          if (callbacks.onError) {
            callbacks.onError(error)
          }
        },
      }

      // Stream text
      return this.streamText(
        promptVariables.prompt || promptVariables.input || "",
        systemPrompt,
        wrappedCallbacks,
        mergedOptions,
      )
    } catch (error) {
      console.error(`Error streaming text with template "${promptName}":`, error)
      if (callbacks.onError) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)))
      }
      throw error
    }
  }

  /**
   * Helper function to clean up JSON responses that might contain markdown formatting
   */
  private cleanJsonResponse(text: string): string {
    // Remove markdown code block formatting if present
    let cleaned = text.trim()

    // Check if the response is wrapped in markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim()
    }

    // Remove any leading/trailing whitespace or quotes
    cleaned = cleaned.replace(/^["']+|["']+$/g, "")

    return cleaned
  }

  /**
   * Clear the prompt cache
   */
  clearPromptCache(): void {
    promptCache.clear()
  }

  /**
   * Invalidate a specific prompt in the cache
   */
  invalidatePromptCache(promptName: string): void {
    promptCache.delete(promptName)
  }
}

// Create a singleton instance for easy import
let gptServiceInstance: GPTService | null = null

export const getGPTService = (): GPTService => {
  if (!gptServiceInstance) {
    gptServiceInstance = new GPTService()
  }
  return gptServiceInstance
}
