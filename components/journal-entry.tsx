"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Send, Mic, PauseCircle } from "lucide-react"

export default function JournalEntry() {
  const [entry, setEntry] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [insights, setInsights] = useState<null | {
    categories: string[]
    themes: string[]
    techniques: {
      cbt: string
      ifs: string
    }
  }>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEntryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEntry(e.target.value)
  }

  const handleSubmit = async () => {
    if (!entry.trim()) return

    setIsLoading(true)

    // Simulate AI processing
    setTimeout(() => {
      // This would be replaced with actual AI processing
      setInsights({
        categories: ["Reflection", "Growth", "Relationships"],
        themes: ["Self-doubt", "Progress recognition", "Boundary setting"],
        techniques: {
          cbt: "Your thoughts about not being 'good enough' are cognitive distortions. Consider the evidence that contradicts these thoughts, such as the progress you've made this month.",
          ifs: "The part of you that feels inadequate is trying to protect you from disappointment. Try dialoguing with this part to understand its concerns and reassure it.",
        },
      })
      setIsLoading(false)
    }, 1500)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Voice recording functionality would be implemented here
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Journal Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind today? How are you feeling?"
            className="min-h-[200px] resize-none"
            value={entry}
            onChange={handleEntryChange}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="icon" onClick={toggleRecording} className={isRecording ? "text-red-500" : ""}>
            {isRecording ? <PauseCircle /> : <Mic />}
          </Button>
          <Button onClick={handleSubmit} disabled={!entry.trim() || isLoading}>
            {isLoading ? "Processing..." : "Submit"} {!isLoading && <Send className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {insights.categories.map((category, i) => (
                  <Badge key={i} variant="outline">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Emotional Themes</h3>
              <div className="flex flex-wrap gap-2">
                {insights.themes.map((theme, i) => (
                  <Badge key={i} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            <Tabs defaultValue="cbt">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cbt">CBT Perspective</TabsTrigger>
                <TabsTrigger value="ifs">IFS Perspective</TabsTrigger>
              </TabsList>
              <TabsContent value="cbt" className="p-4 bg-slate-50 rounded-md mt-2">
                {insights.techniques.cbt}
              </TabsContent>
              <TabsContent value="ifs" className="p-4 bg-slate-50 rounded-md mt-2">
                {insights.techniques.ifs}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
