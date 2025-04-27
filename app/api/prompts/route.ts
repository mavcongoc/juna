import { NextResponse } from "next/server"

// Explicitly set the runtime to nodejs
export const runtime = "edge"

// Define a set of pre-defined prompts by category
const predefinedPrompts: Record<string, string[]> = {
  general: [
    "What are you grateful for today?",
    "Describe a challenge you're facing and how you might overcome it.",
    "Reflect on a moment that brought you joy recently.",
    "What's something you learned about yourself this week?",
    "Write about a goal you're working towards and why it matters to you.",
  ],
  relationships: [
    "Describe a relationship that has significantly impacted your life.",
    "What qualities do you value most in your close relationships?",
    "Write about a conversation you wish you could have with someone.",
    "How have your relationships changed over the past year?",
    "Reflect on a time when you felt deeply connected to someone else.",
  ],
  career: [
    "What aspects of your work bring you the most satisfaction?",
    "Describe your ideal work environment and why it appeals to you.",
    "What skills would you like to develop in your professional life?",
    "Reflect on a professional challenge and what you learned from it.",
    "How does your work align with your personal values?",
  ],
  health: [
    "How have you been taking care of your physical health lately?",
    "Describe your relationship with rest and relaxation.",
    "What activities make you feel most energized?",
    "Write about a habit you'd like to change related to your wellbeing.",
    "How does your mental state affect your physical health?",
  ],
  creativity: [
    "What creative pursuits bring you joy?",
    "Describe a project you'd like to start or complete.",
    "How do you express yourself creatively in everyday life?",
    "Write about a time when you felt particularly inspired.",
    "What obstacles get in the way of your creative expression?",
  ],
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get("category") || "general"
    const count = Number.parseInt(url.searchParams.get("count") || "3", 10)

    // Get prompts for the requested category, or fall back to general
    const availablePrompts = predefinedPrompts[category] || predefinedPrompts.general

    // Randomly select the requested number of prompts
    const selectedPrompts: string[] = []
    const maxPrompts = Math.min(count, availablePrompts.length)

    // Create a copy of the available prompts to avoid modifying the original array
    const promptsCopy = [...availablePrompts]

    for (let i = 0; i < maxPrompts; i++) {
      const randomIndex = Math.floor(Math.random() * promptsCopy.length)
      selectedPrompts.push(promptsCopy[randomIndex])
      promptsCopy.splice(randomIndex, 1) // Remove the selected prompt to avoid duplicates
    }

    return NextResponse.json({
      success: true,
      category,
      prompts: selectedPrompts,
    })
  } catch (error) {
    console.error("Error generating prompts:", error)

    // Return fallback prompts
    return NextResponse.json({
      success: false,
      error: "Failed to generate prompts",
      category: "general",
      prompts: [
        "What are you grateful for today?",
        "Describe a challenge you're facing and how you might overcome it.",
        "Reflect on a moment that brought you joy recently.",
      ],
    })
  }
}
