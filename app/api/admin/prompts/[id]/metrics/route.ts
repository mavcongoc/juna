import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"
import { cookies } from "next/headers"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Get the prompt ID from the URL params
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 })
    }

    // Get the time range from query params
    const url = new URL(req.url)
    const timeRange = url.searchParams.get("timeRange") || "30d"

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Check if admin is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Calculate the date range based on the timeRange parameter
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 30) // Default to 30 days
    }

    // Format dates for SQL query
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = now.toISOString().split("T")[0]

    // Query the database for metrics
    const { data: metricsData, error } = await supabase
      .from("prompt_metrics")
      .select("*")
      .eq("prompt_id", id)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching prompt metrics:", error)
      return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
    }

    // If no metrics data, return empty array
    if (!metricsData || metricsData.length === 0) {
      return NextResponse.json({ metrics: [] })
    }

    // Process the metrics data to group by date
    const processedMetrics = metricsData.map((metric) => ({
      id: metric.id,
      prompt_id: metric.prompt_id,
      date: new Date(metric.created_at).toISOString().split("T")[0],
      usage_count: metric.usage_count || 0,
      avg_response_time: metric.response_time || 0,
      avg_tokens_used: metric.tokens_used || 0,
      avg_user_rating: metric.user_rating || null,
    }))

    return NextResponse.json({ metrics: processedMetrics })
  } catch (error) {
    console.error("Error in metrics API:", error)
    return NextResponse.json({ error: "Internal server error", metrics: [] }, { status: 500 })
  }
}
