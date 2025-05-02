import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getUserWithRole } from "@/lib/auth-utils" // Import the secure helper
// Removed getSupabaseClient import

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // const authenticatedUserId = user.id; // Not directly used, relying on RLS

    // 2. Get entryId from query params
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get("entryId")
    if (!entryId) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
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

    // 4. Get tags for the specific entry - RLS will filter based on user ownership of entryId
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
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Get request body
    const { entryId, tagIds } = await request.json()
    if (!entryId || !tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json({ error: "Entry ID and a non-empty tag IDs array are required" }, { status: 400 })
    }
    // TODO: Add UUID validation for entryId and tagIds if needed

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

    // 4. Verify user owns the target entryId before proceeding (defense-in-depth)
    const { data: entryOwner, error: ownerCheckError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('id', entryId)
        .eq('user_id', authenticatedUserId)
        .maybeSingle(); // Use maybeSingle to handle not found

    if (ownerCheckError) {
        console.error(`Error checking ownership for entry ${entryId}:`, ownerCheckError);
        return NextResponse.json({ error: "Failed to verify entry ownership" }, { status: 500 });
    }
    if (!entryOwner) {
        return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 });
    }


    // 5. Create tag assignments
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
    // 1. Authenticate user
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Get entryId and optional tagId from query params
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get("entryId")
    const tagId = searchParams.get("tagId") // Optional
    if (!entryId) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 })
    }
    // TODO: Add UUID validation if needed

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

    // 4. Verify user owns the target entryId before deleting tags (defense-in-depth)
    //    (Alternatively, rely solely on RLS which checks the related journal_entry)
    const { data: entryOwner, error: ownerCheckError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('id', entryId)
        .eq('user_id', authenticatedUserId)
        .maybeSingle();

    if (ownerCheckError) {
        console.error(`Error checking ownership for entry ${entryId} before delete:`, ownerCheckError);
        return NextResponse.json({ error: "Failed to verify entry ownership" }, { status: 500 });
    }
    if (!entryOwner) {
        // Don't leak if entry exists but isn't owned, just say not found/denied
        return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 });
    }

    // 5. Build and execute delete query - RLS will provide primary protection
    let query = supabase.from("entry_tags").delete().eq("entry_id", entryId)

    // If tagId is provided, only delete that specific tag
    if (tagId) {
      query = query.eq("tag_id", tagId)
    }

    // Add select() to check affected rows
    const { data: deletedData, error } = await query.select();

    if (error) {
      console.error(`Error deleting tag assignments for entry ${entryId}:`, error)
      return NextResponse.json({ error: "Failed to delete tag assignments" }, { status: 500 })
    }

    // Check if anything was actually deleted (RLS might block silently)
    if (!deletedData || deletedData.length === 0) {
        // If a specific tagId was given, it might not have existed for that entry.
        // If no tagId was given, it means either no tags existed or RLS blocked.
        // Returning success might be acceptable if the end state (tag is gone) is achieved.
        console.warn(`Delete operation for entry ${entryId} (tag: ${tagId || 'all'}) affected 0 rows.`)
    }

    return NextResponse.json({
      success: true,
      message: tagId ? "Tag removed successfully" : "All tags removed successfully",
      affectedCount: deletedData?.length || 0 // Optionally return count
    })
  } catch (error) {
    console.error("Error in entry-tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
