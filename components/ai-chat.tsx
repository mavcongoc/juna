"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface AIChatProps {
  userId: string
}

export default function AIChat({ userId }: AIChatProps) {
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([])

  // useChat hook and other logic omitted for brevity...

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-4 h-[400px] overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Welcome to Juna Chat!</p>
                <p className="text-sm mt-2">Ask me anything about your journal entries or how you're feeling today.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form omitted for brevity... */}
        </div>
      </CardContent>
    </Card>
  )
}
