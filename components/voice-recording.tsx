"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Send, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

export default function VoiceRecording() {
  const router = useRouter()
  const { getUserId } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // References for Web Speech API
  const recognitionRef = useRef<any>(null)
  const isSpeechRecognitionSupported =
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    // Initialize speech recognition
    if (isSpeechRecognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        setTranscript((prevTranscript) => prevTranscript + finalTranscript + " " + interimTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setError(`Speech recognition error: ${event.error}`)
        stopRecording()
      }
    }

    // Clean up timer and recognition on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = () => {
    if (!isSpeechRecognitionSupported) {
      setError("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.")
      return
    }

    setIsRecording(true)
    setRecordingTime(0)
    setTranscript("")
    setError(null)

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)

    // Start speech recognition
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error("Error starting speech recognition:", e)
      setError("Could not start speech recognition. Please try again.")
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const stopRecording = () => {
    setIsRecording(false)

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error("Error stopping speech recognition:", e)
      }
    }
  }

  const saveEntry = async () => {
    if (!transcript.trim()) return

    setIsProcessing(true)

    try {
      const userId = getUserId()

      // Call the API to save the entry
      const response = await fetch("/api/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: transcript,
          type: "voice",
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
      }
    } catch (error) {
      console.error("Error saving entry:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center py-8">
        {isRecording ? (
          <>
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 animate-pulse">
              <Mic className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-2xl font-medium mb-2">{formatTime(recordingTime)}</p>
            <p className="text-sm text-muted-foreground mb-6">Recording...</p>
            <Button
              variant="outline"
              size="lg"
              onClick={stopRecording}
              className="rounded-full px-6 border-red-200 text-red-500 hover:bg-red-50"
            >
              <Square className="mr-2 h-4 w-4" /> Stop Recording
            </Button>

            {transcript && (
              <div className="w-full mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Transcribing in real-time:</p>
                <p className="italic">{transcript}</p>
              </div>
            )}
          </>
        ) : transcript ? (
          <div className="w-full">
            <h3 className="text-lg font-medium mb-4">Your Transcribed Entry</h3>
            <div className="bg-muted p-4 rounded-lg mb-6 min-h-[200px]">
              <p className="whitespace-pre-wrap">{transcript}</p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={saveEntry}
                disabled={isProcessing}
                className="rounded-full px-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Save Entry
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
              <Mic className="h-10 w-10 text-primary" />
              <div className="absolute inset-0 bg-primary blur-sm opacity-20 rounded-full animate-pulse-gentle"></div>
            </div>
            <h3 className="text-xl font-medium mb-2">Speak Your Mind</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Record your thoughts and feelings. Your voice will be transcribed into text for your journal.
            </p>
            <Button
              variant="default"
              size="lg"
              onClick={startRecording}
              className="rounded-full px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Mic className="mr-2 h-4 w-4" /> Start Recording
            </Button>

            {!isSpeechRecognitionSupported && (
              <Alert variant="warning" className="mt-6 rounded-lg">
                <AlertDescription>
                  Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      {isProcessing && !isRecording && !transcript && (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6 rounded-lg">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
