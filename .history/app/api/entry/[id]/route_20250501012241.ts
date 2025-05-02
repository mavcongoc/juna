import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Initialize Supabase client with more robust error handling
const getSupabaseClient = () => {
  try {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    throw new Error("Failed to initialize database client")
  }
}

// Helper function to validate UUID
function isValidUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Helper function to get the current user ID from the session
async function getCurrentUserId() {
  try {
    const cookieStore = cookies()
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        },
      },
    )

    const { data } = await supabaseClient.auth.getSession()
    return data.session?.user.id || "anonymous"
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return "anonymous"
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
    }

    // Validate that the ID is a valid UUID
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid entry ID format" }, { status: 400 })
    }

    // Get a fresh Supabase client
    const supabase = getSupabaseClient()

    // Add timeout for the query
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timed out")), 10000),
    )

    // Actual query with joined tags and categories
    const queryPromise = supabase
      .from("journal_entries")
      .select(`
        *,
        entry_tags(
          tag_id,
          confidence,
          tags:tag_id(id, name, description, category_id)
        ),
        entry_categories(
          category_id,
          categories:category_id(id, name, description)
        )
      `)
      .eq("id", id)
      .single()

    // Race between timeout and query
    const { data, error } = (await Promise.race([
      queryPromise,
      timeoutPromise.then(() => {
        throw new Error("Query timed out")
      }),
    ])) as any

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Get the current user ID
    const currentUserId = await getCurrentUserId()

    // Check if the entry belongs to the current user or if it's an anonymous entry
    if (data.user_id !== currentUserId && data.user_id !== "anonymous" && currentUserId !== "anonymous") {
      return NextResponse.json({ error: "You don't have permission to access this entry" }, { status: 403 })
    }

    // Process the data to make it more usable for the frontend
    const processedData = {
      ...data,
      tags: data.entry_tags
        ? data.entry_tags
            .filter((et: any) => et.tags)
            .map((et: any) => ({
              id: et.tags.id,
              name: et.tags.name,
              description: et.tags.description,
              category_id: et.tags.category_id,
              confidence: et.confidence,
            }))
        : [],
      categories: data.entry_categories
        ? data.entry_categories
            .filter((ec: any) => ec.categories)
            .map((ec: any) => ({
              id: ec.categories.id,
              name: ec.categories.name,
              description: ec.categories.description,
            }))
        : [],
    }

    // Remove the raw join data to clean up the response
    delete processedData.entry_tags
    delete processedData.entry_categories

    return NextResponse.json(
      {
        success: true,
        data: processedData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred while fetching the entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
    }

    // Validate that the ID is a valid UUID
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid entry ID format" }, { status: 400 })
    }

    // Get a fresh Supabase client
    const supabase = getSupabaseClient()

    // Get the current user ID
    const currentUserId = await getCurrentUserId()

    // First, check if the entry belongs to the current user
    const { data: entry, error: fetchError } = await supabase
      .from("journal_entries")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Supabase error:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Check if the entry belongs to the current user or if it's an anonymous entry
    if (entry.user_id !== currentUserId && entry.user_id !== "anonymous" && currentUserId !== "anonymous") {
      return NextResponse.json({ error: "You don't have permission to delete this entry" }, { status: 403 })
    }

    // Delete the entry
    const { error } = await supabase.from("journal_entries").delete().eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Entry deleted successfully",
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
