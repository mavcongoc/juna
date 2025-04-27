import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Create a Supabase client for server components
 * This should be used in Server Components and Route Handlers
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        try {
          return cookieStore.get(name)?.value
        } catch (error) {
          console.error(`Error getting cookie ${name}:`, error)
          return undefined
        }
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          console.error(`Error setting cookie ${name}:`, error)
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          console.error(`Error removing cookie ${name}:`, error)
        }
      },
    },
    auth: {
      persistSession: true,
      // Disable debug logs to reduce noise
      debug: false,
    },
  })
}
