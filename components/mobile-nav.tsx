"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, BarChart, MessageSquare, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MobileNav() {
  const pathname = usePathname()

  // Don't show on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null
  }

  // Don't show on landing page
  if (pathname === "/") {
    return null
  }

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border/40">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          // Check if the current path matches this nav item
          const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href} passHref>
              <button
                className={cn(
                  "flex flex-col items-center px-2 py-1 text-xs font-medium rounded-md transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="mb-1 h-5 w-5" />
                {item.name}
              </button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
