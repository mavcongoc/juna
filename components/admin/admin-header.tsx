"use client"

import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon, LogOut, Settings, LayoutDashboard, FileText, BarChart } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { AdminAuthService } from "@/lib/admin/admin-auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminHeader() {
  const { setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const result = await AdminAuthService.signOut()

      if (result.success) {
        // Redirect to home page
        router.push("/")
      } else {
        console.error("Logout failed:", result.error)
        // Force redirect even if there was an error
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Error during logout:", error)
      // Force redirect on error
      window.location.href = "/"
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/admin" className="flex items-center space-x-2">
            <span className="font-bold">Juna Admin</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <LayoutDashboard className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
              </Button>
            </Link>
            <Link href="/admin/prompts">
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <FileText className="h-5 w-5" />
                <span className="sr-only">Prompts</span>
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <BarChart className="h-5 w-5" />
                <span className="sr-only">Analytics</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 px-0"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 px-0">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}
