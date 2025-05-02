import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { AdminAuthService } from "@/lib/admin/admin-auth"
// Removed createApiSupabaseClient import

export async function GET() {
  try {
    // 1. Check if the user is an admin (already uses refactored service)
    const isAdmin = await AdminAuthService.isAdmin()
    if (!isAdmin) {
      // Use 403 Forbidden as the user might be authenticated but not admin
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    // 2. Create server-side Supabase client for RLS context
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

    // 3. Fetch prompts - RLS policy "Allow admin access" will apply
    const { data, error } = await supabase.from("prompts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ensure we're returning an array, even if empty
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching prompts:", error)
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // 1. Check if the user is an admin
    const isAdmin = await AdminAuthService.isAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    // 2. Get request body
    const data = await request.json()
    // TODO: Add validation for the incoming prompt data

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

    // 4. Insert prompt - RLS policy "Allow admin access" will apply
    const { data: result, error } = await supabase.from("prompts").insert([data]).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating prompt:", error)
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 })
  }
}
