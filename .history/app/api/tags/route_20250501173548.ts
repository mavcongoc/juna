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

    // 2. Get query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

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

    // 4. Build query (RLS doesn't seem to be applied, but auth is now required)
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
