import { NextResponse } from "next/server"
import { PromptService } from "@/lib/admin/prompt-service"
// Removed deprecated import
import { getUserWithRole } from "@/lib/auth-utils" // Use the secure helper

export async function GET() {
  try {
    // 1. Authenticate and authorize admin user
    const { user, role } = await getUserWithRole();
    // Allow any authenticated user to fetch categories? Or restrict to admin?
    // Assuming admin-only based on path /api/admin/...
    if (!user || !role || !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    // 2. Get all categories via service (RLS protection depends on service implementation)
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
