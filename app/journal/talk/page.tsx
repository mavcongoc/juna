"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Mic, ChevronUp, ChevronDown, Search, Filter, SortAsc, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

type Conversation = {
  id: string
  title: string
  date: string
  preview: string
}

export default function TalkPage() {
  const { getUserId } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Mock conversations data
  useEffect(() => {
    const mockConversations = [
      {
        id: "1",
        title: "Morning Reflection",
        date: "2023-05-15",
        preview: "I've been feeling anxious about my presentation tomorrow...",
      },
      {
        id: "2",
        title: "Stress Management",
        date: "2023-05-12",
        preview: "I need some techniques to manage work stress...",
      },
      {
        id: "3",
        title: "Sleep Issues",
        date: "2023-05-08",
        preview: "I've been having trouble sleeping lately...",
      },
      {
        id: "4",
        title: "Weekend Plans",
        date: "2023-05-05",
        preview: "I'm trying to plan a relaxing weekend...",
      },
    ]
    setConversations(mockConversations)
    setFilteredConversations(mockConversations)
  }, [])

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  // Animation for waveform when AI is speaking
  useEffect(() => {
    if (!waveformRef.current || !isAiSpeaking) return

    const bars = Array.from(waveformRef.current.children) as HTMLElement[]

    const animateBars = () => {
      bars.forEach((bar) => {
        const height = Math.random() * 50 + 10
        bar.style.height = `${height}px`
      })
    }

    const interval = setInterval(animateBars, 100)
    return () => clearInterval(interval)
  }, [isAiSpeaking])

  // Handle click anywhere to start/stop conversation
  const handleContainerClick = (e: React.MouseEvent) => {
    // Ignore clicks on buttons and other interactive elements
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input")
    ) {
      return
    }

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const startListening = () => {
    setIsListening(true)
    setTranscript("")

    // Mock speech recognition
    const mockRecognition = setTimeout(() => {
      setTranscript("I've been feeling anxious about my upcoming presentation. Do you have any advice?")
      stopListening()
      startAiResponse()
    }, 3000)

    return () => clearTimeout(mockRecognition)
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const startAiResponse = () => {
    setIsAiSpeaking(true)
    setAiResponse("")

    // Mock AI response with gradual text appearance
    const response =
      "It's completely normal to feel anxious before a presentation. Try some deep breathing exercises before you start, and remember that being prepared is the best way to reduce anxiety. Practice your presentation several times, and consider visualizing a successful outcome. Would you like me to guide you through a quick relaxation technique?"
    let index = 0

    const interval = setInterval(() => {
      if (index < response.length) {
        setAiResponse((prev) => prev + response[index])
        index++
      } else {
        clearInterval(interval)
        setTimeout(() => setIsAiSpeaking(false), 1000)
      }
    }, 30)

    return () => clearInterval(interval)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-background to-muted/30">
      {/* Main conversation area */}
      <div
        ref={containerRef}
        className="h-full w-full flex flex-col items-center justify-center p-6 relative"
        onClick={handleContainerClick}
      >
        {/* Voice visualization */}
        <div
          ref={waveformRef}
          className={`flex items-center justify-center gap-1 mb-8 h-20 transition-opacity ${
            isAiSpeaking ? "opacity-100" : "opacity-0"
          }`}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full transition-all duration-100"
              style={{
                height: isAiSpeaking ? `${Math.random() * 40 + 10}px` : "10px",
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Transcript and response */}
        <div className="w-full max-w-lg">
          {transcript && (
            <div className="mb-6 text-right">
              <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                <p>{transcript}</p>
              </div>
            </div>
          )}

          {aiResponse && (
            <div className="mb-6">
              <div className="inline-block bg-muted rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                <p>{aiResponse}</p>
              </div>
            </div>
          )}
        </div>

        {/* Listening indicator */}
        {isListening && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-red-500 text-white rounded-full p-3">
                  <Mic className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Listening...</p>
            </div>
          </div>
        )}

        {/* Swipe indicator */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center text-xs text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation()
            setShowHistory(!showHistory)
          }}
        >
          {showHistory ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronUp className="h-4 w-4 mr-1" />}
          {showHistory ? "Hide history" : "View history"}
        </Button>
      </div>

      {/* History drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-lg transform transition-transform duration-300 ease-in-out ${
          showHistory ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Conversation History</h3>
            <div className="flex items-center space-x-2">
              {showSearch ? (
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 text-sm"
                  />
                  <Button variant="ghost" size="sm" className="ml-1 h-8 w-8 p-0" onClick={() => setShowSearch(false)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSearch(true)}>
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <SortAsc className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium">{conversation.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {formatDate(conversation.date)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{conversation.preview}</p>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No conversations found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
