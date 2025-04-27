import type { Tag, TagWithCount, Category } from "./tags"

export interface InsightData {
  topTags: TagWithCount[]
  moodTrends: MoodTrend[]
  categoryDistribution: CategoryDistribution[]
  recommendations: Recommendation[]
}

export interface MoodTrend {
  date: string
  mood: number
}

export interface CategoryDistribution {
  category: Category
  count: number
  percentage: number
}

export interface Recommendation {
  id: string
  title: string
  description: string
  relatedTags: Tag[]
  techniqueId?: string
}
