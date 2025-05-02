"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { Session, User } from "@supabase/supabase-js"

// Define the possible roles based on the enum created in the migration
type AppRole = "user" | "admin" | "super_admin";

type AuthContextType = {
  user: User | null
  session: Session | null
  role: AppRole | null // Add role state
  isLoading: boolean
  isLoadingRole: boolean // Add loading state for role fetching
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
  const [role, setRole] = useState<AppRole | null>(null) // Add role state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRole, setIsLoadingRole] = useState(false) // Add role loading state

  // Use a ref to track if this specific instance has initialized
  const isInitialized = useRef(false)

  // Function to fetch the user's role from the backend
  const fetchUserRole = async (userId: string | undefined) => {
    if (!userId) {
      setRole(null)
      return
    }

    setIsLoadingRole(true)
    try {
      // TODO: Implement API endpoint '/api/auth/role'
      // This endpoint should use the server-side Supabase client and the
      // user_roles table (or claims) to securely get the role.
      const response = await fetch('/api/auth/role'); // No credentials needed if using session cookie
      if (!response.ok) {
        throw new Error(`Failed to fetch role: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.role) {
        setRole(data.role as AppRole);
        console.log("[AUTH] User role fetched:", data.role);
      } else {
        setRole(null); // User might exist but have no role assigned
        console.log("[AUTH] No role found for user:", userId);
      }
    } catch (error) {
      console.error("[AUTH] Error fetching user role:", error);
      setRole(null); // Reset role on error
    } finally {
      setIsLoadingRole(false);
    }
  };


  useEffect(() => {
    // Prevent duplicate initialization in development mode with React.StrictMode
    if (isInitialized.current) {
      return
    }
    isInitialized.current = true

    console.log("[AUTH] AuthProvider mounted")

    // Check for active session on mount
    const getInitialSessionAndRole = async () => {
      console.log("[AUTH] Fetching initial session and role")
      setIsLoading(true)
      setIsLoadingRole(true) // Start loading role too

      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[AUTH] Error getting initial session:", error)
        } else {
          console.log("[AUTH] Initial session fetched:", initialSession ? "Found" : "None")
        }

        // Update session and user state first
        setSession(initialSession)
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser)

        // Fetch role based on the initial user
        await fetchUserRole(initialUser?.id)

      } catch (err) {
        console.error("[AUTH] Unexpected error getting initial session:", err)
        setRole(null) // Ensure role is null on error
      } finally {
        setIsLoading(false) // Session loading finished
        // Role loading is handled within fetchUserRole
      }
    }

    getInitialSessionAndRole()

    // Set up auth state change listener only once globally
    let subscription: any = null; // Define subscription variable outside the if block
    if (!globalAuthListenerSetup) {
      console.log("[AUTH] Setting up auth state listener")
      globalAuthListenerSetup = true

      const listenerData = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log("[AUTH] Auth state changed:", event, newSession ? "Session exists" : "No session")

        const newUser = newSession?.user ?? null;
        setSession(newSession)
        setUser(newUser)

        // Fetch role whenever auth state changes (login/logout)
        if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
          await fetchUserRole(newUser?.id);
        } else if (event === "SIGNED_OUT") {
          setRole(null); // Clear role on sign out
          setIsLoadingRole(false); // Ensure role loading stops on sign out
        }
      });

      subscription = listenerData.data.subscription; // Assign subscription

      // Clean up function
      return () => {
        console.log("[AUTH] Cleaning up auth state listener")
        if (subscription) {
          subscription.unsubscribe()
        }
        globalAuthListenerSetup = false
      }
    }

    return undefined
  }, []) // Empty dependency array ensures this runs only once on mount

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
    <AuthContext.Provider value={{ user, session, role, isLoading, isLoadingRole, signIn, signUp, signOut, getUserId }}>
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
