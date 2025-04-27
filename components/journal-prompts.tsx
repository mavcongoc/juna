"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface JournalPromptsProps {
  onSelectPrompt: (prompt: string) => void
  category?: string
}

export default function JournalPrompts({ onSelectPrompt, category = "general" }: JournalPromptsProps) {
  const [prompts, setPrompts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default prompts to use as fallback
  const defaultPrompts = [
    "What are you grateful for today?",
    "Describe a challenge you're facing and how you might overcome it.",
    "Reflect on a moment that brought you joy recently.",
  ]

  const fetchPrompts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/prompts?category=${category}&count=3`)

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success === false) {
        console.warn("API returned success: false", data.error)
        // Use the fallback prompts from the API if available
        setPrompts(data.prompts || defaultPrompts)
        setError("Using default prompts.")
        return
      }

      setPrompts(data.prompts && data.prompts.length > 0 ? data.prompts : defaultPrompts)
    } catch (error) {
      console.error("Error fetching prompts:", error)
      setError("Failed to load prompts. Using default suggestions.")
      // Use default prompts on error
      setPrompts(defaultPrompts)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [category])

  return (
    <div className="mb-6">
      {isLoading ? (
        <div className="w-full flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {prompts.map((prompt, index) => (
            <span
              key={index}
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={() => onSelectPrompt(prompt)}
            >
              {prompt}
              {index < prompts.length - 1 && " • "}
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={fetchPrompts} disabled={isLoading} className="p-0 h-5 w-5 ml-1">
            <RefreshCw className="h-3 w-3" />
            <span className="sr-only">Refresh prompts</span>
          </Button>
        </div>
      )}
    </div>
  )
}
