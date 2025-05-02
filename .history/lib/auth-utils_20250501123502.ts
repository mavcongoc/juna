import { getSupabaseClient } from "./supabase-client"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { User } from "@supabase/supabase-js"
import type { CookieOptions } from "@supabase/ssr" // Import CookieOptions

// Define the possible application roles
export type AppRole = "user" | "admin" | "super_admin";

// Define the return type for the new function
export type UserWithRole = {
  user: User | null;
  role: AppRole | null;
};

/**
 * Get the current user and their role from server components or API routes.
 * Uses the server-side Supabase client and queries the user_roles table.
 * @returns An object containing the user and their role, or nulls if not authenticated.
 */
export async function getUserWithRole(): Promise<UserWithRole> {
  try {
    const cookieStore = await cookies() // Await cookies

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
             try { cookieStore.set({ name, value, ...options }) } catch (e) { console.error(e) }
          },
          remove(name: string, options: CookieOptions) {
             try { cookieStore.set({ name, value: '', ...options }) } catch (e) { console.error(e) }
          },
        },
      },
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("[AUTH UTILS] Error getting session:", sessionError.message)
      return { user: null, role: null }
    }

    if (!session?.user) {
      return { user: null, role: null }
    }

    const user = session.user;

    // Fetch the role from the user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (roleError && roleError.code !== 'PGRST116') { // Ignore 'No rows found' error
      console.error("[AUTH UTILS] Error fetching user role:", roleError.message)
      // Return user but null role, as auth succeeded but role fetch failed
      return { user, role: null }
    }

    const role = roleData?.role as AppRole | null;

    return { user, role }

  } catch (error) {
    console.error("[AUTH UTILS] Error getting user with role:", error)
    return { user: null, role: null }
  }
}
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
