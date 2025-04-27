import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { getGPTService } from "@/lib/gpt-service"
import { PromptTemplates } from "@/lib/prompt-templates"

// Explicitly set the runtime
export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, userId = "anonymous" } = body

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log(`Processing chat message for user: ${userId}`)

    // Get recent journal entries for context
    const supabase = getSupabaseClient()
    const { data: recentEntries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("content, emotions, themes, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3)

    if (entriesError) {
      console.error("Error fetching recent entries:", entriesError)
    }

    // Build context from recent entries
    let contextPrompt = "The user is asking: " + message

    if (recentEntries && recentEntries.length > 0) {
      contextPrompt = `
        The user has recently written these journal entries:
        ${recentEntries.map((entry) => `- ${entry.content.substring(0, 100)}...`).join("\n")}
        
        Based on this context, respond to the user's message: ${message}
      `
    }

    // Initialize the GPT service
    const gptService = getGPTService()

    // Call GPT-4o for a response
    const {
      success,
      data: response,
      error,
    } = await gptService.generateText(contextPrompt, PromptTemplates.conversationalChat.system, {
      temperature: PromptTemplates.conversationalChat.temperature,
    })

    if (!success || !response) {
      console.error("Error generating chat response:", error)
      return NextResponse.json(
        {
          error: "Failed to generate response",
          success: false,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      response: response,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Failed to process your message",
        success: false,
      },
      { status: 500 },
    )
  }
}
