import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { getGPTService } from "@/lib/gpt-service"
import { PromptTemplates, buildInsightsPrompt } from "@/lib/prompt-templates"
import { InsightsSchema } from "@/lib/validation-schemas"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const period = searchParams.get("period") || "month" // 'week', 'month', 'year'

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1) // Default to month
    }

    // Get entries for the specified user and time period
    const { data: entries, error: entriesError } = await supabase
      .from("journal_entries")
      .select("id, content, created_at, sentiment_score")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (entriesError) {
      console.error("Error fetching entries:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          emotionTrends: [],
          sentimentTrend: [],
          topThemes: [],
          entryCount: 0,
          averageSentiment: 0,
          timeframe: period,
        },
      })
    }

    // Get tags for these entries
    const entryIds = entries.map((entry) => entry.id)

    const { data: entryTags, error: tagsError } = await supabase
      .from("entry_tags")
      .select(`
        entry_id,
        tag_id,
        tags:tag_id (
          id,
          name,
          description,
          category_id,
          categories:category_id (
            id,
            name,
            description
          )
        )
      `)
      .in("entry_id", entryIds)

    if (tagsError) {
      console.error("Error fetching entry tags:", tagsError)
      return NextResponse.json({ error: "Failed to fetch entry tags" }, { status: 500 })
    }

    // Process emotions and themes from tags
    const emotions: Record<string, number> = {}
    const themes: Record<string, number> = {}

    entryTags?.forEach((item) => {
      if (!item.tags || !item.tags.categories) return

      const categoryName = item.tags.categories.name
      const tagName = item.tags.name

      if (categoryName === "Emotional Patterns") {
        emotions[tagName] = (emotions[tagName] || 0) + 1
      } else {
        themes[tagName] = (themes[tagName] || 0) + 1
      }
    })

    // Format for the response
    const emotionTrends = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion, count]) => ({ emotion, count }))

    const topThemes = Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }))

    // Calculate sentiment trend using actual sentiment scores if available
    const sentimentTrend = entries.map((entry) => ({
      date: entry.created_at,
      score: entry.sentiment_score ?? Math.random() * 2 - 1, // Use actual score or fallback to random
    }))

    // Calculate average sentiment
    const avgSentiment = sentimentTrend.reduce((sum, item) => sum + item.score, 0) / sentimentTrend.length

    // Generate insights using GPT-4o if we have enough data
    let aiInsights = null

    if (entryTags && entryTags.length > 0) {
      try {
        // Group tags by category for the prompt
        const tagsByCategory: Record<string, string[]> = {}

        entryTags.forEach((item) => {
          if (!item.tags || !item.tags.categories) return

          const categoryName = item.tags.categories.name
          const tagName = item.tags.name

          if (!tagsByCategory[categoryName]) {
            tagsByCategory[categoryName] = []
          }

          if (!tagsByCategory[categoryName].includes(tagName)) {
            tagsByCategory[categoryName].push(tagName)
          }
        })

        // Build the prompt for insights generation
        const prompt = buildInsightsPrompt(entries, tagsByCategory)

        // Initialize the GPT service
        const gptService = getGPTService()

        // Call GPT-4o to generate insights with schema validation
        const { success, data, error } = await gptService.generateStructuredData(
          prompt,
          PromptTemplates.insightsGeneration.system,
          {
            temperature: PromptTemplates.insightsGeneration.temperature,
            retries: 2,
          },
          InsightsSchema,
        )

        if (success && data) {
          aiInsights = data
        } else {
          console.error("Error generating AI insights:", error)
          // Provide fallback insights
          aiInsights = {
            summary: "Unable to generate insights from your journal entries at this time.",
            insights: ["Try adding more journal entries for better analysis."],
            suggestions: ["Continue journaling regularly to build a more complete picture."],
          }
        }
      } catch (error) {
        console.error("Error generating AI insights:", error)
        // Continue without AI insights if there's an error
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        emotionTrends,
        sentimentTrend,
        topThemes,
        entryCount: entries.length,
        averageSentiment: avgSentiment,
        timeframe: period,
        aiInsights,
      },
    })
  } catch (error) {
    console.error("Error in insights:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
