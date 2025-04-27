"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { BookOpen, Clock, BarChart } from "lucide-react"

type UserStats = {
  totalEntries: number
  averageSentiment: number
  streakDays: number
  lastEntryDate: string | null
}

export default function UserStats() {
  const { getUserId } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setIsLoading(true)
        const userId = getUserId()

        // In a real app, this would be an API call to fetch user stats
        // For now, we'll simulate a response
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Simulated stats
        setStats({
          totalEntries: 12,
          averageSentiment: 0.65,
          streakDays: 3,
          lastEntryDate: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Error fetching user stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStats()
  }, [getUserId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  // Helper function to get sentiment description
  const getSentimentDescription = (score: number) => {
    if (score >= 0.5) return "Very Positive"
    if (score >= 0.1) return "Positive"
    if (score > -0.1) return "Neutral"
    if (score > -0.5) return "Negative"
    return "Very Negative"
  }

  // Helper function to get sentiment color
  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return "text-green-600"
    if (score >= 0.1) return "text-green-500"
    if (score > -0.1) return "text-gray-500"
    if (score > -0.5) return "text-red-500"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div>No stats available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <BookOpen className="mr-2 h-4 w-4" /> Total Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEntries}</div>
          <p className="text-xs text-muted-foreground mt-1">Last entry: {formatDate(stats.lastEntryDate)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <BarChart className="mr-2 h-4 w-4" /> Average Mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getSentimentColor(stats.averageSentiment)}`}>
            {getSentimentDescription(stats.averageSentiment)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on all your entries</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Clock className="mr-2 h-4 w-4" /> Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streakDays} days</div>
          <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
        </CardContent>
      </Card>
    </div>
  )
}
