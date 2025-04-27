import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MentalHealthDomain } from "@/types/clinical-profile"

interface MentalHealthDomainsProps {
  domains: MentalHealthDomain[]
}

export function MentalHealthDomains({ domains }: MentalHealthDomainsProps) {
  // Group domains by name
  const domainsByName = domains.reduce(
    (acc, domain) => {
      if (!acc[domain.domain_name]) {
        acc[domain.domain_name] = []
      }
      acc[domain.domain_name].push(domain)
      return acc
    },
    {} as Record<string, MentalHealthDomain[]>,
  )

  // Get the most recent domain for each name
  const latestDomains = Object.entries(domainsByName).map(([name, domainList]) => {
    return domainList.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())[0]
  })

  // Define the standard domains we want to display
  const standardDomains = [
    "Emotional Health",
    "Cognitive Health",
    "Behavioral Health",
    "Relational Health",
    "Self-Identity",
    "Resilience & Coping",
  ]

  // Ensure we have all standard domains
  const displayDomains = [...latestDomains]

  standardDomains.forEach((domainName) => {
    if (!displayDomains.some((d) => d.domain_name === domainName)) {
      displayDomains.push({
        id: `placeholder-${domainName}`,
        profile_id: "",
        domain_name: domainName,
        level: "Medium",
        recent_notes: "No data available yet",
        last_updated: new Date().toISOString(),
      })
    }
  })

  // Sort domains to match the standard order
  displayDomains.sort((a, b) => {
    const aIndex = standardDomains.indexOf(a.domain_name)
    const bIndex = standardDomains.indexOf(b.domain_name)
    return aIndex - bIndex
  })

  // Convert level to progress value
  const getLevelProgress = (level: string): number => {
    switch (level) {
      case "Low":
        return 33
      case "Medium":
        return 66
      case "High":
        return 100
      default:
        return 50
    }
  }

  // Get color based on domain and level
  const getDomainColor = (domain: string, level: string): string => {
    // For domains where high is good (Resilience, Self-Identity)
    if (domain === "Resilience & Coping" || domain === "Self-Identity") {
      switch (level) {
        case "Low":
          return "bg-red-500"
        case "Medium":
          return "bg-yellow-500"
        case "High":
          return "bg-green-500"
        default:
          return "bg-blue-500"
      }
    }
    // For domains where low is good (challenges/issues are low)
    else {
      switch (level) {
        case "Low":
          return "bg-green-500"
        case "Medium":
          return "bg-yellow-500"
        case "High":
          return "bg-red-500"
        default:
          return "bg-blue-500"
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {displayDomains.map((domain) => (
          <div key={domain.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{domain.domain_name}</h3>
              <span className="text-xs font-medium text-muted-foreground">{domain.level}</span>
            </div>
            <Progress
              value={getLevelProgress(domain.level)}
              className={`h-2 ${getDomainColor(domain.domain_name, domain.level)}`}
            />
            <p className="text-xs text-muted-foreground">{domain.recent_notes}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
