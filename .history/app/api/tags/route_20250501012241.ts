import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    const supabase = getSupabaseClient()

    let query = supabase.from("tags").select(`
      id, 
      name, 
      description, 
      category_id,
      categories(id, name, description)
    `)

    // Filter by category if provided
    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data: tags, error } = await query.order("name")

    if (error) {
      console.error("Error fetching tags:", error)
      return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error("Unexpected error in tags API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
