import { createClient } from "./supabase-client"
import type { TagWithCount, CategoryDistribution, MoodTrend, Recommendation } from "@/types/insights"
import type { Tag } from "@/types/tags"

export async function getTopTags(userId: string, limit = 10): Promise<TagWithCount[]> {
  const supabase = createClient()

  // Get top tags for a user based on frequency
  const { data, error } = await supabase.rpc("get_top_tags_for_user", {
    user_id_param: userId,
    limit_param: limit,
  })

  if (error) {
    console.error("Error fetching top tags:", error)
    return []
  }

  return data || []
}

export async function getMoodTrends(userId: string, days = 30): Promise<MoodTrend[]> {
  const supabase = createClient()

  // Get mood trends for a user over time
  const { data, error } = await supabase
    .from("journal_entries")
    .select("created_at, mood")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at")

  if (error) {
    console.error("Error fetching mood trends:", error)
    return []
  }

  return (data || []).map((entry) => ({
    date: entry.created_at.split("T")[0],
    mood: entry.mood || 0,
  }))
}

export async function getCategoryDistribution(userId: string): Promise<CategoryDistribution[]> {
  const supabase = createClient()

  // Get category distribution for a user
  const { data, error } = await supabase.rpc("get_category_distribution_for_user", {
    user_id_param: userId,
  })

  if (error) {
    console.error("Error fetching category distribution:", error)
    return []
  }

  return data || []
}

export async function generateRecommendations(userId: string, topTags: TagWithCount[]): Promise<Recommendation[]> {
  // This would ideally call an AI service to generate personalized recommendations
  // For now, we'll return some static recommendations based on top tags

  const recommendations: Recommendation[] = []

  // Example recommendation generation logic
  for (const tag of topTags.slice(0, 3)) {
    recommendations.push({
      id: `rec-${tag.id}`,
      title: `Work on your ${tag.name}`,
      description: `We've noticed patterns related to ${tag.name}. Consider exploring techniques to address this.`,
      relatedTags: [tag as Tag],
    })
  }

  return recommendations
}
