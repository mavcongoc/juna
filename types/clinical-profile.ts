// Clinical Profile Types

export interface ClinicalProfile {
  id: string
  user_id: string
  created_at: string
  last_updated: string
  primary_focus: string[]
  primary_diagnosis: string | null
  secondary_diagnosis: string | null
  dominant_behavioral_traits: string[]
  dominant_cognitive_patterns: string[]
  preferred_therapeutic_techniques: string[]
}

export interface MentalHealthDomain {
  id: string
  profile_id: string
  domain_name: string
  level: "Low" | "Medium" | "High"
  recent_notes: string
  last_updated: string
}

export interface ProfileTag {
  id: string
  profile_id: string
  tag_id: string
  category: string
  confidence: number
}

export interface GrowthMilestone {
  id: string
  profile_id: string
  description: string
  achieved_at: string
  evidence_type: "journal_entry" | "conversation" | "assessment"
  evidence_id: string
}

export interface LinkedEvidence {
  id: string
  profile_id: string
  evidence_type: "journal_entry" | "conversation" | "assessment"
  evidence_id: string
  relevance_note: string
  relevance_score: number
}

export interface ClinicalProfileWithRelations extends ClinicalProfile {
  mental_health_domains: MentalHealthDomain[]
  profile_tags: (ProfileTag & { tag: { name: string; category: string } })[]
  growth_milestones: GrowthMilestone[]
  linked_evidence: LinkedEvidence[]
}

// Domain types
export type EmotionalHealthLevel = "Low" | "Medium" | "High"
export type CognitiveHealthLevel = "Low" | "Medium" | "High"
export type BehavioralHealthLevel = "Low" | "Medium" | "High"
export type RelationalHealthLevel = "Low" | "Medium" | "High"
export type SelfIdentityLevel = "Low" | "Medium" | "High"
export type ResilienceLevel = "Low" | "Medium" | "High"

// Tag categories
export type TagCategory =
  | "Emotional Regulation"
  | "Behavioral Pattern"
  | "Cognitive Distortion"
  | "Attachment Style"
  | "Defense Mechanism"
  | "Communication Style"
