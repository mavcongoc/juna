"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TagWithCount, CategoryDistribution, MoodTrend } from "@/types/insights"

interface InsightsVisualizationProps {
  userId: string
}

export function InsightsVisualization({ userId }: InsightsVisualizationProps) {
  const [topTags, setTopTags] = useState<TagWithCount[]>([])
  const [moodTrends, setMoodTrends] = useState<MoodTrend[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/insights?userId=${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch insights data")
        }

        const data = await response.json()
        setTopTags(data.topTags || [])
        setMoodTrends(data.moodTrends || [])
        setCategoryDistribution(data.categoryDistribution || [])
      } catch (error) {
        console.error("Error fetching insights data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchInsightsData()
    }
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading insights...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Journal Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tags">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tags">Top Tags</TabsTrigger>
            <TabsTrigger value="mood">Mood Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="pt-4">
            {topTags.length > 0 ? (
              <div className="space-y-4">
                {topTags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tag.name}</p>
                      <p className="text-sm text-muted-foreground">{tag.description}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-muted rounded-full h-2 mr-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (tag.count / Math.max(...topTags.map((t) => t.count))) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{tag.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Not enough journal entries to generate tag insights yet.
              </p>
            )}
          </TabsContent>

          <TabsContent value="mood" className="pt-4">
            {moodTrends.length > 0 ? (
              <div className="h-64">
                {/* Simple mood visualization */}
                <div className="h-full flex items-end">
                  {moodTrends.map((day, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                      title={`${day.date}: Mood ${day.mood}`}
                    >
                      <div
                        className="w-full bg-primary/80 rounded-t"
                        style={{
                          height: `${(day.mood / 10) * 100}%`,
                          opacity: 0.5 + day.mood / 20,
                        }}
                      ></div>
                      {index % 3 === 0 && (
                        <span className="text-xs mt-1 rotate-90 origin-left translate-y-6">
                          {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Not enough mood data to generate trends yet.</p>
            )}
          </TabsContent>

          <TabsContent value="categories" className="pt-4">
            {categoryDistribution.length > 0 ? (
              <div className="space-y-4">
                {categoryDistribution.map((category) => (
                  <div key={category.category.id} className="space-y-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{category.category.name}</p>
                      <p className="text-sm">{category.percentage.toFixed(1)}%</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${category.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Not enough categorized entries to generate insights yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
