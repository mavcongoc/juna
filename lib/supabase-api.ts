import { createClient } from "@supabase/supabase-js"

// Cache for API route clients
const apiClientCache = new Map()

/**
 * Create a Supabase client for API routes
 * This ensures each API route gets its own client instance
 * but reuses it for subsequent calls within the same route
 */
export function createApiSupabaseClient(cacheKey = "default") {
  // Check if we already have a client for this cache key
  if (apiClientCache.has(cacheKey)) {
    return apiClientCache.get(cacheKey)
  }

  // Create a new client
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Store in cache
  apiClientCache.set(cacheKey, client)

  return client
}
