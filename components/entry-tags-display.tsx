"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Tag {
  id: string
  name: string
  description: string
  confidence: number
  explanation?: string
  categories?: {
    id: string
    name: string
  }
}

interface EntryTagsDisplayProps {
  entryId: string
}

export default function EntryTagsDisplay({ entryId }: EntryTagsDisplayProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTags = async () => {
      if (!entryId) return

      try {
        setLoading(true)
        const response = await fetch(`/api/entry-tags?entryId=${entryId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch tags")
        }

        const data = await response.json()

        // Transform the data structure to extract tags with their categories
        const formattedTags = data.entryTags.map((item: any) => ({
          id: item.tag_id,
          name: item.tags.name,
          description: item.tags.description,
          confidence: item.confidence,
          explanation: item.explanation,
          categories: item.tags.categories,
        }))

        setTags(formattedTags)
      } catch (err) {
        console.error("Error fetching entry tags:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch tags")
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [entryId])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-500 mt-2">Error: {error}</p>
  }

  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">No tags found for this entry.</p>
  }

  // Group tags by category
  const tagsByCategory = tags.reduce((acc: Record<string, Tag[]>, tag) => {
    const categoryName = tag.categories?.name || "Uncategorized"
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(tag)
    return acc
  }, {})

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 hover:bg-green-200"
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  return (
    <div className="space-y-4 mt-4">
      {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => (
              <TooltipProvider key={tag.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`${getConfidenceColor(tag.confidence)} cursor-help transition-colors`}
                    >
                      {tag.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{tag.name}</p>
                      <p className="text-xs">{tag.description}</p>
                      {tag.explanation && <p className="text-xs italic mt-1">"{tag.explanation}"</p>}
                      <p className="text-xs font-medium mt-1">Confidence: {Math.round(tag.confidence * 100)}%</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
