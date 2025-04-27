import { NextResponse } from "next/server"
import { AdminAuthService } from "@/lib/admin/admin-auth"

export async function GET() {
  try {
    // Check if the current session has admin privileges
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ isAdmin: false, error: "You do not have admin privileges" }, { status: 403 })
    }

    return NextResponse.json({ isAdmin: true })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Failed to check admin status" }, { status: 500 })
  }
}
