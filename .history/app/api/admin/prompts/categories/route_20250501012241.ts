import { NextResponse } from "next/server"
import { PromptService } from "@/lib/admin/prompt-service"
import { checkAdminAuth } from "@/lib/admin/admin-auth"

export async function GET() {
  try {
    // Check if user is authenticated as admin
    const authResult = await checkAdminAuth()
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all categories
    const categories = await PromptService.getCategories()

    // Add default category if none exist
    if (categories.length === 0) {
      categories.push("General")
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
