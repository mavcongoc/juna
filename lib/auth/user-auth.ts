import { getSupabaseClient } from "@/lib/supabase-client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export class UserAuthService {
  /**
   * Sign in a user with email and password
   */
  static async signIn(email: string, password: string) {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error }
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }

  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string) {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { success: false, error }
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut() {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error("Sign out error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }

  /**
   * Get the current user session (server-side)
   */
  static async getSession() {
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

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        return { success: false, error }
      }

      return { success: true, session: data.session }
    } catch (error) {
      console.error("Get session error:", error)
      return { success: false, error: { message: "An unexpected error occurred" } }
    }
  }
}
