"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminAuth } from "@/lib/admin-auth"

export function AdminLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await AdminAuth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}
