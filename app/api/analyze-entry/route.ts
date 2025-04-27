import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { getGPTService } from "@/lib/gpt-service"
import { PromptTemplates, buildJournalAnalysisPrompt } from "@/lib/prompt-templates"
import { JournalAnalysisSchema } from "@/lib/validation-schemas"

export async function POST(request: Request) {
  try {
    const { entryId, content } = await request.json()

    if (!entryId || !content) {
      return NextResponse.json({ error: "Entry ID and content are required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Fetch all categories and tags to provide context for the AI
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

    // Update the entry with the analysis
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({
        ai_analysis: analysis,
        sentiment_score: analysis.sentiment,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", entryId)

    if (updateError) {
      console.error("Error updating entry with analysis:", updateError)
      return NextResponse.json({ error: "Failed to update entry with analysis" }, { status: 500 })
    }

    // Create tag assignments
    if (analysis.tags && analysis.tags.length > 0) {
      const tagAssignments = analysis.tags.map((tag: any) => ({
        entry_id: entryId,
        tag_id: tag.id,
        confidence: tag.confidence,
        explanation: tag.explanation,
      }))

      // Delete existing tag assignments for this entry
      await supabase.from("entry_tags").delete().eq("entry_id", entryId)

      // Save new tag assignments
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
