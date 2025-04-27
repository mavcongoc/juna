"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AIInsightsPreviewProps {
  entryId: string
  content: string
  onAnalysisComplete?: (analysis: any) => void
}

export default function AIInsightsPreview({ entryId, content, onAnalysisComplete }: AIInsightsPreviewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const { toast } = useToast()

  const analyzeEntry = async () => {
    if (!content.trim()) {
      toast({
        title: "Cannot analyze",
        description: "Please write some content in your journal entry first.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryId,
          content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze entry")
      }

      setAnalysis(data.analysis)

      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis)
      }

      toast({
        title: "Analysis complete",
        description: "Your journal entry has been analyzed.",
      })
    } catch (error) {
      console.error("Error analyzing entry:", error)
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze entry",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Summary</h4>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
            <div>
              <h4 className="font-medium">Sentiment</h4>
              <div className="flex items-center mt-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${analysis.sentiment > 0 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${Math.abs(analysis.sentiment) * 100}%` }}
                  />
                </div>
                <span className="ml-2 text-xs">
                  {analysis.sentiment > 0 ? "Positive" : analysis.sentiment < 0 ? "Negative" : "Neutral"}
                </span>
              </div>
            </div>
            {analysis.tags && analysis.tags.length > 0 && (
              <div>
                <h4 className="font-medium">Key Themes</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      title={tag.explanation}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Get AI-powered insights about your journal entry</p>
            <Button onClick={analyzeEntry} disabled={isAnalyzing} size="sm">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Entry
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
