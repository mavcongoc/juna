import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  try {
    // First check for admin session cookie
    const cookieStore = cookies()
    const adminSessionCookie = cookieStore.get("admin_session")

    if (adminSessionCookie?.value === "true") {
      console.log("[API] Admin session cookie found")
      return NextResponse.json({ isAdmin: true })
    }

    // If no cookie, check the database
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
      console.log("[API] No authenticated user found")
      return NextResponse.json({ isAdmin: false })
    }

    // Check if user is in admin_users table
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (error || !adminUser) {
      console.log("[API] User is not an admin:", error?.message || "No admin record found")
      return NextResponse.json({ isAdmin: false })
    }

    // Set admin session cookie for future requests
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    console.log("[API] User confirmed as admin")
    return NextResponse.json({ isAdmin: true })
  } catch (error) {
    console.error("[API] Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Failed to check admin status" }, { status: 500 })
  }
}
