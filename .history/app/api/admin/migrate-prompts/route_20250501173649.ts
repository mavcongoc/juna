import { NextResponse } from "next/server"
// Removed deprecated import
import { getUserWithRole } from "@/lib/auth-utils" // Use the secure helper
import { PromptTemplates } from "@/lib/prompt-templates"

export async function POST(req: Request) {
  try {
    // 1. Authenticate and authorize admin user
    const { user, role } = await getUserWithRole();
    if (!user || !role || !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 }); // Use 403 Forbidden
    }
    const adminUserId = user.id; // Get the authenticated admin's ID

    // 2. Migrate prompts from code to database, passing the authenticated admin ID
    const result = await PromptTemplates.migrateToDatabase(adminUserId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to migrate prompts" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.migratedCount} prompts to the database`,
      migratedCount: result.migratedCount,
    })
  } catch (error) {
    console.error("Error migrating prompts:", error)
    return NextResponse.json({ error: "Failed to migrate prompts" }, { status: 500 })
  }
}
