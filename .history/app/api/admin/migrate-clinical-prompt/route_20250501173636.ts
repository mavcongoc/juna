import { NextResponse } from "next/server"
import { migrateClinicalProfilePrompt } from "@/lib/admin/migrate-clinical-prompt"
// Removed deprecated import
import { getUserWithRole } from "@/lib/auth-utils" // Use the secure helper

export async function POST(request: Request) {
  try {
    // 1. Authenticate and authorize admin user
    const { user, role } = await getUserWithRole();
    if (!user || !role || !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 }); // Use 403 Forbidden
    }
    const adminUserId = user.id; // Get the authenticated admin's ID

    // 2. Run the migration, passing the authenticated admin ID
    const success = await migrateClinicalProfilePrompt(adminUserId)

    if (!success) {
      return NextResponse.json({ error: "Failed to migrate clinical profile prompt" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Clinical profile analysis prompt successfully migrated to database",
    })
  } catch (error) {
    console.error("Error in migrate-clinical-prompt route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
