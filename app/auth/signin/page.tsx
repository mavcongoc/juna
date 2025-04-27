"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import JunaLogo from "@/components/juna-logo"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user } = useAuth()

  // Check if user was redirected from a protected page
  const redirectedFrom = searchParams.get("redirectedFrom") || "/journal"

  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev])
  }

  useEffect(() => {
    // If user is already logged in, redirect
    if (user) {
      addLog(`User already logged in, redirecting to ${redirectedFrom}`)
      router.push(redirectedFrom)
    }
  }, [user, redirectedFrom, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    addLog(`Attempting to sign in with email: ${email}`)

    try {
      const { error, success } = await signIn(email, password)

      if (error) {
        addLog(`Sign in failed: ${error.message}`)
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (success) {
        addLog("Sign in successful, redirecting...")
        // Don't set isLoading to false here to maintain loading state during redirect
        // Redirect will happen automatically via the useEffect when user state updates
      }
    } catch (err) {
      console.error("Sign in error:", err)
      addLog(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <JunaLogo iconClassName="h-10 w-10" textClassName="text-3xl" />
          </div>
          <div>
            <CardTitle className="text-2xl font-light">Welcome back</CardTitle>
            <CardDescription className="mt-2">Enter your details to sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full rounded-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Signing you in...</p>
              </div>
            </div>
          )}

          {/* Authentication logs */}
          {logs.length > 0 && (
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2">Authentication Logs:</h3>
              <div className="max-h-40 overflow-y-auto text-xs font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="py-1 border-b border-border/10 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
