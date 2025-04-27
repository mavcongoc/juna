import { z } from "zod"

// Schema for journal analysis response
export const JournalAnalysisSchema = z.object({
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      confidence: z.number().min(0).max(1),
      explanation: z.string(),
    }),
  ),
  sentiment: z.number().min(-1).max(1),
  summary: z.string(),
  cbt_insight: z.string().optional(),
  ifs_insight: z.string().optional(),
})

// Schema for insights response
export const InsightsSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// Schema for chat response
export const ChatResponseSchema = z.object({
  response: z.string(),
})

// Types derived from schemas
export type JournalAnalysis = z.infer<typeof JournalAnalysisSchema>
export type Insights = z.infer<typeof InsightsSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>
