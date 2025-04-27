"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowLeft, Lightbulb, Trash, ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import EntryTagsDisplay from "@/components/entry-tags-display"

type JournalEntry = {
  id: string
  content: string
  created_at: string
  user_id: string
  type: string
  categories: string[]
  emotions: string[]
  themes: string[]
  cbt_insight: string
  ifs_insight: string
  sentiment_score: number
}

// Helper function to validate UUID
function isValidUUID(id: string) {
  // Reserved route names that should not be treated as IDs
  const reservedRoutes = ["talk", "insights", "actions", "history"]

  // If the segment is a reserved route name, it's not a valid ID
  if (reservedRoutes.includes(id.toLowerCase())) {
    return false
  }

  // More lenient UUID validation that accepts any string format that could be a valid ID
  return typeof id === "string" && id.length > 8
}

export default function JournalEntryDetail() {
  const params = useParams()
  const router = useRouter()
  const { getUserId } = useAuth()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [adjacentEntries, setAdjacentEntries] = useState<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  })

  // Check if this is a reserved route and redirect if needed
  useEffect(() => {
    const id = params.id as string
    const reservedRoutes = ["talk", "insights", "actions", "history"]

    if (reservedRoutes.includes(id)) {
      // If it's a known route, redirect to that route
      router.replace(`/journal/${id}`)
      return
    }
  }, [params.id, router])

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        // Validate that the ID is a valid UUID
        const id = params.id as string

        // Check if this is a reserved route name
        const reservedRoutes = ["talk", "insights", "actions", "history"]
        if (reservedRoutes.includes(id.toLowerCase())) {
          // Don't throw an error, just return early
          // The redirect in the other useEffect will handle this
          return
        }

        if (!isValidUUID(id)) {
          throw new Error("Invalid entry ID format")
        }

        setIsLoading(true)
        setError(null)

        // Add timeout to the fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(`/api/entry/${id}`, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Entry not found")
          }
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Server responded with status: ${response.status}`)
        }

        const result = await response.json()

        // Verify that the entry belongs to the current user
        const userId = getUserId()
        if (result.data.user_id !== userId && userId !== "anonymous") {
          throw new Error("You don't have permission to view this entry")
        }

        setEntry(result.data)

        // Fetch adjacent entries
        fetchAdjacentEntries(id, userId)
      } catch (error) {
        console.error("Error fetching entry:", error)
        setError(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchEntry()
    }
  }, [params.id, getUserId])

  const fetchAdjacentEntries = async (currentId: string, userId: string) => {
    try {
      // Fetch all entries to find adjacent ones
      const response = await fetch(`/api/entry?userId=${userId}&limit=100`)
      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        const entries = result.data
        const currentIndex = entries.findIndex((e: any) => e.id === currentId)

        if (currentIndex > -1) {
          const prevEntry = currentIndex < entries.length - 1 ? entries[currentIndex + 1].id : null
          const nextEntry = currentIndex > 0 ? entries[currentIndex - 1].id : null

          setAdjacentEntries({
            prev: prevEntry,
            next: nextEntry,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching adjacent entries:", error)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/entry/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to delete entry")
      }

      // Redirect to history page after successful deletion
      router.push("/journal/history")
    } catch (error) {
      console.error("Error deleting entry:", error)
      setError(error instanceof Error ? error.message : "Failed to delete entry")
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      Joy: "bg-yellow-100 text-yellow-800",
      Motivation: "bg-green-100 text-green-800",
      Anxiety: "bg-purple-100 text-purple-800",
      Determination: "bg-blue-100 text-blue-800",
      Overwhelm: "bg-red-100 text-red-800",
      Frustration: "bg-orange-100 text-orange-800",
      Sadness: "bg-indigo-100 text-indigo-800",
    }

    return emotionColors[emotion] || "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/journal/history")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Journal
        </Button>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested journal entry could not be found.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/journal/history")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Journal
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/journal")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Journal
        </Button>
        <div className="flex items-center">
          {adjacentEntries.prev && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/journal/${adjacentEntries.prev}`)}
              className="mr-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {adjacentEntries.next && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/journal/${adjacentEntries.next}`)}
              className="mr-1"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your journal entry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-normal text-muted-foreground">{formatDate(entry.created_at)}</h2>

          {entry.emotions && entry.emotions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {entry.emotions.map((emotion, i) => (
                <span key={i} className={`text-xs px-2 py-1 rounded-full ${getEmotionColor(emotion)}`}>
                  {emotion}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6 mb-8">
          <p className="whitespace-pre-wrap text-lg leading-relaxed">{entry.content}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center mb-4">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-medium">Reflections</h3>
        </div>

        <Tabs defaultValue="cbt" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cbt">CBT Perspective</TabsTrigger>
            <TabsTrigger value="ifs">IFS Perspective</TabsTrigger>
          </TabsList>
          <TabsContent value="cbt" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md mt-2">
            <p>{entry.cbt_insight}</p>
          </TabsContent>
          <TabsContent value="ifs" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md mt-2">
            <p>{entry.ifs_insight}</p>
          </TabsContent>
        </Tabs>

        {entry.themes && entry.themes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-medium mb-2">Themes in your writing:</h4>
            <div className="flex flex-wrap gap-2">
              {entry.themes.map((theme, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Display AI-identified tags */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-medium mb-2">AI-Identified Patterns:</h4>
          <EntryTagsDisplay entryId={entry.id} />
        </div>
      </div>
    </div>
  )
}
