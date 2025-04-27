"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Mic, ChevronUp, ChevronDown, Search, Filter, SortAsc, ChevronLeft, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import VoiceParticleVisualizer3D from "@/components/voice-particle-visualizer-3d"

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
  const [isPaused, setIsPaused] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [simulatedVolume, setSimulatedVolume] = useState(0)
  const [showScrollUp, setShowScrollUp] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const conversationsRef = useRef<HTMLDivElement>(null)
  const responseIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const responseIndexRef = useRef(0)
  const fullResponseRef = useRef("")
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

  // Check scroll position to show/hide scroll arrows
  useEffect(() => {
    const conversationsEl = conversationsRef.current
    if (!conversationsEl) return

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = conversationsEl
      setShowScrollUp(scrollTop > 20)
      setShowScrollDown(scrollTop < scrollHeight - clientHeight - 20)
    }

    checkScroll()
    conversationsEl.addEventListener("scroll", checkScroll)
    return () => conversationsEl.removeEventListener("scroll", checkScroll)
  }, [transcript, aiResponse])

  // Handle scroll arrow clicks
  const scrollUp = () => {
    if (!conversationsRef.current) return
    conversationsRef.current.scrollBy({ top: -200, behavior: "smooth" })
  }

  const scrollDown = () => {
    if (!conversationsRef.current) return
    conversationsRef.current.scrollBy({ top: 200, behavior: "smooth" })
  }

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

  // Simulate volume for AI speaking
  useEffect(() => {
    if (!isAiSpeaking || isPaused) {
      setSimulatedVolume(0)
      return
    }

    const volumeInterval = setInterval(() => {
      // Generate random volume between 20-80 to simulate speech patterns
      setSimulatedVolume(Math.random() * 60 + 20)
    }, 100)

    return () => clearInterval(volumeInterval)
  }, [isAiSpeaking, isPaused])

  // Handle click anywhere to start/stop conversation
  const handleContainerClick = (e: React.MouseEvent) => {
    // Ignore clicks on buttons and other interactive elements
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input") ||
      (e.target as HTMLElement).closest("canvas")
    ) {
      return
    }

    if (isListening) {
      stopListening()
    } else if (isAiSpeaking) {
      togglePause()
    } else {
      startListening()
    }
  }

  const startListening = () => {
    setIsListening(true)
    setTranscript("")
    setIsPaused(false)

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

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const startAiResponse = () => {
    setIsAiSpeaking(true)
    setAiResponse("")
    setIsPaused(false)

    // Store the full response
    fullResponseRef.current =
      "It's completely normal to feel anxious before a presentation. Try some deep breathing exercises before you start, and remember that being prepared is the best way to reduce anxiety. Practice your presentation several times, and consider visualizing a successful outcome. Would you like me to guide you through a quick relaxation technique?"
    responseIndexRef.current = 0

    // Start the response generation
    continueResponse()
  }

  const continueResponse = () => {
    if (responseIntervalRef.current) {
      clearInterval(responseIntervalRef.current)
    }

    responseIntervalRef.current = setInterval(() => {
      if (responseIndexRef.current < fullResponseRef.current.length) {
        if (!isPaused) {
          setAiResponse((prev) => prev + fullResponseRef.current[responseIndexRef.current])
        }
        responseIndexRef.current++
      } else {
        if (responseIntervalRef.current) {
          clearInterval(responseIntervalRef.current)
        }
        setTimeout(() => setIsAiSpeaking(false), 1000)
      }
    }, 30)

    return () => {
      if (responseIntervalRef.current) {
        clearInterval(responseIntervalRef.current)
      }
    }
  }

  // Update response generation when pause state changes
  useEffect(() => {
    if (isAiSpeaking && responseIndexRef.current < fullResponseRef.current.length) {
      if (!isPaused) {
        continueResponse()
      } else if (responseIntervalRef.current) {
        clearInterval(responseIntervalRef.current)
      }
    }
  }, [isPaused, isAiSpeaking])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-background to-muted/30">
      {/* Page title */}
      <div className="mb-6 pt-6 px-6">
        <h1 className="!text-xl !font-light text-center bg-gradient-to-r from-purple-600 to-blue-400 bg-clip-text text-transparent">
          Talk
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Have a conversation with Juna</p>
      </div>

      {/* Main conversation area */}
      <div
        ref={containerRef}
        className="h-[calc(100%-80px)] w-full flex flex-col items-center p-6 relative"
        onClick={handleContainerClick}
      >
        {/* Fixed voice visualization at the top */}
        <div className="sticky top-4 z-10 flex justify-center mb-8">
          {isAiSpeaking ? (
            <div className="relative">
              <VoiceParticleVisualizer3D isActive={!isPaused} simulatedVolume={simulatedVolume} />
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/70 rounded-full p-3">
                    <Pause className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 opacity-0">
              {/* Placeholder to maintain layout */}
            </div>
          )}
        </div>

        {/* Scrollable conversation content with custom scrollbar */}
        <div className="relative w-full max-w-lg flex-1 scroll-container">
          <div ref={conversationsRef} className="h-full w-full overflow-y-auto custom-scrollbar pb-16 px-1">
            {transcript && (
              <div className="mb-6 text-right">
                <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] text-sm">
                  <p>{transcript}</p>
                </div>
              </div>
            )}

            {aiResponse && (
              <div className="mb-6">
                <div className="inline-block bg-muted rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] text-sm">
                  <p>{aiResponse}</p>
                </div>
              </div>
            )}
          </div>

          {/* Subtle scroll arrows */}
          {showScrollUp && (
            <button onClick={scrollUp} className="scroll-arrow scroll-arrow-up" aria-label="Scroll up">
              <ChevronUp className="h-4 w-4" />
            </button>
          )}

          {showScrollDown && (
            <button onClick={scrollDown} className="scroll-arrow scroll-arrow-down" aria-label="Scroll down">
              <ChevronDown className="h-4 w-4" />
            </button>
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

        {/* Pause/Resume button when AI is speaking */}
        {isAiSpeaking && !isListening && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
            onClick={(e) => {
              e.stopPropagation()
              togglePause()
            }}
          >
            {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
          </Button>
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

      {/* History drawer with custom scrollbar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-lg transform transition-transform duration-300 ease-in-out ${
          showHistory ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Add a visible handle/pill for better UX */}
        <div
          className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mt-2 cursor-pointer"
          onClick={() => setShowHistory(false)}
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-light">Conversation History</h3>
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowHistory(false)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
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
