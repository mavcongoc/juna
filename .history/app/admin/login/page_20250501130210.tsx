"use client"

import { useState, useTransition } from "react" // Import useTransition
import { useRouter } from "next/navigation" // Use next/navigation for App Router
import { AdminAuthService } from "@/lib/admin/admin-auth" // Corrected path
import { verifyAdminRoleServerAction } from "./actions" // Import the server action
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, startTransition] = useTransition() // Add transition state for server action
  const router = useRouter()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true) // Loading state for Supabase auth
    setError(null)

    try {
      // Step 1: Authenticate with Supabase using the refactored service
      const signInResult = await AdminAuthService.signIn(email, password)

      if (!signInResult.success || !signInResult.user) {
        setError(signInResult.error?.message || "Authentication failed.")
        setIsLoading(false)
        return
      }

      console.log("[ADMIN LOGIN] Supabase auth successful for:", signInResult.user.id)

      // Step 2: Server-side Role Verification (CRITICAL)
      // After successful Supabase auth, we MUST verify the role server-side.
      // This typically involves calling a Server Action or a dedicated API route
      // that uses `AdminAuthService.isAdmin()` securely on the server.

      // Call the Server Action to verify the role
      startTransition(async () => {
        const verificationResult = await verifyAdminRoleServerAction();

        if (verificationResult.isAdmin) {
          console.log("[ADMIN LOGIN] Server action confirmed admin role. Redirecting...")
          // Redirect to the admin dashboard on successful verification
          router.push("/admin/dashboard") // Or appropriate admin landing page
          // No need to setIsLoading(false) here as navigation occurs
        } else {
          console.log("[ADMIN LOGIN] Server action denied access:", verificationResult.error)
          setError(verificationResult.error || "Admin role verification failed.")
          // Sign the user out as they authenticated but aren't an admin
          await AdminAuthService.signOut()
          setIsLoading(false) // Stop loading indicator
        }
      });

    } catch (err: any) {
      // Catch errors from the initial AdminAuthService.signIn call
      console.error("[ADMIN LOGIN] Sign-in error:", err)
      setError(err.message || "An unexpected error occurred during sign-in.")
      setIsLoading(false) // Stop loading indicator
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isVerifying} // Disable while loading or verifying
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || isVerifying}>
              {isLoading ? "Authenticating..." : isVerifying ? "Verifying..." : "Login"}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm text-gray-500">
            This is the admin login portal.
        </CardFooter>
      </Card>
    </div>
  )
}
