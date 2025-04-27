"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PromptCard } from "@/components/admin/prompt-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { PromptWithUsage } from "@/lib/admin/types"

interface PromptListProps {
  initialPrompts?: PromptWithUsage[]
}

export function PromptList({ initialPrompts }: PromptListProps) {
  const [prompts, setPrompts] = useState<PromptWithUsage[]>(initialPrompts || [])
  const [isLoading, setIsLoading] = useState(!initialPrompts)

  // Fetch prompts if not provided
  useEffect(() => {
    if (!initialPrompts) {
      fetchPrompts()
    }
  }, [initialPrompts])

  const fetchPrompts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/prompts")

      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.status}`)
      }

      const data = await response.json()
      setPrompts(data.prompts)
    } catch (error) {
      console.error("Error fetching prompts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Prompt Management</h2>
        <Link href="/admin/prompts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Prompt
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : prompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} usage={prompt.usage} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No prompts found. Create your first prompt to get started.</p>
          <Link href="/admin/prompts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create First Prompt
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
