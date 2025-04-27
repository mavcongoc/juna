"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Recommendation } from "@/types/insights"

interface InsightsRecommendationsProps {
  userId: string
}

export function InsightsRecommendations({ userId }: InsightsRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/insights?userId=${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch insights data")
        }

        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchRecommendations()
    }
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No personalized recommendations available at this time.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="border-l-2 border-primary pl-4">
              <h3 className="font-medium">{recommendation.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
              {recommendation.actionItems && recommendation.actionItems.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Action Items</h4>
                  <ul className="mt-1 space-y-1">
                    {recommendation.actionItems.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
