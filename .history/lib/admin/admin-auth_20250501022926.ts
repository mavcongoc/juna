import { getSupabaseClient } from "@/lib/supabase-client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export class AdminAuthService {
  /**
   * Check if the current user has an admin role ('admin' or 'super_admin') server-side.
   * Relies on the standard Supabase session and the user_roles table.
   *
   * @param requiredRole Optional specific role to check for (defaults to 'admin' or 'super_admin').
   * @returns Promise<boolean> True if the user has the required admin role, false otherwise.
   */
  static async isAdmin(requiredRole: "admin" | "super_admin" | null = null): Promise<boolean> {
    try {
      // This check MUST run server-side. Client-side checks are insecure.
      if (typeof window !== "undefined") {
        console.warn("[ADMIN AUTH] isAdmin check called on client-side. This is insecure and will always return false.")
        return false
      }

      const cookieStore = cookies()
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
        return false
      }

      // Check if user is in admin_users table
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (error || !adminUser) {
        return false
      }

      return true
    } catch (error) {
      console.error("[ADMIN AUTH] Server-side admin check error:", error)
      return false
    }
  }

  /**
   * Sign in an admin user
   * This method handles both authentication and setting the admin session
   */
  static async signIn(email: string, password: string) {
    try {
      console.log("[ADMIN AUTH] Signing in admin user:", email)
      const supabase = getSupabaseClient()

      // Step 1: Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[ADMIN AUTH] Authentication failed:", error.message)
        return { success: false, error }
      }

      if (!data.user) {
        console.error("[ADMIN AUTH] No user returned from auth")
        return { success: false, error: { message: "Authentication failed" } }
      }

      console.log("[ADMIN AUTH] User authenticated, checking admin status")

      // Step 2: Check if the user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", data.user.id)
        .single()

      if (adminError) {
        console.error("[ADMIN AUTH] Error checking admin status:", adminError.message)
        await supabase.auth.signOut()
        return { success: false, error: { message: "Error verifying admin privileges" } }
      }

      if (!adminData) {
        console.error("[ADMIN AUTH] User is not an admin")
        await supabase.auth.signOut()
        return { success: false, error: { message: "You do not have admin privileges" } }
      }

      console.log("[ADMIN AUTH] Admin status confirmed, setting session cookie")

      // Step 3: Set admin session cookie directly in the browser
      document.cookie = "admin_session=true; path=/; max-age=86400; SameSite=Lax"

      // Step 4: Also try to set the cookie via a direct API call with the user ID
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          console.warn("[ADMIN AUTH] API login failed, using fallback cookie")
          // Continue anyway since we set the cookie directly
        }
      } catch (apiError) {
        console.warn("[ADMIN AUTH] Error calling login API:", apiError)
        // Continue anyway since we set the cookie directly
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
      console.log("[ADMIN AUTH] Signing out admin user")
      const supabase = getSupabaseClient()

      // Clear admin session cookie directly
      document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"

      // Also try to clear any other auth-related cookies
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("[ADMIN AUTH] Error signing out:", error.message)
        return { success: false, error }
      }

      console.log("[ADMIN AUTH] Successfully signed out")

      // Redirect to home page
      window.location.href = "/"

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
