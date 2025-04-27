import OpenAI from "openai"

// Create a singleton instance of the OpenAI client
let openaiClient: OpenAI | null = null

export const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // This is a server-side only client, so we don't need dangerouslyAllowBrowser
    })
  }
  return openaiClient
}

// Alias for backward compatibility
export const getOpenAI = getOpenAIClient

// Define the structure of our AI analysis response
export interface AIAnalysis {
  summary: string
  categories: string[]
  emotions: string[]
  themes: string[]
  techniques: {
    cbt: string
    ifs: string
  }
  sentiment_score: number
}

// Function to analyze journal entries with OpenAI
export async function analyzeJournalEntry(content: string): Promise<AIAnalysis> {
  const openai = getOpenAIClient()

  const systemPrompt = `
    You are an AI assistant specialized in mental health and journaling analysis.
    Analyze the journal entry and provide the following in JSON format:
    1. A concise summary (max 2 sentences)
    2. 1-3 categories the entry falls into (e.g., Work, Relationships, Health, Personal Growth)
    3. 1-3 emotions expressed in the entry
    4. 1-3 themes or patterns present in the entry
    5. Therapeutic insights using:
       - Cognitive Behavioral Therapy (CBT) perspective (1-2 sentences)
       - Internal Family Systems (IFS) perspective (1-2 sentences)
    6. A sentiment score between -1 (very negative) and 1 (very positive)
    
    Your response should be valid JSON with the following structure:
    {
      "summary": "string",
      "categories": ["string"],
      "emotions": ["string"],
      "themes": ["string"],
      "techniques": {
        "cbt": "string",
        "ifs": "string"
      },
      "sentiment_score": number
    }
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Journal entry: ${content}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })

    const result = JSON.parse(response.choices[0].message.content || "{}")

    // Ensure we have all the expected fields with defaults if missing
    return {
      summary: result.summary || "No summary available",
      categories: result.categories || ["General"],
      emotions: result.emotions || ["Neutral"],
      themes: result.themes || ["Daily reflection"],
      techniques: {
        cbt: result.techniques?.cbt || "Consider how your thoughts influence your feelings and behaviors.",
        ifs: result.techniques?.ifs || "Notice if different parts of yourself have different feelings or needs.",
      },
      sentiment_score: result.sentiment_score || 0,
    }
  } catch (error) {
    console.error("Error analyzing journal entry with OpenAI:", error)

    // Return fallback analysis if OpenAI call fails
    return {
      summary: "Unable to generate summary.",
      categories: ["General"],
      emotions: ["Neutral"],
      themes: ["Daily reflection"],
      techniques: {
        cbt: "Consider how your thoughts influence your feelings and behaviors.",
        ifs: "Notice if different parts of yourself have different feelings or needs.",
      },
      sentiment_score: 0,
    }
  }
}
