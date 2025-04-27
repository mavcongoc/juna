"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  Brain,
  Heart,
  Lightbulb,
  Target,
  Users,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Frown,
  Smile,
  BarChart2,
  ArrowUpRight,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

// Define types for our data
type InsightsData = {
  emotionTrends: { emotion: string; count: number }[]
  sentimentTrend: { date: string; score: number }[]
  topThemes: { theme: string; count: number }[]
  entryCount: number
  averageSentiment: number
  timeframe: string
}

type PersonalityProfile = {
  traits: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  attachmentStyle: "anxious" | "avoidant" | "secure" | "disorganized"
  defenseMechanisms: string[]
}

type CognitivePattern = {
  name: string
  description: string
  frequency: number
  impact: "positive" | "negative" | "neutral"
  techniques: {
    name: string
    description: string
  }[]
}

type EmotionalRegulation = {
  style: string
  description: string
  score: number
}

type BehavioralTendency = {
  name: string
  frequency: number
  description: string
  examples: string[]
}

type StressResponse = {
  primaryResponse: "fight" | "flight" | "freeze" | "fawn"
  description: string
  copingMechanisms: string[]
}

type ExistentialTheme = {
  name: string
  frequency: number
  description: string
}

type RelationalPattern = {
  name: string
  description: string
  frequency: number
  examples: string[]
}

type GrowthMarker = {
  area: string
  description: string
  date: string
  progress: number
}

