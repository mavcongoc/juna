"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; success: boolean }>
  signUp: (email: string, password: string) => Promise<{ error: any; success: boolean }>
  signOut: () => Promise<void>
  getUserId: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a single instance of the Supabase client for the auth context
// This is crucial to prevent multiple GoTrueClient instances
const supabase = getSupabaseClient()

// Global variable to track if the auth listener is already set up across instances
let globalAuthListenerSetup = false

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use a ref to track if this specific instance has initialized
  const isInitialized = useRef(false)

  useEffect(() => {
    // Prevent duplicate initialization in development mode with React.StrictMode
    if (isInitialized.current) {
      return
    }
    isInitialized.current = true

    console.log("[AUTH] AuthProvider mounted")

    // Check for active session on mount
    const getSession = async () => {
      console.log("[AUTH] Fetching initial session")
      setIsLoading(true)

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[AUTH] Error getting session:", error)
        } else {
          console.log("[AUTH] Session fetched:", session ? "Found" : "None")
        }

        // Only update state if component is still mounted
        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error("[AUTH] Unexpected error getting session:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Set up auth state change listener only once globally
    if (!globalAuthListenerSetup) {
      console.log("[AUTH] Setting up auth state listener")
      globalAuthListenerSetup = true

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log("[AUTH] Auth state changed:", event, newSession ? "Session exists" : "No session")

        // Don't set loading to true on state change to prevent flashing
        setSession(newSession)
        setUser(newSession?.user ?? null)
      })

      // Clean up function
      return () => {
        console.log("[AUTH] Cleaning up auth state listener")
        subscription.unsubscribe()
        globalAuthListenerSetup = false
      }
    }

    return undefined
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log(`[AUTH] Attempting to sign in user: ${email}`)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error("[AUTH] Sign in error:", error.message)
        return { error, success: false }
      }

      console.log("[AUTH] Sign in successful:", data.user?.id)
      return { error: null, success: true }
    } catch (err) {
      console.error("[AUTH] Unexpected sign in error:", err)
      return { error: err, success: false }
    }
  }

  const signUp = async (email: string, password: string) => {
    console.log(`[AUTH] Attempting to sign up user: ${email}`)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        console.error("[AUTH] Sign up error:", error.message)
        return { error, success: false }
      }

      console.log("[AUTH] Sign up successful:", data.user?.id)
      return { error: null, success: true }
    } catch (err) {
      console.error("[AUTH] Unexpected sign up error:", err)
      return { error: err, success: false }
    }
  }

  const signOut = async () => {
    console.log("[AUTH] Signing out user:", user?.id)
    await supabase.auth.signOut()
  }

  // Helper function to get current user ID or anonymous
  const getUserId = () => {
    return user?.id || "anonymous"
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, getUserId }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
