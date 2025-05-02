import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getUserWithRole } from "@/lib/auth-utils" // Import the secure helper
// Removed getSupabaseClient import
import { getGPTService } from "@/lib/gpt-service"
import { PromptTemplates } from "@/lib/prompt-templates"

// Explicitly set the runtime
export const runtime = "edge"

// Define the expected shape of fetched journal entries for chat context
interface ChatContextEntry {
    content: string;
    emotions: string[] | null; // Assuming emotions are stored as an array in ai_analysis
    themes: string[] | null;   // Assuming themes are stored as an array in ai_analysis
    created_at: string;
}


export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Get request body, remove userId
    const body = await req.json()
    const { message } = body // Removed userId

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log(`Processing chat message for user: ${authenticatedUserId}`)

    // 3. Create server-side Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }) } catch (e) { console.error(e) } },
          remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }) } catch (e) { console.error(e) } },
        },
      }
    )

    // 4. Get recent journal entries for context (RLS enforces ownership)
    const { data: recentEntries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("content, ai_analysis->emotions as emotions, ai_analysis->themes as themes, created_at") // Adjust select based on actual ai_analysis structure if needed
      .eq("user_id", authenticatedUserId) // Defense-in-depth check
      .order("created_at", { ascending: false })
      .limit(3)

    if (entriesError) {
      console.error("Error fetching recent entries:", entriesError)
      // Don't necessarily stop, maybe proceed without context
    }

    // Build context from recent entries
    let contextPrompt = "The user is asking: " + message

    // Cast recentEntries to the defined type before mapping
    const typedEntries = recentEntries as ChatContextEntry[] | null;

    if (typedEntries && typedEntries.length > 0) {
      contextPrompt = `
        The user has recently written these journal entries:
        ${typedEntries.map((entry) => `- ${entry.content ? entry.content.substring(0, 100) : '[Entry content unavailable]'}...`).join("\n")}

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
