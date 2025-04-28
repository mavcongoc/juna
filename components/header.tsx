"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  MoonIcon,
  SunIcon,
  LogOut,
  User,
  CreditCard,
  BookOpen,
  MessageSquare,
  BarChart,
  CheckCircle,
  ShieldCheck,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import JunaLogo from "@/components/juna-logo"
import { cn } from "@/lib/utils"
import { useState } from "react"
import AdminLoginModal from "@/components/admin/admin-login-modal"

// Import the AuthLoading component at the top
import AuthLoading from "@/components/auth-loading"

export default function Header() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [showAdminModal, setShowAdminModal] = useState(false)

  // Don't show header on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null
  }

  // Don't show regular header on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  // Function to toggle theme (simplified to just toggle between light/dark)
  const toggleTheme = () => {
    const currentTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(currentTheme)
  }

  // Navigation items
  const navItems = [
    {
      name: "Journal",
      href: "/journal",
      icon: BookOpen,
      exact: true,
    },
    {
      name: "Talk",
      href: "/talk", // Updated to the new route
      icon: MessageSquare,
      exact: true,
    },
    {
      name: "Insights",
      href: "/journal/insights",
      icon: BarChart,
      exact: true,
    },
    {
      name: "Actions",
      href: "/journal/actions",
      icon: CheckCircle,
      exact: true,
    },
  ]

  return (
    <>
      <AuthLoading />
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <JunaLogo textClassName="text-xl" />
          </Link>

          {/* Navigation buttons in header - centered */}
          <div className="hidden md:flex space-x-2 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => {
              // Check if the current path matches this nav item
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

              return (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 h-8",
                      isActive ? "text-secondary-foreground" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="text-xs">{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Admin login button - always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAdminModal(true)}
              className="rounded-full"
              title="Admin Login"
            >
              <ShieldCheck className="h-5 w-5" />
              <span className="sr-only">Admin Login</span>
            </Button>

            {/* Simple theme toggle button */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {resolvedTheme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 hover:bg-primary/20">
                    <User className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/journal" className="cursor-pointer">
                      Journal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/clinical" className="cursor-pointer">
                      Clinical Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="rounded-full">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Admin Login Modal */}
      <AdminLoginModal open={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </>
  )
}
