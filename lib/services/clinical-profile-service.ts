import { getServiceClient } from "@/lib/supabase-client"
import type {
  ClinicalProfile,
  ClinicalProfileWithRelations,
  GrowthMilestone,
  LinkedEvidence,
  MentalHealthDomain,
  ProfileTag,
} from "@/types/clinical-profile"

/**
 * Service for managing clinical profiles
 */
export class ClinicalProfileService {
  /**
   * Get a user's clinical profile with all related data
   */
  static async getProfileWithRelations(userId: string): Promise<ClinicalProfileWithRelations | null> {
    const supabase = getServiceClient()

    // Get the base profile
    const { data: profile, error } = await supabase.from("clinical_profiles").select("*").eq("user_id", userId).single()

    if (error || !profile) {
      console.error("Error fetching clinical profile:", error)
      return null
    }

    // Get mental health domains
    const { data: domains, error: domainsError } = await supabase
      .from("mental_health_domains")
      .select("*")
      .eq("profile_id", profile.id)

    if (domainsError) {
      console.error("Error fetching mental health domains:", domainsError)
      return null
    }

    // Get profile tags with tag information
    const { data: tags, error: tagsError } = await supabase
      .from("profile_tags")
      .select(`
        *,
        tag:tags(*)
      `)
      .eq("profile_id", profile.id)

    if (tagsError) {
      console.error("Error fetching profile tags:", tagsError)
      return null
    }

    // Get growth milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("growth_milestones")
      .select("*")
      .eq("profile_id", profile.id)
      .order("achieved_at", { ascending: false })

    if (milestonesError) {
      console.error("Error fetching growth milestones:", milestonesError)
      return null
    }

    // Get linked evidence
    const { data: evidence, error: evidenceError } = await supabase
      .from("linked_evidence")
      .select("*")
      .eq("profile_id", profile.id)
      .order("relevance_score", { ascending: false })

    if (evidenceError) {
      console.error("Error fetching linked evidence:", evidenceError)
      return null
    }

    return {
      ...profile,
      mental_health_domains: domains || [],
      profile_tags: tags || [],
      growth_milestones: milestones || [],
      linked_evidence: evidence || [],
    }
  }

  /**
   * Create a new clinical profile for a user
   */
  static async createProfile(userId: string, profileData: Partial<ClinicalProfile>): Promise<ClinicalProfile | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("clinical_profiles")
      .insert({
        user_id: userId,
        ...profileData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating clinical profile:", error)
      return null
    }

    return data
  }

  /**
   * Update a clinical profile
   */
  static async updateProfile(
    profileId: string,
    profileData: Partial<ClinicalProfile>,
  ): Promise<ClinicalProfile | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("clinical_profiles")
      .update(profileData)
      .eq("id", profileId)
      .select()
      .single()

    if (error) {
      console.error("Error updating clinical profile:", error)
      return null
    }

    return data
  }

  /**
   * Add a mental health domain to a profile
   */
  static async addMentalHealthDomain(
    profileId: string,
    domainData: Omit<MentalHealthDomain, "id" | "profile_id" | "last_updated">,
  ): Promise<MentalHealthDomain | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("mental_health_domains")
      .insert({
        profile_id: profileId,
        ...domainData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding mental health domain:", error)
      return null
    }

    return data
  }

  /**
   * Update a mental health domain
   */
  static async updateMentalHealthDomain(
    domainId: string,
    domainData: Partial<MentalHealthDomain>,
  ): Promise<MentalHealthDomain | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("mental_health_domains")
      .update({
        ...domainData,
        last_updated: new Date().toISOString(),
      })
      .eq("id", domainId)
      .select()
      .single()

    if (error) {
      console.error("Error updating mental health domain:", error)
      return null
    }

    return data
  }

  /**
   * Add a tag to a profile
   */
  static async addProfileTag(
    profileId: string,
    tagData: Omit<ProfileTag, "id" | "profile_id">,
  ): Promise<ProfileTag | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("profile_tags")
      .insert({
        profile_id: profileId,
        ...tagData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding profile tag:", error)
      return null
    }

    return data
  }

  /**
   * Add a growth milestone to a profile
   */
  static async addGrowthMilestone(
    profileId: string,
    milestoneData: Omit<GrowthMilestone, "id" | "profile_id">,
  ): Promise<GrowthMilestone | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("growth_milestones")
      .insert({
        profile_id: profileId,
        ...milestoneData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding growth milestone:", error)
      return null
    }

    return data
  }

  /**
   * Add linked evidence to a profile
   */
  static async addLinkedEvidence(
    profileId: string,
    evidenceData: Omit<LinkedEvidence, "id" | "profile_id">,
  ): Promise<LinkedEvidence | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("linked_evidence")
      .insert({
        profile_id: profileId,
        ...evidenceData,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding linked evidence:", error)
      return null
    }

    return data
  }

  /**
   * Get or create a clinical profile for a user
   */
  static async getOrCreateProfile(userId: string): Promise<ClinicalProfile | null> {
    const supabase = getServiceClient()

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("clinical_profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (!fetchError && existingProfile) {
      return existingProfile
    }

    // Create new profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from("clinical_profiles")
      .insert({
        user_id: userId,
        primary_focus: [],
        dominant_behavioral_traits: [],
        dominant_cognitive_patterns: [],
        preferred_therapeutic_techniques: [],
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating clinical profile:", createError)
      return null
    }

    return newProfile
  }
}
