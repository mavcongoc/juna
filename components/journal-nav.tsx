"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, MessageSquare, LineChart, ListTodo, History, Lightbulb, UserCircle } from "lucide-react"

interface JournalNavProps {
  className?: string
}

export function JournalNav({ className }: JournalNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Journal",
      href: "/journal",
      icon: BookOpen,
      active: pathname === "/journal",
    },
    {
      name: "Talk",
      href: "/journal/talk",
      icon: MessageSquare,
      active: pathname === "/journal/talk",
    },
    {
      name: "Insights",
      href: "/journal/insights",
      icon: LineChart,
      active: pathname === "/journal/insights",
    },
    {
      name: "Actions",
      href: "/journal/actions",
      icon: ListTodo,
      active: pathname === "/journal/actions",
    },
    {
      name: "History",
      href: "/journal/history",
      icon: History,
      active: pathname === "/journal/history",
    },
    {
      name: "Techniques",
      href: "/journal/techniques",
      icon: Lightbulb,
      active: pathname === "/journal/techniques",
    },
    {
      name: "Clinical Profile",
      href: "/profile/clinical",
      icon: UserCircle,
      active: pathname === "/profile/clinical",
    },
  ]

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            item.active ? "bg-accent text-accent-foreground" : "transparent",
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  )
}
