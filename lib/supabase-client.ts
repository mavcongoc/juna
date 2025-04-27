import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

// Re-export createClient for backward compatibility
export { supabaseCreateClient as createClient }

// Global variable to store the client instance
let supabaseClient: ReturnType<typeof supabaseCreateClient> | null = null

/**
 * Get a singleton instance of the Supabase client for browser environments
 * This follows the recommended pattern for Next.js applications
 */
export const getSupabaseClient = () => {
  // Server-side: Create a new instance each time (will be garbage collected)
  if (typeof window === "undefined") {
    return supabaseCreateClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        debug: false, // Disable debug logs
        storageKey: "juna_auth_token", // Use a unique storage key
      },
    })
  }

  // Client-side: Use singleton pattern with a more robust check
  if (!supabaseClient) {
    console.log("[SUPABASE] Creating new browser client instance")

    // Use a unique storage key to avoid conflicts with other Supabase instances
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          debug: false,
          storageKey: "juna_auth_token", // Use a unique storage key
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  } else {
    console.log("[SUPABASE] Reusing existing browser client instance")
  }

  return supabaseClient
}

// Server-side client with service role for admin operations
export const getServiceClient = () => {
  // Always create a new instance for server operations with service role
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseCreateClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false, // Don't persist sessions for service role client
        debug: false, // Disable debug logs
        storageKey: "juna_service_token", // Use a different storage key for service role
      },
    })
  }

  // Fallback to regular client if service client isn't available
  return getSupabaseClient()
}

// Reset the client (useful for testing)
export const resetSupabaseClient = () => {
  supabaseClient = null
}
