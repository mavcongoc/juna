import { getSupabaseClient } from "@/lib/supabase-client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export class AdminAuthService {
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

      // Set admin session cookie (will be done via API)
      return { success: true, user: data.user, adminData }
    } catch (error) {
      console.error("Admin sign in error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }

  /**
   * Sign out an admin user
   */
  static async signOut() {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error }
      }

      // Clear admin session cookie (will be done via API)
      return { success: true }
    } catch (error) {
      console.error("Admin sign out error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }

  /**
   * Check if the current user is an admin (server-side)
   */
  static async isAdmin() {
    try {
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

      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session?.user) {
        return false
      }

      // Check if the user is in the admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .single()

      if (adminError || !adminData) {
        return false
      }

      return true
    } catch (error) {
      console.error("Admin check error:", error)
      return false
    }
  }

  /**
   * Get admin user details (server-side)
   */
  static async getAdminUser() {
    try {
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

      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session?.user) {
        return null
      }

      // Get admin user details
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .single()

      if (adminError || !adminData) {
        return null
      }

      return {
        ...adminData,
        email: sessionData.session.user.email,
      }
    } catch (error) {
      console.error("Get admin user error:", error)
      return null
    }
  }
}
