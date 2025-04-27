"use client"

import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function AuthLoading() {
  const { isLoading } = useAuth()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      </div>
    </div>
  )
}
