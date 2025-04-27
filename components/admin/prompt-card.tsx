"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import type { Prompt, PromptUsage } from "@/lib/admin/types"
import { Thermometer, Cpu } from "lucide-react"

interface PromptCardProps {
  prompt: Prompt
  usage: PromptUsage[]
}

// Map of known prompt names to their actual usage locations
const PROMPT_USAGE_MAP: Record<string, { location: string; path: string; model: string }> = {
  journalAnalysis: {
    location: "Journal Entry Analysis",
    path: "/app/api/analyze-entry/route.ts",
    model: "gpt-4o",
  },
  conversationalChat: {
    location: "AI Chat Conversations",
    path: "/app/api/chat/route.ts",
    model: "gpt-4o",
  },
  insightsSummary: {
    location: "Journal Insights Generator",
    path: "/app/api/insights/route.ts",
    model: "gpt-4o",
  },
}

// Export as both default and named export for backward compatibility
export function PromptCard({ prompt, usage = [] }: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Ensure prompt is valid
  if (!prompt) {
    return null
  }

  // Get actual usage information based on prompt name
  const actualUsage = prompt.name ? PROMPT_USAGE_MAP[prompt.name] : undefined

  // Safely format the date
  const formattedDate = prompt.updated_at
    ? formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })
    : "recently"

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{prompt.name || "Unnamed Prompt"}</CardTitle>
          <Badge variant={prompt.is_active ? "default" : "outline"}>{prompt.is_active ? "Active" : "Inactive"}</Badge>
        </div>
        <CardDescription className="line-clamp-2">{prompt.description || "No description provided"}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 pt-0">
        {/* Key Parameters */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Cpu className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Model:</span> {actualUsage?.model || "gpt-4o"}
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <span className="font-medium">Temp:</span> {prompt.temperature || "N/A"}
          </div>
        </div>

        {/* Usage Information */}
        <div>
          <h4 className="text-sm font-medium mb-1">Used In</h4>
          <div className="bg-muted p-2 rounded-md text-sm">
            {actualUsage ? (
              <div>
                <span className="font-medium">{actualUsage.location}</span>
              </div>
            ) : Array.isArray(usage) && usage.length > 0 ? (
              <div>{usage[0].location}</div>
            ) : (
              <div className="text-muted-foreground">Not currently used</div>
            )}
          </div>
        </div>

        {/* Prompt Content */}
        <div>
          <h4 className="text-sm font-medium mb-1">System Prompt</h4>
          <div className="bg-muted p-2 rounded-md text-sm">
            {isExpanded ? (
              <pre className="whitespace-pre-wrap text-xs">{prompt.system_prompt || "No system prompt"}</pre>
            ) : (
              <>
                <pre className="whitespace-pre-wrap line-clamp-3 text-xs">
                  {prompt.system_prompt || "No system prompt"}
                </pre>
                {prompt.system_prompt && prompt.system_prompt.length > 100 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto mt-1 text-xs"
                    onClick={() => setIsExpanded(true)}
                  >
                    Show more
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        <div className="text-xs text-muted-foreground">Updated {formattedDate}</div>
        <Link href={`/admin/prompts/${prompt.id}`}>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// Default export for convenience
export default PromptCard
