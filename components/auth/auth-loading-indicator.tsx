"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

export function AuthLoadingIndicator() {
  const { isLoading } = useAuth()
  const [showLoading, setShowLoading] = useState(false)

  // Only show loading indicator after a delay to prevent flashing
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoading(true), 500)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [isLoading])

  if (!showLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
      <div className="h-full w-1/3 bg-white opacity-30 animate-[loading_1.5s_ease-in-out_infinite]"></div>
    </div>
  )
}
