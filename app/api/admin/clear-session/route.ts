import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Clear admin session cookie
    cookies().set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Clear admin session error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
