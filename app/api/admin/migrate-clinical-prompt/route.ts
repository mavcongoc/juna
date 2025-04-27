import { NextResponse } from "next/server"
import { migrateClinicalProfilePrompt } from "@/lib/admin/migrate-clinical-prompt"
import { getAdminUserFromRequest } from "@/lib/admin/admin-auth"

export async function POST(request: Request) {
  try {
    // Verify admin user
    const adminUser = await getAdminUserFromRequest(request)

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the migration
    const success = await migrateClinicalProfilePrompt(adminUser.id)

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
