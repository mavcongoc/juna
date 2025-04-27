import { Card, CardContent } from "@/components/ui/card"
import type { GrowthMilestone, LinkedEvidence } from "@/types/clinical-profile"
import { formatDistanceToNow } from "date-fns"

interface ProfileTimelineProps {
  milestones: GrowthMilestone[]
  evidence: LinkedEvidence[]
}

export function ProfileTimeline({ milestones, evidence }: ProfileTimelineProps) {
  // Combine milestones and evidence into a single timeline
  const timelineItems = [
    ...milestones.map((milestone) => ({
      type: "milestone" as const,
      date: new Date(milestone.achieved_at),
      data: milestone,
    })),
    ...evidence.map((item) => ({
      type: "evidence" as const,
      date: new Date(), // We don't have a date for evidence, so use current date
      data: item,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <Card>
      <CardContent className="pt-6">
        {timelineItems.length > 0 ? (
          <div className="space-y-6">
            {timelineItems.map((item, index) => (
              <div key={index} className="relative pl-6 pb-6 border-l border-muted">
                <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary"></div>

                {item.type === "milestone" ? (
                  <div>
                    <h3 className="text-sm font-medium">{item.data.description}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.date, { addSuffix: true })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium">
                      {item.data.evidence_type === "journal_entry"
                        ? "Journal Entry"
                        : item.data.evidence_type === "conversation"
                          ? "Conversation"
                          : "Assessment"}
                    </h3>
                    <p className="text-xs">{item.data.relevance_note}</p>
                    <p className="text-xs text-muted-foreground">
                      Relevance: {Math.round(item.data.relevance_score * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No timeline data available yet</p>
        )}
      </CardContent>
    </Card>
  )
}
