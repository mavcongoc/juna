"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

interface PromptMetric {
  id: string
  prompt_id: string
  date: string
  usage_count: number
  avg_response_time: number
  avg_tokens_used: number
  avg_user_rating: number | null
}

interface PromptMetricsDashboardProps {
  promptId: string
}

export default function PromptMetricsDashboard({ promptId }: PromptMetricsDashboardProps) {
  // Initialize metrics as an empty array to avoid undefined errors
  const [metrics, setMetrics] = useState<PromptMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/prompts/${promptId}/metrics?timeRange=${timeRange}`)

        if (!response.ok) {
          throw new Error("Failed to fetch metrics")
        }

        const data = await response.json()

        // Ensure metrics is always an array
        if (data && Array.isArray(data.metrics)) {
          setMetrics(data.metrics)
        } else if (data && Array.isArray(data)) {
          setMetrics(data)
        } else {
          // If data is not in expected format, set empty array
          console.warn("Metrics data is not in expected format:", data)
          setMetrics([])
        }
      } catch (err) {
        console.error("Error fetching metrics:", err)
        setError("Failed to load metrics. Please try again.")
        // Ensure metrics is reset to empty array on error
        setMetrics([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [promptId, timeRange])

  // Safely calculate summary statistics with null checks
  const calculateSummaryStats = () => {
    if (!metrics || metrics.length === 0) {
      return {
        totalUsage: 0,
        avgResponseTime: 0,
        avgTokens: 0,
      }
    }

    const totalUsage = metrics.reduce((sum, metric) => sum + (metric.usage_count || 0), 0)

    const validResponseTimes = metrics.filter((m) => typeof m.avg_response_time === "number")
    const avgResponseTime =
      validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, metric) => sum + metric.avg_response_time, 0) / validResponseTimes.length
        : 0

    const validTokens = metrics.filter((m) => typeof m.avg_tokens_used === "number")
    const avgTokens =
      validTokens.length > 0
        ? validTokens.reduce((sum, metric) => sum + metric.avg_tokens_used, 0) / validTokens.length
        : 0

    return { totalUsage, avgResponseTime, avgTokens }
  }

  const { totalUsage, avgResponseTime, avgTokens } = calculateSummaryStats()

  // Format data for charts with safety checks
  const formatChartData = () => {
    if (!metrics || metrics.length === 0) return []

    return metrics.map((metric) => ({
      date: format(new Date(metric.date), "MMM dd"),
      usage: metric.usage_count || 0,
      responseTime: metric.avg_response_time || 0,
      tokens: metric.avg_tokens_used || 0,
    }))
  }

  const chartData = formatChartData()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  // If no metrics data available
  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Metrics Available</CardTitle>
          <CardDescription>This prompt hasn't been used enough to generate metrics yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Metrics will appear here once the prompt has been used in the application.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsage}</div>
              <p className="text-xs text-muted-foreground">times used</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgResponseTime.toFixed(2)}s</div>
              <p className="text-xs text-muted-foreground">seconds</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgTokens)}</div>
              <p className="text-xs text-muted-foreground">tokens per request</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="usage" className="w-full">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
              <CardDescription>Number of times this prompt was used each day</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {chartData.length > 0 ? (
                <ChartContainer
                  config={{
                    usage: {
                      label: "Usage Count",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="usage"
                        stroke="var(--color-usage)"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                  No usage data available for the selected time period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Response time and token usage over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {chartData.length > 0 ? (
                <ChartContainer
                  config={{
                    responseTime: {
                      label: "Response Time (s)",
                      color: "hsl(var(--chart-1))",
                    },
                    tokens: {
                      label: "Tokens Used",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="responseTime"
                        stroke="var(--color-responseTime)"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="tokens"
                        stroke="var(--color-tokens)"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                  No performance data available for the selected time period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
