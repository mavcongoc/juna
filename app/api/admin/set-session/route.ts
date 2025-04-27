import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is in admin_users table
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (error || !adminUser) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
    }

    // Set admin session cookie
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set admin session error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