export default function InsightsPage() {
  const { getUserId } = useAuth()
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("month")
  const [activeTab, setActiveTab] = useState("profile")

  // Mock data for psychological profile
  const [personalityProfile] = useState<PersonalityProfile>({
    traits: {
      openness: 72,
      conscientiousness: 65,
      extraversion: 48,
      agreeableness: 78,
      neuroticism: 55,
    },
    attachmentStyle: "secure",
    defenseMechanisms: ["Intellectualization", "Rationalization", "Sublimation"],
  })

  // Mock cognitive patterns data
  const [cognitivePatterns] = useState<CognitivePattern[]>([
    {
      name: "Catastrophizing",
      description: "You sometimes anticipate the worst possible outcomes in uncertain situations.",
      frequency: 40,
      impact: "negative",
      techniques: [
        {
          name: "Probability Assessment",
          description: "Rate the actual likelihood of feared outcomes and identify more probable scenarios.",
        },
        {
          name: "Decatastrophizing",
          description: "Ask yourself: 'What's the worst that could happen? How would I cope if it did?'",
        },
      ],
    },
    {
      name: "Black-and-White Thinking",
      description: "You occasionally view situations in all-or-nothing terms without acknowledging middle ground.",
      frequency: 35,
      impact: "negative",
      techniques: [
        {
          name: "Spectrum Thinking",
          description: "Practice identifying the gray areas and nuances in situations rather than extremes.",
        },
      ],
    },
    {
      name: "Reflective Thinking",
      description: "You show a tendency to deeply analyze situations and consider multiple perspectives.",
      frequency: 85,
      impact: "positive",
      techniques: [
        {
          name: "Structured Reflection",
          description: "Set aside dedicated time for reflection using prompts to guide your thinking process.",
        },
      ],
    },
  ])

  // Mock emotional regulation data
  const [emotionalRegulation] = useState<EmotionalRegulation>({
    style: "Mindful Awareness",
    description:
      "You tend to notice and acknowledge emotions without immediate reactivity, though you sometimes struggle with intense feelings.",
    score: 68,
  })

  // Mock behavioral tendencies
  const [behavioralTendencies] = useState<BehavioralTendency[]>([
    {
      name: "Procrastination",
      frequency: 60,
      description:
        "You tend to delay important tasks, especially when they involve uncertainty or potential criticism.",
      examples: ["Work presentations", "Financial planning", "Difficult conversations"],
    },
    {
      name: "Self-criticism",
      frequency: 75,
      description: "You often hold yourself to high standards and can be harsh when you perceive failure.",
      examples: ["Professional performance", "Social interactions", "Personal goals"],
    },
  ])

  // Mock stress response
  const [stressResponse] = useState<StressResponse>({
    primaryResponse: "freeze",
    description:
      "Under stress, you tend to become immobilized or indecisive, often overthinking rather than taking action.",
    copingMechanisms: ["Overthinking", "Withdrawal", "Information seeking"],
  })

  // Mock existential themes
  const [existentialThemes] = useState<ExistentialTheme[]>([
    {
      name: "Purpose and meaning",
      frequency: 65,
      description: "You frequently reflect on finding deeper purpose in your work and relationships.",
    },
    {
      name: "Identity exploration",
      frequency: 55,
      description: "You're in a process of redefining aspects of your identity and values.",
    },
  ])

  // Mock relational patterns
  const [relationalPatterns] = useState<RelationalPattern[]>([
    {
      name: "Difficulty setting boundaries",
      description: "You sometimes struggle to establish clear boundaries in personal and professional relationships.",
      frequency: 65,
      examples: ["Taking on too many commitments", "Difficulty saying no", "Overextending yourself"],
    },
    {
      name: "Conflict avoidance",
      description: "You tend to avoid direct confrontation even when addressing issues would be beneficial.",
      frequency: 70,
      examples: ["Withholding opinions", "Agreeing to avoid tension", "Internalizing frustrations"],
    },
  ])

  // Mock growth markers
  const [growthMarkers] = useState<GrowthMarker[]>([
    {
      area: "Self-awareness",
      description: "You've shown increased recognition of your emotional patterns and triggers.",
      date: "2023-04-15",
      progress: 75,
    },
    {
      area: "Boundary setting",
      description: "You've begun practicing saying 'no' and establishing healthier limits.",
      date: "2023-05-02",
      progress: 45,
    },
    {
      area: "Emotional regulation",
      description: "You're developing more effective strategies for managing anxiety in social situations.",
      date: "2023-05-10",
      progress: 60,
    },
  ])

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const userId = getUserId()
        const response = await fetch(`/api/insights?userId=${userId}&timeframe=${timeframe}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch insights")
        }

        setInsights(result.data || null)
      } catch (error) {
        console.error("Error fetching insights:", error)
        setError(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [timeframe, getUserId])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
  }

  // Helper function to get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      default:
        return "text-amber-600"
    }
  }

  // Helper function to get impact badge
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
    }
  }

  // Helper function to get attachment style color
  const getAttachmentStyleColor = (style: string) => {
    switch (style) {
      case "secure":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "anxious":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "avoidant":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "disorganized":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Helper function to get stress response color
  const getStressResponseColor = (response: string) => {
    switch (response) {
      case "fight":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "flight":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "freeze":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
      case "fawn":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="!text-xl !font-light text-center bg-gradient-to-r from-purple-600 to-blue-400 bg-clip-text text-transparent">
          Insights
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Discover patterns and gain deeper understanding of yourself
        </p>
      </div>

      <Tabs defaultValue="month" className="mb-6" onValueChange={handleTimeframeChange}>
        <TabsList>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !insights || insights.entryCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No journal entries found for this timeframe.</p>
          <p className="mt-2">Start journaling to see insights and patterns.</p>
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="profile">
                <Brain className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Psychological Profile</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="emotional">
                <Heart className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Emotional & Cognitive</span>
                <span className="sm:hidden">Emotional</span>
              </TabsTrigger>
              <TabsTrigger value="behavioral">
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Behavioral & Relational</span>
                <span className="sm:hidden">Behavioral</span>
              </TabsTrigger>
              <TabsTrigger value="growth">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Growth & Strengths</span>
                <span className="sm:hidden">Growth</span>
              </TabsTrigger>
            </TabsList>

            {/* 1. High-Level Psychological Profile */}
            <TabsContent value="profile">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="mr-2 h-5 w-5" />
                      Personality Traits Summary
                    </CardTitle>
                    <CardDescription>
                      Core personality dimensions and attachment style based on your journal entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Big Five Personality Traits</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Openness to Experience</span>
                              <span className="font-medium">{personalityProfile.traits.openness}%</span>
                            </div>
                            <Progress value={personalityProfile.traits.openness} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              You show high curiosity and appreciation for new ideas and experiences.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Conscientiousness</span>
                              <span className="font-medium">{personalityProfile.traits.conscientiousness}%</span>
                            </div>
                            <Progress value={personalityProfile.traits.conscientiousness} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              You tend to be organized and mindful of details.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Extraversion</span>
                              <span className="font-medium">{personalityProfile.traits.extraversion}%</span>
                            </div>
                            <Progress value={personalityProfile.traits.extraversion} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              You balance social engagement with need for personal space.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Agreeableness</span>
                              <span className="font-medium">{personalityProfile.traits.agreeableness}%</span>
                            </div>
                            <Progress value={personalityProfile.traits.agreeableness} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              You show strong empathy and consideration for others.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Neuroticism</span>
                              <span className="font-medium">{personalityProfile.traits.neuroticism}%</span>
                            </div>
                            <Progress value={personalityProfile.traits.neuroticism} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              You experience moderate emotional reactivity to stressors.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">Attachment Style</h3>
                          <div className="flex items-center mb-2">
                            <Badge className={getAttachmentStyleColor(personalityProfile.attachmentStyle)}>
                              {personalityProfile.attachmentStyle.charAt(0).toUpperCase() +
                                personalityProfile.attachmentStyle.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm">
                            Your writing suggests a predominantly secure attachment style. You generally feel
                            comfortable with closeness and independence in relationships.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-2">Defense Mechanisms</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {personalityProfile.defenseMechanisms.map((mechanism, i) => (
                              <Badge key={i} variant="outline">
                                {mechanism}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm">
                            These are psychological strategies you tend to use to protect yourself from anxiety and
                            maintain self-image.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5" />
                      Dominant Cognitive Patterns
                    </CardTitle>
                    <CardDescription>Recurring thought patterns that shape your internal narrative</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {cognitivePatterns.map((pattern, index) => (
                        <div
                          key={index}
                          className={index < cognitivePatterns.length - 1 ? "pb-6 border-b border-border" : ""}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium flex items-center">
                              {pattern.name}
                              <Badge className={`ml-2 ${getImpactBadge(pattern.impact)}`}>
                                {pattern.impact.charAt(0).toUpperCase() + pattern.impact.slice(1)}
                              </Badge>
                            </h3>
                            <div className="text-sm font-medium">Frequency: {pattern.frequency}%</div>
                          </div>

                          <p className="text-sm mb-4">{pattern.description}</p>

                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div
                              className={`h-full ${pattern.impact === "positive" ? "bg-green-500" : pattern.impact === "negative" ? "bg-red-500" : "bg-amber-500"}`}
                              style={{ width: `${pattern.frequency}%` }}
                            ></div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-medium flex items-center">
                              <Target className="mr-2 h-4 w-4 text-primary" />
                              Recommended Techniques
                            </h4>
                            {pattern.techniques.map((technique, i) => (
                              <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                                <h5 className="text-sm font-medium mb-1">{technique.name}</h5>
                                <p className="text-xs text-muted-foreground">{technique.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="mr-2 h-5 w-5" />
                      Emotional Regulation Style
                    </CardTitle>
                    <CardDescription>How you typically process and manage emotions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Emotional Regulation Capacity</span>
                        <span className="font-medium">{emotionalRegulation.score}%</span>
                      </div>
                      <Progress value={emotionalRegulation.score} className="h-2" />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4 mb-4">
                      <h3 className="text-lg font-medium mb-2">{emotionalRegulation.style}</h3>
                      <p className="text-sm">{emotionalRegulation.description}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        Recommended Techniques
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                        <h5 className="text-sm font-medium mb-1">Emotional Awareness Practice</h5>
                        <p className="text-xs text-muted-foreground">
                          Set aside 5 minutes daily to check in with your emotions. Name them specifically and note
                          where you feel them in your body.
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                        <h5 className="text-sm font-medium mb-1">Emotion Regulation Window</h5>
                        <p className="text-xs text-muted-foreground">
                          Practice identifying when you're moving outside your "window of tolerance" and apply grounding
                          techniques before emotions become overwhelming.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="mr-2 h-5 w-5" />
                      Behavioral Tendencies
                    </CardTitle>
                    <CardDescription>Recurring behavioral patterns identified in your journal entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {behavioralTendencies.map((tendency, index) => (
                        <div
                          key={index}
                          className={index < behavioralTendencies.length - 1 ? "pb-6 border-b border-border" : ""}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">{tendency.name}</h3>
                            <div className="text-sm font-medium">Frequency: {tendency.frequency}%</div>
                          </div>

                          <p className="text-sm mb-4">{tendency.description}</p>

                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-primary" style={{ width: `${tendency.frequency}%` }}></div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Common Examples:</h4>
                            <div className="flex flex-wrap gap-2">
                              {tendency.examples.map((example, i) => (
                                <Badge key={i} variant="outline">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                            <h5 className="text-sm font-medium mb-1">Suggested Technique</h5>
                            <p className="text-xs text-muted-foreground">
                              {tendency.name === "Procrastination"
                                ? "Try the 5-minute rule: commit to working on the task for just 5 minutes, then reassess if you want to continue."
                                : "Practice self-compassion by speaking to yourself as you would to a good friend facing the same situation."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="mr-2 h-5 w-5" />
                      Stress and Coping Response
                    </CardTitle>
                    <CardDescription>
                      Your default reactions under stress and associated coping mechanisms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center mb-3">
                        <h3 className="text-lg font-medium mr-3">Primary Stress Response:</h3>
                        <Badge className={getStressResponseColor(stressResponse.primaryResponse)}>
                          {stressResponse.primaryResponse.charAt(0).toUpperCase() +
                            stressResponse.primaryResponse.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm mb-4">{stressResponse.description}</p>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-2">Common Coping Mechanisms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {stressResponse.copingMechanisms.map((mechanism, i) => (
                          <Badge key={i} variant="outline">
                            {mechanism}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        Recommended Techniques
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                        <h5 className="text-sm font-medium mb-1">Grounding Exercise</h5>
                        <p className="text-xs text-muted-foreground">
                          When feeling frozen or overwhelmed, practice the 5-4-3-2-1 technique: identify 5 things you
                          can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing
                          you can taste.
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                        <h5 className="text-sm font-medium mb-1">Action Steps</h5>
                        <p className="text-xs text-muted-foreground">
                          Break overwhelming tasks into very small, concrete steps. Complete just one tiny step to build
                          momentum.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Existential and Meaning Themes
                    </CardTitle>
                    <CardDescription>
                      Recurring themes related to purpose, identity, and meaning in your life
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {existentialThemes.map((theme, index) => (
                        <div
                          key={index}
                          className={index < existentialThemes.length - 1 ? "pb-6 border-b border-border" : ""}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">{theme.name}</h3>
                            <div className="text-sm font-medium">Frequency: {theme.frequency}%</div>
                          </div>

                          <p className="text-sm mb-4">{theme.description}</p>

                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-secondary" style={{ width: `${theme.frequency}%` }}></div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                            <h5 className="text-sm font-medium mb-1">Reflection Exercise</h5>
                            <p className="text-xs text-muted-foreground">
                              {theme.name === "Purpose and meaning"
                                ? "Try the 'Peak Experiences' exercise: Journal about moments when you felt most alive, engaged, and fulfilled. Look for patterns in these experiences."
                                : "Create a values clarification list by ranking what matters most to you and reflecting on how your current life aligns with these values."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 2. Emotional and Cognitive Insights */}
            <TabsContent value="emotional">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="mr-2 h-5 w-5" />
                      Top Emotions Detected Over Time
                    </CardTitle>
                    <CardDescription>Trends in emotional expression from your journal entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights &&
                        insights.emotionTrends &&
                        insights.emotionTrends.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-24 text-sm">{item.emotion}</div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-secondary"
                                  style={{
                                    width: `${(item.count / insights.entryCount) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="w-10 text-right text-sm">{item.count}</div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium flex items-center mb-3">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        Recommended Techniques
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                          <h5 className="text-sm font-medium mb-1">Emotional Labeling</h5>
                          <p className="text-xs text-muted-foreground">
                            Practice naming your emotions with greater specificity. Instead of "bad," try identifying if
                            you're feeling disappointed, frustrated, or anxious.
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                          <h5 className="text-sm font-medium mb-1">Emotion Tracking</h5>
                          <p className="text-xs text-muted-foreground">
                            Keep a daily log of your emotions and the situations that trigger them to identify patterns.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5" />
                      Cognitive Distortions Frequency
                    </CardTitle>
                    <CardDescription>Patterns of thinking that may be skewing your perception</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {cognitivePatterns
                        .filter((p) => p.impact === "negative")
                        .map((pattern, index) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger>
                              <div className="flex items-center">
                                <span className="mr-2">{pattern.name}</span>
                                <Progress value={pattern.frequency} className="w-24 h-2" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm mb-3">{pattern.description}</p>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                                <h5 className="text-sm font-medium mb-1">{pattern.techniques[0].name}</h5>
                                <p className="text-xs text-muted-foreground">{pattern.techniques[0].description}</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium flex items-center mb-3">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        Thought Reframing Practice
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                        <h5 className="text-sm font-medium mb-1">Three-Column Technique</h5>
                        <p className="text-xs text-muted-foreground">
                          When you notice a negative thought, write it down in the first column. In the second column,
                          identify the cognitive distortion. In the third column, write a more balanced alternative
                          thought.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3">
                          Try Exercise
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5" />
                      Mood Overview
                    </CardTitle>
                    <CardDescription>Your emotional state during this period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Frown className="h-6 w-6 text-red-500" />
                        <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <Smile className="h-6 w-6 text-green-500" />
                      </div>
                      <div
                        className="h-4 w-4 rounded-full bg-primary"
                        style={{
                          marginLeft: `${((insights && insights.averageSentiment + 1) / 2) * 100}%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                      <div className="text-2xl font-bold mt-6">
                        {insights && insights.averageSentiment > 0.3
                          ? "Positive"
                          : insights && insights.averageSentiment > -0.3
                            ? "Neutral"
                            : "Challenging"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Based on {insights && insights.entryCount} journal entries
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium flex items-center mb-3">
                        <Target className="mr-2 h-4 w-4 text-primary" />
                        Mood Regulation Techniques
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                          <h5 className="text-sm font-medium mb-1">Mood Boosting Activity</h5>
                          <p className="text-xs text-muted-foreground">
                            Create a list of activities that reliably improve your mood. When feeling low, choose one
                            activity from your list.
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                          <h5 className="text-sm font-medium mb-1">Gratitude Practice</h5>
                          <p className="text-xs text-muted-foreground">
                            End each day by writing down three specific things you're grateful for, including why they
                            matter to you.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 3. Behavioral and Relational Patterns */}
            <TabsContent value="behavioral">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="mr-2 h-5 w-5" />
                      Key Behavioral Patterns
                    </CardTitle>
                    <CardDescription>Recurring behaviors identified in your journal entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {behavioralTendencies.map((tendency, index) => (
                        <div
                          key={index}
                          className={index < behavioralTendencies.length - 1 ? "pb-6 border-b border-border" : ""}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">{tendency.name}</h3>
                            <div className="text-sm font-medium">Frequency: {tendency.frequency}%</div>
                          </div>

                          <p className="text-sm mb-4">{tendency.description}</p>

                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-primary" style={{ width: `${tendency.frequency}%` }}></div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Common Examples:</h4>
                            <div className="flex flex-wrap gap-2">
                              {tendency.examples.map((example, i) => (
                                <Badge key={i} variant="outline">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                            <h5 className="text-sm font-medium mb-1">Behavior Activation Plan</h5>
                            <p className="text-xs text-muted-foreground">
                              {tendency.name === "Procrastination"
                                ? "Create a structured plan with small, achievable steps and specific deadlines. Share your plan with someone who can provide accountability."
                                : "Practice daily self-affirmations that counter your critical thoughts. Set a reminder to pause and acknowledge your efforts, not just results."}
                            </p>
                            <Button variant="outline" size="sm" className="mt-3">
                              Create Plan
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Relational Health Patterns
                    </CardTitle>
                    <CardDescription>Patterns in how you relate to others</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {relationalPatterns.map((pattern, index) => (
                        <div
                          key={index}
                          className={index < relationalPatterns.length - 1 ? "pb-6 border-b border-border" : ""}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">{pattern.name}</h3>
                            <div className="text-sm font-medium">Frequency: {pattern.frequency}%</div>
                          </div>

                          <p className="text-sm mb-4">{pattern.description}</p>

                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-secondary" style={{ width: `${pattern.frequency}%` }}></div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Common Examples:</h4>
                            <div className="flex flex-wrap gap-2">
                              {pattern.examples.map((example, i) => (
                                <Badge key={i} variant="outline">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                            <h5 className="text-sm font-medium mb-1">
                              {pattern.name === "Difficulty setting boundaries"
                                ? "Boundary Setting Exercise"
                                : "Communication Practice"}
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {pattern.name === "Difficulty setting boundaries"
                                ? "Practice the 'DEAR MAN' technique: Describe the situation, Express feelings, Assert needs, Reinforce positive outcomes, stay Mindful, Appear confident, Negotiate if needed."
                                : "Try the 'Constructive Conflict' approach: Express your perspective using 'I' statements, validate the other person's feelings, and focus on finding mutually acceptable solutions."}
                            </p>
                            <Button variant="outline" size="sm" className="mt-3">
                              Learn More
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 4. Growth Progress and Strengths */}
            <TabsContent value="growth">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ArrowUpRight className="mr-2 h-5 w-5" />
                      Instances of Self-Reflection and Growth
                    </CardTitle>
                    <CardDescription>Tracking your progress and personal development</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {growthMarkers.map((marker, index) => (
                        <div
                          key={index}
                          className={index < growthMarkers.length - 1 ? "pb-6 border-b border-border" : ""}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">{marker.area}</h3>
                            <Badge variant="outline" className="text-xs">
                              {new Date(marker.date).toLocaleDateString()}
                            </Badge>
                          </div>

                          <p className="text-sm mb-4">{marker.description}</p>

                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span className="font-medium">{marker.progress}%</span>
                            </div>
                            <Progress value={marker.progress} className="h-2" />
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 mt-4">
                            <h5 className="text-sm font-medium mb-1">Reinforcement Practice</h5>
                            <p className="text-xs text-muted-foreground">
                              {marker.area === "Self-awareness"
                                ? "Continue your daily emotion check-ins, adding a reflection on what triggered each emotion and how you responded."
                                : marker.area === "Boundary setting"
                                  ? "Practice saying 'no' to one small request this week that you would normally agree to despite not wanting to."
                                  : "When feeling anxious in social situations, try the 4-7-8 breathing technique before applying your new coping strategies."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Resilience Factors
                    </CardTitle>
                    <CardDescription>Your strengths and protective factors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Self-Awareness</h3>
                        <p className="text-sm">
                          You demonstrate strong ability to recognize your emotional states and patterns, which is a
                          fundamental resilience skill.
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Reflective Capacity</h3>
                        <p className="text-sm">
                          Your journal entries show deep reflection and meaning-making, helping you process experiences
                          effectively.
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Growth Mindset</h3>
                        <p className="text-sm">
                          You show willingness to learn from challenges and view setbacks as opportunities for growth.
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Social Connection</h3>
                        <p className="text-sm">
                          You value and maintain meaningful relationships, which provides emotional support during
                          difficult times.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">Resilience-Building Exercise</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Create a "resilience toolkit" by listing specific strategies that have helped you cope with
                        challenges in the past. Include people you can reach out to, activities that calm you, and
                        perspectives that help you reframe difficulties.
                      </p>
                      <Button variant="outline" size="sm">
                        Start Exercise
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Mindset Shifts Over Time
                    </CardTitle>
                    <CardDescription>Positive changes in your thinking patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium">From: Fixed Mindset</h3>
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-sm mb-2">"I'm not good at public speaking. I should avoid it."</p>
                        <h3 className="text-lg font-medium mt-4">To: Growth Mindset</h3>
                        <p className="text-sm">
                          "Public speaking is challenging for me, but I can improve with practice."
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium">From: Self-Criticism</h3>
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-sm mb-2">"I always mess things up. I'm such a failure."</p>
                        <h3 className="text-lg font-medium mt-4">To: Self-Compassion</h3>
                        <p className="text-sm">
                          "I made a mistake, but that's part of being human. I can learn from this."
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">Mindset Reinforcement</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        When you notice yourself slipping into old thought patterns, pause and ask: "What would my
                        growth mindset say about this situation?" Write down both perspectives to strengthen your
                        awareness.
                      </p>
                      <Button variant="outline" size="sm">
                        Try Exercise
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
