"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import TagFilter from "@/components/tag-filter"

type JournalEntry = {
  id: string
  content: string
  created_at: string
  type: string
  sentiment_score?: number
  entry_tags?: { tag_id: string }[]
  entry_categories?: { category_id: string }[]
}

export default function HistoryPage() {
  const { getUserId } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const userId = getUserId()

        // Build the query URL with filters
        let url = `/api/entry?userId=${userId}&limit=20`

        // Add tag filter if selected
        if (selectedTags.length > 0) {
          url += `&tagId=${selectedTags[0]}` // For now, just use the first selected tag
        }

        // Add category filter if selected
        if (selectedCategories.length > 0) {
          url += `&categoryId=${selectedCategories[0]}` // For now, just use the first selected category
        }

        const response = await fetch(url)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch entries")
        }

        setEntries(result.data || [])
      } catch (error) {
        console.error("Error fetching entries:", error)
        setError(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [getUserId, selectedTags, selectedCategories])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getSentimentEmoji = (score?: number) => {
    if (score === undefined) return "😐"
    if (score >= 0.5) return "😊"
    if (score >= 0.1) return "🙂"
    if (score >= -0.1) return "😐"
    if (score >= -0.5) return "🙁"
    return "😢"
  }

  // Filter entries based on search query
  const filteredEntries = entries.filter((entry) => entry.content.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-normal">Your Journal</h2>
        <p className="text-sm text-muted-foreground mt-1">Reflect on your past entries</p>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search entries..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <TagFilter
          onFilterChange={(tags, categories) => {
            setSelectedTags(tags)
            setSelectedCategories(categories)
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || selectedTags.length > 0 || selectedCategories.length > 0
              ? "No journal entries found matching your criteria."
              : "No journal entries found."}
          </p>
          <Link href="/journal">
            <Button className="mt-4 rounded-full">Write Your First Entry</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="mb-2 text-sm font-medium text-muted-foreground flex justify-between">
                <span>{formatDate(entry.created_at)}</span>
                <div className="flex items-center">
                  {entry.sentiment_score !== undefined && (
                    <span className="mr-2">{getSentimentEmoji(entry.sentiment_score)}</span>
                  )}
                  {entry.type === "voice" && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      Voice
                    </span>
                  )}
                </div>
              </div>

              <p className="line-clamp-3 mb-3 text-foreground">{entry.content}</p>

              <div className="flex justify-between items-center">
                <Link href={`/journal/${entry.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    Read more
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
