import { type NextRequest, NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { getServiceClient } from "@/lib/supabase-client"
import { getUserFromRequest } from "@/lib/auth-utils"
import { ProfileAnalyzerService } from "@/lib/services/profile-analyzer-service"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const supabase = getServiceClient()
    const openai = getOpenAI()

    // Process the entry with OpenAI
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

    // Insert the entry into the database
    const { data: entry, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        content,
        analysis,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting journal entry:", error)
      return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 })
    }

    // Analyze the entry and update the clinical profile
    // This runs asynchronously so it doesn't block the response
    ProfileAnalyzerService.analyzeEntryAndUpdateProfile(user.id, entry).catch((err) =>
      console.error("Error analyzing entry for clinical profile:", err),
    )

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("Error processing journal entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
