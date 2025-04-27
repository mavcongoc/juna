"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeDecoration() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [stars, setStars] = useState<Array<{ id: number; size: number; top: string; left: string; delay: number }>>([])

  // Generate random stars for dark mode
  useEffect(() => {
    setMounted(true)

    // Only generate stars if we're in dark mode
    if (resolvedTheme === "dark") {
      const newStars = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 1, // 1-3px
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 4, // 0-4s delay for twinkling
      }))
      setStars(newStars)
    } else {
      setStars([])
    }
  }, [resolvedTheme])

  if (!mounted) return null

  return (
    <>
      {/* Base theme decoration */}
      <div className="theme-bg-decoration" />

      {/* Stars for dark mode */}
      {resolvedTheme === "dark" &&
        stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
    </>
  )
}
