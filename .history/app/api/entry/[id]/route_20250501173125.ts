import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getUserWithRole } from "@/lib/auth-utils" // Import the secure helper

// Helper function to validate UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Removed getSupabaseClient and getCurrentUserId helpers

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
    }
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid entry ID format" }, { status: 400 })
    }

    // 3. Create server-side Supabase client (handles auth context for RLS)
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

    // 4. Fetch data - RLS automatically enforces ownership based on the authenticated user
    // Add timeout for the query
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timed out")), 10000), // 10 seconds
    )

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
      .single() // Use single() as we expect one entry by ID

    // Race the query against the timeout
    const result = await Promise.race([queryPromise, timeoutPromise]) as { data: any | null, error: any | null };
    const { data, error } = result;


    if (error) {
      // Log the error but return a generic message for security
      console.error("Supabase GET error for entry ID", id, ":", error)
      // RLS might deny access, which could result in an error or just null data.
      // Treat generic errors as server errors, specific errors might indicate not found/forbidden
      if (error.code === 'PGRST116') { // Code for "Not found" when using .single()
         return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 })
    }

    // If RLS prevented access, data will be null even without an error sometimes
    if (!data) {
      return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 })
    }

    // Manual ownership check removed - RLS handles this

    // 5. Process and return data
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
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
    }
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid entry ID format" }, { status: 400 })
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

    // Manual fetch-then-check removed - RLS handles authorization

    // 4. Attempt to delete the entry - RLS will prevent deletion if user doesn't own it
    // We add .select() to check if any row was actually deleted, as RLS might just make the delete affect 0 rows silently.
    const { data: deletedData, error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id) // Add explicit user_id check for safety, though RLS is primary
        .select(); // Select the potentially deleted row count/data

    if (error) {
      // Log the error but return a generic message
      console.error("Supabase DELETE error for entry ID", id, ":", error)
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
    }

    // Check if any rows were affected. If RLS blocked it, count might be 0 or data null/empty.
    // Note: The exact behavior of .delete().select() with RLS might vary slightly. This check assumes it returns empty data if nothing matched or RLS blocked.
    if (!deletedData || deletedData.length === 0) {
        // This could mean the entry didn't exist OR RLS blocked the delete.
        // Returning 404 is common practice here.
        return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 });
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
