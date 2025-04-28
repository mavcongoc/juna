"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AdminLogoutButton } from "@/components/admin/admin-logout-button"
import { LayoutDashboard, FileText, BarChart, Settings, Users, Database, Shield } from "lucide-react"

interface AdminNavProps extends React.HTMLAttributes<HTMLElement> {}

export function AdminNav({ className, ...props }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Prompts",
      href: "/admin/prompts",
      icon: FileText,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Database",
      href: "/admin/database",
      icon: Database,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      name: "Roles",
      href: "/admin/roles",
      icon: Shield,
    },
  ]

  return (
    <nav className={cn("flex flex-col space-y-1 p-4", className)} {...props}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "justify-start",
              "flex items-center",
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
      <div className="mt-auto pt-4">
        <AdminLogoutButton />
      </div>
    </nav>
  )
}
