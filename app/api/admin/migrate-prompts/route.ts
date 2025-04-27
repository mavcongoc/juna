import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/admin/admin-auth"
import { PromptTemplates } from "@/lib/prompt-templates"

export async function POST(req: Request) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth()
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Migrate prompts from code to database
    const result = await PromptTemplates.migrateToDatabase(authResult.user.id)

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
