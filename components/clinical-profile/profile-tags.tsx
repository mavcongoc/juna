import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProfileTag } from "@/types/clinical-profile"

interface ProfileTagsProps {
  tags: (ProfileTag & { tag: { name: string; category: string } })[]
}

export function ProfileTags({ tags }: ProfileTagsProps) {
  // Group tags by category
  const tagsByCategory = tags.reduce(
    (acc, tag) => {
      const category = tag.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(tag)
      return acc
    },
    {} as Record<string, typeof tags>,
  )

  // Define the standard categories we want to display
  const standardCategories = [
    "Emotional Regulation",
    "Behavioral Pattern",
    "Cognitive Distortion",
    "Attachment Style",
    "Defense Mechanism",
    "Communication Style",
  ]

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {standardCategories.map((category) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-medium">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {tagsByCategory[category]?.length > 0 ? (
                tagsByCategory[category].map((tag) => (
                  <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                    {tag.tag.name}
                    {tag.confidence < 1 && (
                      <span className="text-xs text-muted-foreground">({Math.round(tag.confidence * 100)}%)</span>
                    )}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No {category.toLowerCase()} tags identified yet</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
