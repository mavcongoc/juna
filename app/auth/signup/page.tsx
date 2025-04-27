"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import JunaLogo from "@/components/juna-logo"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()
  const { signUp, user } = useAuth()

  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev])
  }

  useEffect(() => {
    // If user is already logged in, redirect
    if (user) {
      addLog(`User already logged in, redirecting to journal`)
      router.push("/journal")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    addLog(`Attempting to sign up with email: ${email}`)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      addLog("Sign up failed: Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error, success } = await signUp(email, password)

      if (error) {
        addLog(`Sign up failed: ${error.message}`)
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (success) {
        addLog("Sign up successful")
        setSuccess(true)

        // Redirect to journal page after a delay
        addLog("Redirecting to journal page...")
        setTimeout(() => {
          router.push("/journal")
        }, 2000)
      }
    } catch (err) {
      console.error("Sign up error:", err)
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
            <CardTitle className="text-2xl font-light">Create an Account</CardTitle>
            <CardDescription className="mt-2">Sign up to start your journaling journey</CardDescription>
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
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200 rounded-lg">
                <AlertDescription className="text-green-800">
                  Account created successfully! Redirecting to your journal...
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full rounded-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

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
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
