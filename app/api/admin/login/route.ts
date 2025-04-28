import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[API] Admin login request received")
    const requestUrl = new URL(request.url)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { email, password } = await request.json()

    // First, sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error("[API] Admin login failed:", signInError.message)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Check if the user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", signInData.user.id)
      .single()

    if (adminError || !adminData) {
      console.error("[API] User is not an admin")
      // Sign out the user if they're not an admin
      await supabase.auth.signOut()
      return NextResponse.json({ message: "You do not have admin privileges" }, { status: 403 })
    }

    // Set a session cookie to indicate admin status
    cookieStore.set("admin_session", "true", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    console.log("[API] Admin login successful, session cookie set")
    return NextResponse.json({ message: "Login successful", isAdmin: true }, { status: 200 })
  } catch (error) {
    console.error("[API] Admin login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}
