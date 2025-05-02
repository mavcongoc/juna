import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entryId = searchParams.get("entryId")

  if (!entryId) {
    return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
  }

  try {
    const supabase = getSupabaseClient()

    // Get tags for a specific entry
    const { data: entryTags, error } = await supabase
      .from("entry_tags")
      .select(`
        id,
        entry_id,
        tag_id,
        confidence,
        tags(id, name, description, category_id, categories(id, name))
      `)
      .eq("entry_id", entryId)

    if (error) {
      console.error("Error fetching entry tags:", error)
      return NextResponse.json({ error: "Failed to fetch entry tags" }, { status: 500 })
    }

    return NextResponse.json({ entryTags })
  } catch (error) {
    console.error("Unexpected error in entry-tags API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { entryId, tagIds } = await request.json()

    if (!entryId || !tagIds || !Array.isArray(tagIds)) {
      return NextResponse.json({ error: "Entry ID and tag IDs array are required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Create tag assignments
    const tagAssignments = tagIds.map((tagId) => ({
      entry_id: entryId,
      tag_id: tagId,
    }))

    // Save tag assignments to database
    const { error } = await supabase.from("entry_tags").upsert(tagAssignments, { onConflict: "entry_id,tag_id" })

    if (error) {
      console.error("Error saving tag assignments:", error)
      return NextResponse.json({ error: "Failed to save tag assignments" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Tags assigned successfully",
    })
  } catch (error) {
    console.error("Error in entry-tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get("entryId")
    const tagId = searchParams.get("tagId")

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    let query = supabase.from("entry_tags").delete().eq("entry_id", entryId)

    // If tagId is provided, only delete that specific tag
    if (tagId) {
      query = query.eq("tag_id", tagId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting tag assignments:", error)
      return NextResponse.json({ error: "Failed to delete tag assignments" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: tagId ? "Tag removed successfully" : "All tags removed successfully",
    })
  } catch (error) {
    console.error("Error in entry-tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
