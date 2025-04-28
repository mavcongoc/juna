"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminAuthService } from "@/lib/admin/admin-auth"

export function AdminLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    console.log("[ADMIN] Logout button clicked")
    try {
      const result = await AdminAuthService.signOut()

      if (result.success) {
        console.log("[ADMIN] Logout successful, redirecting to home page")
        // The redirect is handled in the AdminAuthService.signOut method
        // but we'll also try to use the router as a fallback
        router.push("/")
      } else {
        console.error("[ADMIN] Logout failed:", result.error)
        // If the service-level redirect fails, force a redirect here
        window.location.href = "/"
      }
    } catch (error) {
      console.error("[ADMIN] Error during logout:", error)
      // Force redirect on error
      window.location.href = "/"
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}
