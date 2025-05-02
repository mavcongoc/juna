import { createClient } from "@supabase/supabase-js" // Keep for now, RLS handles security
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getUserWithRole } from "@/lib/auth-utils" // Import the server-side helper

// Explicitly set the runtime
export const runtime = "edge"

// Initialize Supabase client - RLS policies will enforce security based on auth context
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(req: Request) {
  try {
    // 1. Get authenticated user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id; // Use this ID

    // 2. Get request body, remove userId from destructuring
    const body = await req.json()
    const { content, type = "text" } = body // Removed userId

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Current timestamp
    const timestamp = new Date().toISOString()

    // Insert the entry first to get the ID
    const { data: entryData, error: entryError } = await supabase
      .from("journal_entries")
      .insert([
        {
          content,
          type,
          user_id: authenticatedUserId, // Use the secure user ID
          created_at: timestamp,
          processed: false, // Mark as not processed yet
        },
      ])
      .select()

    if (entryError) {
      console.error("Supabase error:", entryError)
      return NextResponse.json({ error: entryError.message }, { status: 500 })
    }

    // Get the entry ID
    const entryId = entryData[0].id

    // Fetch categories and tags for analysis
    const { data: categories, error: categoriesError } = await supabase.from("categories").select("id, name")
    const { data: tags, error: tagsError } = await supabase.from("tags").select("id, name, category_id")

    if (categoriesError || tagsError) {
      console.error("Error fetching categories or tags:", categoriesError || tagsError)
      return NextResponse.json({ error: "Failed to fetch categories or tags" }, { status: 500 })
    }

    // Create a prompt for OpenAI
    const prompt = `
      Analyze the following journal entry and identify relevant emotional patterns, cognitive patterns, 
      behavioral patterns, self-identity themes, relational dynamics, resilience/coping mechanisms, 
      and stressors/triggers.
      
      Journal Entry:
      "${content}"
      
      Based on the entry, identify the most relevant tags from the following list, organized by category.
      Only select tags that are clearly present in the text (maximum 5-7 tags total):
      
      ${categories
        .map(
          (cat) => `
        ${cat.name}:
        ${tags
          .filter((tag) => tag.category_id === cat.id)
          .map((tag) => tag.name)
          .join(", ")}
      `,
        )
        .join("\n")}
      
      Return your analysis as a JSON object with this structure:
      {
        "tags": [
          {"name": "tag_name", "confidence": 0.0-1.0}
        ],
        "summary": "brief summary of key insights",
        "sentiment_score": 0.0 (between -1.0 and 1.0)
      }
    `

    try {
      // Call OpenAI for analysis
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
      })

      // Parse the response
      let analysis
      try {
        // Extract JSON from the response (in case there's additional text)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Invalid JSON response")
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 })
      }

      // Process the analysis results
      const tagMap = tags.reduce(
        (acc, tag) => {
          acc[tag.name.toLowerCase()] = { id: tag.id, categoryId: tag.category_id }
          return acc
        },
        {} as Record<string, { id: string; categoryId: string }>,
      )

      // Update the journal entry with analysis results
      const { error: updateError } = await supabase
        .from("journal_entries")
        .update({
          processed: true,
          last_processed_at: new Date().toISOString(),
          sentiment_score: analysis.sentiment_score || 0,
        })
        .eq("id", entryId)

      if (updateError) {
        console.error("Error updating entry:", updateError)
      }

      // Add tags to the entry
      if (analysis.tags && analysis.tags.length > 0) {
        for (const tagItem of analysis.tags) {
          const tagInfo = tagMap[tagItem.name.toLowerCase()]
          if (tagInfo) {
            // Add entry-tag relationship
            await supabase.from("entry_tags").upsert({
              entry_id: entryId,
              tag_id: tagInfo.id,
              confidence: tagItem.confidence || 1.0,
            })

            // Add entry-category relationship
            await supabase.from("entry_categories").upsert({
              entry_id: entryId,
              category_id: tagInfo.categoryId,
            })
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          data: entryData,
          analysis: analysis,
        },
        { status: 201 },
      )
    } catch (aiError) {
      console.error("AI processing error:", aiError)

      // Return the entry data even if AI processing fails
      return NextResponse.json(
        {
          success: true,
          data: entryData,
          error: "AI processing failed, but entry was saved",
        },
        { status: 201 },
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    // 1. Get authenticated user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id; // Use this ID

    // 2. Get query parameters, remove userId
    const url = new URL(req.url)
    // const userId = url.searchParams.get("userId") || "anonymous" // Removed
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")
    const tagId = url.searchParams.get("tagId")
    const categoryId = url.searchParams.get("categoryId")

    // Start building the query, using the authenticated user ID
    let query = supabase
      .from("journal_entries")
      .select("*, entry_tags(tag_id, confidence), entry_categories(category_id)")
      .eq("user_id", authenticatedUserId) // Use the secure user ID
      .order("created_at", { ascending: false })

    // Add tag filter if provided
    if (tagId) {
      query = query.eq("entry_tags.tag_id", tagId)
    }

    // Add category filter if provided
    if (categoryId) {
      query = query.eq("entry_categories.category_id", categoryId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute the query
    const { data, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total: count,
          limit,
          offset,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
