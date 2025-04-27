"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ClinicalProfileWithRelations } from "@/types/clinical-profile"
import { MentalHealthDomains } from "./mental-health-domains"
import { ProfileTimeline } from "./profile-timeline"
import { ProfileTags } from "./profile-tags"

interface ProfileOverviewProps {
  userId: string
}

export function ProfileOverview({ userId }: ProfileOverviewProps) {
  const [profile, setProfile] = useState<ClinicalProfileWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/clinical-profile")

        if (!response.ok) {
          throw new Error("Failed to fetch clinical profile")
        }

        const data = await response.json()
        setProfile(data.profile)
      } catch (err) {
        setError("Error loading clinical profile")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading clinical profile...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">{error || "No clinical profile available"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="!text-xl !font-light">Clinical Profile</CardTitle>
          <CardDescription>Comprehensive overview of your mental health profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Focus</h3>
              <div className="flex flex-wrap gap-2">
                {profile.primary_focus.length > 0 ? (
                  profile.primary_focus.map((focus, index) => (
                    <Badge key={index} variant="outline">
                      {focus}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No primary focus areas identified yet</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Diagnosis</h3>
                <p className="text-sm">{profile.primary_diagnosis || "No primary diagnosis identified yet"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Secondary Diagnosis</h3>
                <p className="text-sm">{profile.secondary_diagnosis || "No secondary diagnosis identified yet"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Dominant Behavioral Traits</h3>
              <div className="flex flex-wrap gap-2">
                {profile.dominant_behavioral_traits.length > 0 ? (
                  profile.dominant_behavioral_traits.map((trait, index) => (
                    <Badge key={index} variant="secondary">
                      {trait}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No dominant behavioral traits identified yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Dominant Cognitive Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {profile.dominant_cognitive_patterns.length > 0 ? (
                  profile.dominant_cognitive_patterns.map((pattern, index) => (
                    <Badge key={index} variant="secondary">
                      {pattern}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No dominant cognitive patterns identified yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Preferred Therapeutic Techniques</h3>
              <div className="flex flex-wrap gap-2">
                {profile.preferred_therapeutic_techniques.length > 0 ? (
                  profile.preferred_therapeutic_techniques.map((technique, index) => (
                    <Badge key={index} variant="outline">
                      {technique}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No preferred therapeutic techniques identified yet</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="domains">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="domains">Health Domains</TabsTrigger>
          <TabsTrigger value="tags">Profile Tags</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="domains">
          <MentalHealthDomains domains={profile.mental_health_domains} />
        </TabsContent>

        <TabsContent value="tags">
          <ProfileTags tags={profile.profile_tags} />
        </TabsContent>

        <TabsContent value="timeline">
          <ProfileTimeline milestones={profile.growth_milestones} evidence={profile.linked_evidence} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
