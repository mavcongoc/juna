import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AdminLogoutButton } from "@/components/admin/admin-logout-button"

interface AdminNavProps extends React.HTMLAttributes<HTMLElement> {}

export function AdminNav({ className, ...props }: AdminNavProps) {
  return (
    <nav className={cn("flex flex-col space-y-1 p-4", className)} {...props}>
      <Link href="/admin/dashboard" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
        Dashboard
      </Link>
      <Link href="/admin/prompts" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
        Prompts
      </Link>
      <Link href="/admin/analytics" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
        Analytics
      </Link>
      <Link href="/admin/settings" className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
        Settings
      </Link>
      <div className="mt-auto pt-4">
        <AdminLogoutButton />
      </div>
    </nav>
  )
}
