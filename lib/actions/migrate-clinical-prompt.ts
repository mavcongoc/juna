"use server"

import { migrateClinicalProfilePrompt } from "@/lib/admin/migrate-clinical-prompt"
import { AdminAuthService } from "@/lib/admin/admin-auth"

/**
 * Server action to migrate the clinical profile analysis prompt
 */
export async function migrateClinicalPromptAction(): Promise<{ success: boolean; message: string }> {
  try {
    // Get the current admin user
    const adminUser = await AdminAuthService.getCurrentAdminUser()

    if (!adminUser) {
      return {
        success: false,
        message: "Unauthorized. You must be logged in as an admin to perform this action.",
      }
    }

    // Execute the migration
    const success = await migrateClinicalProfilePrompt(adminUser.user_id)

    if (!success) {
      return {
        success: false,
        message: "Failed to migrate clinical profile prompt. Check server logs for details.",
      }
    }

    return {
      success: true,
      message: "Clinical profile analysis prompt successfully migrated to database!",
    }
  } catch (error) {
    console.error("Error in migrateClinicalPromptAction:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
