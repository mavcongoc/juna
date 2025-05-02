"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // Use next/navigation for App Router
import { AdminAuthService } from "@/lib/admin/admin-auth" // Corrected path
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
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

      // Placeholder for server-side role check function/API call
      // const { isAdmin, error: roleError } = await verifyAdminRoleServerSide(); // Replace with actual implementation
      // For now, we'll simulate a successful check and proceed.
      // In a real implementation, this check would determine the redirect.

      // TODO: Implement server-side role verification call here.
      // Example (conceptual):
      /*
      const response = await fetch('/api/admin/verify-role'); // Needs implementation
      if (!response.ok) {
         const data = await response.json();
         setError(data.message || "Role verification failed.");
         setIsLoading(false);
         // Optionally sign the user out if role check fails severely
         // await AdminAuthService.signOut();
         return;
      }
      const { isAdmin } = await response.json();
      if (!isAdmin) {
          setError("You do not have permission to access the admin area.");
          setIsLoading(false);
          // Sign the user out as they authenticated but aren't admin
          await AdminAuthService.signOut();
          return;
      }
      */

      // If role verification passes (simulated for now):
      console.log("[ADMIN LOGIN] Role verified (simulated). Redirecting to admin dashboard.")
      router.push("/admin/dashboard") // Redirect to the main admin page

    } catch (err: any) {
      console.error("[ADMIN LOGIN] Unexpected error:", err)
      setError(err.message || "An unexpected error occurred.")
      setIsLoading(false)
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
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
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
