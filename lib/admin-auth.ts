import { getSupabaseClient } from "@/lib/supabase-client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Simple utility for admin authentication
 */
export const AdminAuth = {
  /**
   * Check if the current user is an admin (server-side)
   */
  async isAdmin() {
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

      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return false
      }

      // Check if user is in admin_users table
      const { data, error } = await supabase
        .from("admin_users")
        .select("is_admin")
        .eq("user_id", session.user.id)
        .single()

      if (error || !data || !data.is_admin) {
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking admin access:", error)
      return false
    }
  },

  /**
   * Check if the current user is an admin (client-side)
   */
  async isAdminClient() {
    try {
      const supabase = getSupabaseClient()

      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return false
      }

      // Check if user is in admin_users table
      const { data, error } = await supabase
        .from("admin_users")
        .select("is_admin")
        .eq("user_id", session.user.id)
        .single()

      if (error || !data || !data.is_admin) {
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking admin access:", error)
      return false
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      return true
    } catch (error) {
      console.error("Error signing out:", error)
      return false
    }
  },
}
