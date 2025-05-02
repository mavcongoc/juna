import { getSupabaseClient } from "@/lib/supabase-client"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { User, Session } from "@supabase/supabase-js" // Import User and Session types

// Define the expected structure for the cookie store used by createServerClient
interface CookieStore {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
}

export class AdminAuthService {
  /**
   * Check if the current user has an admin role ('admin' or 'super_admin') server-side.
   * Relies on the standard Supabase session and the user_roles table.
   * This method MUST be called from a server context (Server Component, API Route, Route Handler).
   *
   * @param requiredRole Optional specific role to check for (defaults to checking for 'admin' or 'super_admin').
   * @returns Promise<boolean> True if the user has the required admin role, false otherwise.
   */
  static async isAdmin(requiredRole: "admin" | "super_admin" | null = null): Promise<boolean> {
    // This check MUST run server-side. Client-side checks are insecure.
    if (typeof window !== "undefined") {
      console.warn("[ADMIN AUTH] isAdmin check called on client-side. This is insecure and will always return false.")
      return false
    }

    try {
      // Await the cookies() promise
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              // Now cookieStore is resolved, access get directly
              return cookieStore.get(name)
            },
            set(name: string, value: string, options: CookieOptions) {
              try {
                 // Now cookieStore is resolved, access set directly
                cookieStore.set({ name, value, ...options })
              } catch (error) {
                // Handle potential errors during cookie setting (e.g., invalid options)
                console.error(`[ADMIN AUTH] Error setting cookie '${name}':`, error)
              }
            },
            remove(name: string, options: CookieOptions) {
              try {
                // Now cookieStore is resolved, access set directly
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                 // Handle potential errors during cookie removal
                 console.error(`[ADMIN AUTH] Error removing cookie '${name}':`, error)
              }
            },
          },
        }
      )

      // Get current user session server-side
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[ADMIN AUTH] Error getting session:", sessionError.message)
        return false
      }

      if (!session?.user) {
        // console.log("[ADMIN AUTH] No active session found.") // Optional: reduce noise
        return false
      }

      // Check the user_roles table for the user's role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (roleError) {
        // If error is 'PGRST116', it means no rows found (user has no role assigned).
        if (roleError.code !== 'PGRST116') {
            console.error("[ADMIN AUTH] Error fetching user role:", roleError)
        } else {
            // console.log(`[ADMIN AUTH] No role found for user ${session.user.id}.`) // Optional: reduce noise
        }
        return false
      }

      if (!roleData?.role) {
        // console.log(`[ADMIN AUTH] Role data is empty for user ${session.user.id}.`) // Optional: reduce noise
        return false
      }

      // Check if the user's role meets the requirement
      const userRole = roleData.role as "user" | "admin" | "super_admin"
      const adminRoles: Array<"admin" | "super_admin"> = ["admin", "super_admin"]

      if (requiredRole) {
        // Check for a specific required role.
        // Consider if 'super_admin' should implicitly satisfy 'admin'.
        // Current logic: 'super_admin' satisfies 'admin' check.
        if (requiredRole === 'admin') {
            // Ensure userRole is one of the admin roles before checking includes
            return userRole === 'admin' || userRole === 'super_admin';
        }
         // Strict check for the specific role ('super_admin' only matches 'super_admin')
        return userRole === requiredRole
      } else {
        // Default: check if user is any type of admin ('admin' or 'super_admin')
         // Ensure userRole is one of the admin roles before checking includes
        return userRole === 'admin' || userRole === 'super_admin';
      }

    } catch (error) {
      console.error("[ADMIN AUTH] Server-side admin check error:", error)
      return false
    }
  }

  /**
   * Sign in a user using standard Supabase authentication.
   * This method should be called client-side (e.g., from a login form).
   * It DOES NOT perform role verification itself. Role verification MUST happen
   * server-side AFTER successful authentication before granting access to protected areas.
   *
   * @param email User's email
   * @param password User's password
   * @returns Promise<{ success: boolean; user?: User; session?: Session; error?: { message: string } }>
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; session?: Session; error?: { message: string } }> {
    console.log("[AUTH] Attempting sign-in for:", email)
    // Use the standard client for initiating the auth flow client-side
    const supabase = getSupabaseClient()

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("[AUTH] Supabase sign-in failed:", authError.message)
        // Provide a user-friendly error message if possible
        const message = authError.message.includes("Invalid login credentials")
          ? "Invalid email or password."
          : "Authentication failed. Please try again."
        return { success: false, error: { message } }
      }

      if (!authData.user || !authData.session) {
        console.error("[AUTH] No user or session returned from Supabase auth.")
        return { success: false, error: { message: "Authentication failed: Invalid response from server." } }
      }

      console.log("[AUTH] Supabase sign-in successful for user:", authData.user.id)

      // Return success with user and session info.
      // The CALLER is responsible for server-side role verification.
      return { success: true, user: authData.user, session: authData.session }

    } catch (error: any) {
        console.error("[AUTH] Unexpected sign-in error:", error)
        return { success: false, error: { message: error.message || "An unexpected error occurred during sign-in." } }
    }
  }

  /**
   * Sign out the current user using the standard Supabase client.
   * This should be called client-side.
   *
   * @returns Promise<{ success: boolean; error?: { message: string } }>
   */
  static async signOut(): Promise<{ success: boolean; error?: { message: string } }> {
    console.log("[AUTH] Signing out user...")
    const supabase = getSupabaseClient()

    try {
      // Sign out from Supabase - this handles session/cookie clearing
      const { error } = await supabase.auth.signOut()

      if (error) {
        // Log the error but proceed as the goal is local session clearance
        console.error("[AUTH] Error signing out from Supabase:", error.message)
      }

      console.log("[AUTH] Supabase sign out completed.")

      // Client-side redirect is often handled by the UI component calling signOut,
      // removing the hardcoded redirect from here.
      // Example: router.push('/') in the component.

      return { success: true }
    } catch (error: any) {
      console.error("[AUTH] Unexpected sign-out error:", error)
      // Ensure the catch block returns the correct structure
      return { success: false, error: { message: error.message || "An unexpected error occurred during sign-out." } }
    }
  }
}

// No deprecated functions included.
