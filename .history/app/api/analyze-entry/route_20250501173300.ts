import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getUserWithRole } from "@/lib/auth-utils" // Import the secure helper
// Removed getSupabaseClient import
import { getGPTService } from "@/lib/gpt-service"
import { PromptTemplates, buildJournalAnalysisPrompt } from "@/lib/prompt-templates"
import { JournalAnalysisSchema } from "@/lib/validation-schemas"

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Get request body
    const { entryId, content } = await request.json()
    if (!entryId || !content) {
      return NextResponse.json({ error: "Entry ID and content are required" }, { status: 400 })
    }
    // TODO: Add UUID validation for entryId if needed

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

    // 4. Fetch categories and tags (RLS might apply if these tables are secured)
    const { data: categories } = await supabase.from("categories").select("id, name, description")
    const { data: tags } = await supabase.from("tags").select("id, name, description, category_id")

    if (!categories || !tags) {
      return NextResponse.json({ error: "Failed to fetch categories and tags" }, { status: 500 })
    }

    // Build the prompt for journal analysis
    const prompt = buildJournalAnalysisPrompt(content, categories, tags)

    // Initialize the GPT service
    const gptService = getGPTService()

    // Call GPT-4o to analyze the entry with schema validation
    const {
      success,
      data: analysis,
      error,
    } = await gptService.generateStructuredData(
      prompt,
      PromptTemplates.journalAnalysis.system,
      {
        temperature: PromptTemplates.journalAnalysis.temperature,
        retries: 2,
      },
      JournalAnalysisSchema,
    )

    if (!success || !analysis) {
      console.error("Error analyzing entry with GPT-4o:", error)
      return NextResponse.json({ error: "Failed to analyze entry" }, { status: 500 })
    }

    // 6. Update the entry - RLS will ensure user owns the entry.
    // Add explicit user_id check for defense-in-depth.
    const { data: updatedEntryData, error: updateError } = await supabase
      .from("journal_entries")
      .update({
        ai_analysis: analysis,
        sentiment_score: analysis.sentiment,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .eq("user_id", authenticatedUserId) // Defense-in-depth check
      .select('id') // Select something to confirm the update happened

    if (updateError) {
      console.error(`Error updating entry ${entryId} for user ${authenticatedUserId}:`, updateError)
      // Don't expose detailed error, could be RLS denial
      return NextResponse.json({ error: "Failed to update entry with analysis" }, { status: 500 })
    }

    // Check if the update actually affected a row (RLS might block silently)
    if (!updatedEntryData || updatedEntryData.length === 0) {
        console.warn(`Update for entry ${entryId} did not affect any rows. Possible RLS block or entry not found for user ${authenticatedUserId}.`);
        return NextResponse.json({ error: "Failed to update entry: Not found or access denied." }, { status: 404 });
    }


    // 7. Create tag assignments - RLS on entry_tags relies on user owning the related journal_entry
    if (analysis.tags && analysis.tags.length > 0) {
      const tagAssignments = analysis.tags.map((tag: any) => ({
        entry_id: entryId, // This entryId must belong to the user due to the update check above
        tag_id: tag.id,
        confidence: tag.confidence,
        explanation: tag.explanation,
      }))

      // Delete existing tag assignments for this entry
      // RLS on entry_tags should prevent deleting tags for entries not owned by the user.
      // Add explicit check on the related journal_entry's user_id for defense-in-depth.
      const { error: deleteTagsError } = await supabase
        .from("entry_tags")
        .delete()
        .eq("entry_id", entryId)
        // This check requires joining or assuming RLS handles it based on entry_id's ownership.
        // Simpler to rely on RLS here, but be aware of the dependency.

      if (deleteTagsError) {
          console.error(`Error deleting existing tags for entry ${entryId}:`, deleteTagsError);
          // Proceeding to insert might be okay, or return error depending on desired behavior
      }


      // Save new tag assignments - RLS should allow if user owns entryId
      const { error: tagError } = await supabase.from("entry_tags").insert(tagAssignments)

      if (tagError) {
        console.error("Error saving tag assignments:", tagError)
        return NextResponse.json({ error: "Failed to save tag assignments" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("Error in analyze-entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
