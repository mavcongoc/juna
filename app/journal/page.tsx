"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, PauseCircle, Send, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import JournalPrompts from "@/components/journal-prompts"
import { useAuth } from "@/contexts/auth-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type JournalEntry = {
  id: string
  content: string
  created_at: string
  type: string
  emotions?: string[]
}

export default function JournalPage() {
  const router = useRouter()
  const { getUserId } = useAuth()
  const [entry, setEntry] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previousEntries, setPreviousEntries] = useState<JournalEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const entriesRef = useRef<HTMLDivElement>(null)

  // Get current date and time
  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeString = today.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })

  useEffect(() => {
    // Fetch previous entries
    const fetchPreviousEntries = async () => {
      try {
        setIsLoadingEntries(true)
        const userId = getUserId()
        const response = await fetch(`/api/entry?userId=${userId}&limit=5`)
        const result = await response.json()

        if (result.success && result.data) {
          setPreviousEntries(result.data)
          setFilteredEntries(result.data)
        }
      } catch (error) {
        console.error("Error fetching previous entries:", error)
      } finally {
        setIsLoadingEntries(false)
      }
    }

    fetchPreviousEntries()
  }, [getUserId])

  // Filter entries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(previousEntries)
      return
    }

    const filtered = previousEntries.filter((entry) => entry.content.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredEntries(filtered)
  }, [searchQuery, previousEntries])

  const handleEntryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEntry(e.target.value)
  }

  const handleSubmit = async () => {
    if (!entry.trim()) return

    setIsSaving(true)

    try {
      const userId = getUserId()

      // Call the API to save the entry
      const response = await fetch("/api/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entry,
          type: "text",
          userId: userId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save entry")
      }

      // Redirect to the entry detail page
      if (result.data && result.data[0] && result.data[0].id) {
        router.push(`/journal/${result.data[0].id}`)
      } else {
        // Clear the form if we can't redirect
        setEntry("")
      }
    } catch (error) {
      console.error("Error saving entry:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Voice recording functionality would be implemented here
  }

  const handleSelectPrompt = (prompt: string) => {
    setEntry((current) => {
      // If there's already content, add a line break before the prompt
      if (current.trim()) {
        return `${current}\n\n${prompt}\n`
      }
      return `${prompt}\n`
    })
  }

  const scrollEntries = (direction: "left" | "right") => {
    if (entriesRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300
      entriesRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Date and time display */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-light text-gradient">Journal</h2>
        <p className="text-sm text-muted-foreground mt-1">{dateString}</p>
      </div>

      {/* Journal prompts */}
      <JournalPrompts onSelectPrompt={handleSelectPrompt} />

      {/* Journal entry area */}
      <Card className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-sm border border-border/40 p-6 mb-6">
        <Textarea
          className="w-full min-h-[300px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/50 text-lg bg-transparent"
          placeholder="Start writing..."
          value={entry}
          onChange={handleEntryChange}
        />

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/40">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={`rounded-full ${isRecording ? "text-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
          >
            {isRecording ? <PauseCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!entry.trim() || isSaving}
            className="rounded-full px-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            {isSaving ? "Saving..." : "Save"}
            {!isSaving && <Send className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </Card>

      {/* Previous entries section with search and filter */}
      {previousEntries.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Previous Entries</h3>
            <div className="flex items-center space-x-2">
              {showSearch ? (
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 text-sm"
                  />
                  <Button variant="ghost" size="sm" className="ml-1 h-8 w-8 p-0" onClick={() => setShowSearch(false)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => scrollEntries("left")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => scrollEntries("right")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            ref={entriesRef}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredEntries.length > 0 ? (
              filteredEntries.map((prevEntry) => (
                <Link
                  href={`/journal/${prevEntry.id}`}
                  key={prevEntry.id}
                  className="min-w-[250px] max-w-[250px] mr-4 snap-start"
                >
                  <Card className="h-32 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">{formatDate(prevEntry.created_at)}</span>
                        {prevEntry.emotions && prevEntry.emotions.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {prevEntry.emotions[0]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-3">{prevEntry.content}</p>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="w-full text-center py-4 text-sm text-muted-foreground">No entries match your search</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
