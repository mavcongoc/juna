import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[API] Clearing admin session")
    const cookieStore = cookies()

    // Clear the admin session cookie
    cookieStore.set("admin_session", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[API] Error clearing admin session:", error)
    return NextResponse.json({ success: false, error: "Failed to clear session" }, { status: 500 })
  }
}
