import { getSupabaseClient } from "@/lib/supabase-client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export class AdminAuthService {
  /**
   * Check if the current user is an admin
   * This method works in both server and client components
   */
  static async isAdmin(): Promise<boolean> {
    try {
      // For client-side checks
      if (typeof window !== "undefined") {
        return await this.isAdminClient()
      }

      // For server-side checks
      return await this.isAdminServer()
    } catch (error) {
      console.error("[ADMIN AUTH] Error checking admin status:", error)
      return false
    }
  }

  /**
   * Client-side admin check
   * Uses the check-session API endpoint
   */
  static async isAdminClient(): Promise<boolean> {
    try {
      console.log("[ADMIN AUTH] Checking admin status (client-side)")

      // First check for admin session cookie using the API
      const response = await fetch("/api/admin/check-session")
      const data = await response.json()

      console.log("[ADMIN AUTH] Client-side check result:", data)
      return !!data.isAdmin
    } catch (error) {
      console.error("[ADMIN AUTH] Client-side admin check error:", error)
      return false
    }
  }

  /**
   * Server-side admin check
   * Checks both cookies and database
   */
  static async isAdminServer(): Promise<boolean> {
    try {
      console.log("[ADMIN AUTH] Checking admin status (server-side)")

      // Check for admin session cookie first (faster)
      const cookieStore = cookies()
      const adminSessionCookie = cookieStore.get("admin_session")

      if (adminSessionCookie?.value === "true") {
        console.log("[ADMIN AUTH] Admin session cookie found")
        return true
      }

      // If no cookie, check the database
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
            set(name, value, options) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name, options) {
              cookieStore.set({ name, value: "", ...options })
            },
          },
        },
      )

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        console.log("[ADMIN AUTH] No authenticated user found")
        return false
      }

      // Check if user is in admin_users table
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (error || !adminUser) {
        console.log("[ADMIN AUTH] User is not an admin:", error?.message || "No admin record found")
        return false
      }

      console.log("[ADMIN AUTH] User confirmed as admin")
      return true
    } catch (error) {
      console.error("[ADMIN AUTH] Server-side admin check error:", error)
      return false
    }
  }

  /**
   * Sign in an admin user
   */
  static async signIn(email: string, password: string) {
    try {
      const supabase = getSupabaseClient()

      // First, sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error }
      }

      if (!data.user) {
        return { success: false, error: { message: "Authentication failed" } }
      }

      // Check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", data.user.id)
        .single()

      if (adminError || !adminData) {
        // Sign out if not an admin
        await supabase.auth.signOut()
        return { success: false, error: { message: "You do not have admin privileges" } }
      }

      // Set admin session cookie via API
      const response = await fetch("/api/admin/set-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("[ADMIN AUTH] Failed to set admin session")
      }

      return { success: true, user: data.user, adminData }
    } catch (error) {
      console.error("[ADMIN AUTH] Sign in error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }

  /**
   * Sign out an admin user
   */
  static async signOut() {
    try {
      const supabase = getSupabaseClient()

      // Clear admin session cookie via API
      await fetch("/api/admin/clear-session", { method: "POST" })

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error("[ADMIN AUTH] Sign out error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }
}

/**
 * Backward compatibility function for checking admin status
 * @deprecated Use AdminAuthService.isAdmin() instead
 */
export async function checkAdminAuth(): Promise<boolean> {
  return await AdminAuthService.isAdmin()
}

/**
 * Get admin user from request
 * @deprecated Use AdminAuthService.isAdmin() instead
 */
export async function getAdminUserFromRequest(request: NextRequest) {
  try {
    // Extract the token from the request
    const token = request.cookies.get("sb-access-token")?.value

    if (!token) {
      return null
    }

    // Create a Supabase client
    const supabase = getSupabaseClient()

    // Get the user from the token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    // Check if the user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      return null
    }

    return {
      ...adminUser,
      email: user.email,
    }
  } catch (error) {
    console.error("Error getting admin user from request:", error)
    return null
  }
}
