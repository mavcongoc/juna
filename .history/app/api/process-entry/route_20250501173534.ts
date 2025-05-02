import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getUserWithRole } from "@/lib/auth-utils" // Use the secure helper
import { getOpenAI } from "@/lib/openai"
// Removed getServiceClient import
import { ProfileAnalyzerService } from "@/lib/services/profile-analyzer-service"

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user securely
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Get request body
    const { content } = await request.json()
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

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
    const openai = getOpenAI()

    // 4. Process the entry with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps process journal entries. Extract key themes, emotions, and insights from the entry.",
        },
        {
          role: "user",
          content,
        },
      ],
    })

    const analysis = completion.choices[0].message.content

    // 5. Insert the entry into the database (RLS protects this)
    const { data: entry, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: authenticatedUserId, // Use authenticated user ID
        content,
        // Assuming 'analysis' is the correct column name for the AI content
        // If the column is 'ai_analysis', update this line accordingly
        analysis: analysis,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting journal entry:", error)
      return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 })
    }

    // 6. Analyze the entry and update the clinical profile (using authenticated ID)
    // This runs asynchronously so it doesn't block the response
    ProfileAnalyzerService.analyzeEntryAndUpdateProfile(authenticatedUserId, entry).catch((err) =>
      console.error(`Error analyzing entry ${entry?.id} for clinical profile update for user ${authenticatedUserId}:`, err),
    )

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("Error processing journal entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
