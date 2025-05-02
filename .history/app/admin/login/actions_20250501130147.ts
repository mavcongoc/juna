"use server"

import { AdminAuthService } from "@/lib/admin/admin-auth"
import { revalidatePath } from "next/cache" // May not be strictly needed here, but good practice

/**
 * Server Action to verify if the currently authenticated user has an admin role.
 * This MUST be called *after* successful Supabase authentication.
 * It uses the secure server-side AdminAuthService.isAdmin check.
 *
 * @returns Promise<{ isAdmin: boolean; error?: string }>
 */
export async function verifyAdminRoleServerAction(): Promise<{ isAdmin: boolean; error?: string }> {
  console.log("[SERVER ACTION] Verifying admin role...")
  try {
    // Use the secure server-side check from AdminAuthService
    const isAdmin = await AdminAuthService.isAdmin() // Checks for 'admin' or 'super_admin' by default

    if (!isAdmin) {
      console.log("[SERVER ACTION] Role verification failed: User is not an admin.")
      // Optionally, could sign the user out here if strict logout-on-fail is desired
      // await AdminAuthService.signOut(); // Be careful with server-side signout, might need client cooperation
      return { isAdmin: false, error: "You do not have permission to access the admin area." }
    }

    console.log("[SERVER ACTION] Role verification successful.")
    // Optional: Revalidate admin paths if needed after successful login/verification
    // revalidatePath('/admin', 'layout');

    return { isAdmin: true }
  } catch (error: any) {
    console.error("[SERVER ACTION] Error verifying admin role:", error)
    return { isAdmin: false, error: error.message || "An unexpected error occurred during role verification." }
  }
}