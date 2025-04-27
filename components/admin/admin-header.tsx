"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, ShieldCheck, Settings, BarChart2, MessageSquare, FileText, Home } from "lucide-react"
import { AdminAuthService } from "@/lib/admin/admin-auth"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import JunaLogo from "@/components/juna-logo"
import { cn } from "@/lib/utils"

export default function AdminHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()

  const handleSignOut = async () => {
    await AdminAuthService.signOut()
    router.push("/")
  }

  const toggleTheme = () => {
    const currentTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(currentTheme)
  }

  // Admin navigation items (moved from sidebar to top nav)
  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
      exact: true,
    },
    {
      name: "Prompts",
      href: "/admin/prompts",
      icon: MessageSquare,
      exact: false,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart2,
      exact: false,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      exact: false,
    },
    {
      name: "Documentation",
      href: "/admin/prompts/documentation",
      icon: FileText,
      exact: true,
    },
  ]

  return (
    <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex flex-col">
        {/* Top row with logo and actions */}
        <div className="flex justify-between items-center mb-2">
          <Link href="/admin" className="flex items-center gap-2">
            <JunaLogo textClassName="text-xl" />
            <div className="flex items-center text-primary font-medium">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Admin
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {resolvedTheme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Bottom row with navigation */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-1.5",
                    isActive ? "text-secondary-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
