import { getSupabaseClient } from "./supabase-client"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Get the current user from a request object
 * @param request The Next.js request object
 * @returns The user object or null if not authenticated
 */
export async function getUserFromRequest(request: NextRequest) {
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

    return user
  } catch (error) {
    console.error("Error getting user from request:", error)
    return null
  }
}

/**
 * Get the current user from server components
 * @returns The user object or null if not authenticated
 */
export async function getUser() {
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

    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.user || null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}
