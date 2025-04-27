import { getOpenAI } from "@/lib/openai"
import { ClinicalProfileService } from "./clinical-profile-service"
import type { JournalEntry } from "@/types/journal"
import type { ClinicalProfile, TagCategory } from "@/types/clinical-profile"
import { PromptService } from "@/lib/admin/prompt-service"

/**
 * Service for analyzing journal entries and updating clinical profiles
 */
export class ProfileAnalyzerService {
  /**
   * Analyze a journal entry and update the user's clinical profile
   */
  static async analyzeEntryAndUpdateProfile(userId: string, entry: JournalEntry): Promise<void> {
    try {
      // Get or create the user's clinical profile
      const profile = await ClinicalProfileService.getOrCreateProfile(userId)

      if (!profile) {
        console.error("Failed to get or create clinical profile")
        return
      }

      // Analyze the entry content
      const analysis = await this.analyzeEntryContent(entry.content, profile)

      if (!analysis) {
        console.error("Failed to analyze entry content")
        return
      }

      // Update the profile with the analysis results
      await this.updateProfileWithAnalysis(profile.id, analysis)

      // Link the entry as evidence
      await ClinicalProfileService.addLinkedEvidence(profile.id, {
        evidence_type: "journal_entry",
        evidence_id: entry.id,
        relevance_note: "Automatically linked based on content analysis",
        relevance_score: 0.8,
      })
    } catch (error) {
      console.error("Error analyzing entry and updating profile:", error)
    }
  }

  /**
   * Analyze entry content using OpenAI
   */
  private static async analyzeEntryContent(content: string, existingProfile: ClinicalProfile): Promise<any | null> {
    try {
      const openai = getOpenAI()

      // Get the prompt from the database
      const promptTemplate = await PromptService.getActivePromptByName("clinicalProfileAnalysis")

      // If the prompt doesn't exist in the database, use a fallback
      const systemPrompt = promptTemplate?.system || this.getFallbackPrompt()
      const temperature = promptTemplate?.temperature || 0.3

      // Prepare the profile information
      const primaryFocus = `Primary Focus: ${existingProfile.primary_focus.join(", ") || "None identified yet"}`
      const primaryDiagnosis = `Primary Diagnosis: ${existingProfile.primary_diagnosis || "None identified yet"}`
      const secondaryDiagnosis = `Secondary Diagnosis: ${existingProfile.secondary_diagnosis || "None identified yet"}`
      const dominantBehavioralTraits = `Dominant Behavioral Traits: ${existingProfile.dominant_behavioral_traits.join(", ") || "None identified yet"}`
      const dominantCognitivePatterns = `Dominant Cognitive Patterns: ${existingProfile.dominant_cognitive_patterns.join(", ") || "None identified yet"}`
      const preferredTherapeuticTechniques = `Preferred Therapeutic Techniques: ${existingProfile.preferred_therapeutic_techniques.join(", ") || "None identified yet"}`

      // Replace placeholders in the prompt
      const finalPrompt = systemPrompt
        .replace("{{primary_focus}}", primaryFocus)
        .replace("{{primary_diagnosis}}", primaryDiagnosis)
        .replace("{{secondary_diagnosis}}", secondaryDiagnosis)
        .replace("{{dominant_behavioral_traits}}", dominantBehavioralTraits)
        .replace("{{dominant_cognitive_patterns}}", dominantCognitivePatterns)
        .replace("{{preferred_therapeutic_techniques}}", preferredTherapeuticTechniques)

      // Start time for metrics
      const startTime = Date.now()

      // Call OpenAI with the prompt
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: finalPrompt,
          },
          {
            role: "user",
            content: content,
          },
        ],
        temperature: temperature,
        response_format: { type: "json_object" },
      })

      // Calculate duration for metrics
      const duration = Date.now() - startTime

      const analysisText = response.choices[0].message.content

      // Record prompt usage metrics
      this.recordPromptMetrics(
        "clinicalProfileAnalysis",
        duration,
        response.usage?.prompt_tokens || 0,
        response.usage?.completion_tokens || 0,
        !!analysisText,
      ).catch((err) => console.error("Error recording prompt metrics:", err))

      if (!analysisText) {
        return null
      }

      try {
        return JSON.parse(analysisText)
      } catch (e) {
        console.error("Failed to parse analysis JSON:", e)
        return null
      }
    } catch (error) {
      console.error("Error analyzing entry content:", error)
      return null
    }
  }

  /**
   * Get fallback prompt in case the database prompt is not available
   */
  private static getFallbackPrompt(): string {
    return `You are a clinical psychologist assistant that analyzes journal entries to identify patterns related to mental health. 
Extract relevant information to update a user's clinical profile.

Current profile information:
{{primary_focus}}
{{primary_diagnosis}}
{{secondary_diagnosis}}
{{dominant_behavioral_traits}}
{{dominant_cognitive_patterns}}
{{preferred_therapeutic_techniques}}

Analyze the journal entry and provide updates to the clinical profile in JSON format. Include:
1. Any new or confirmed primary/secondary focus areas
2. Any evidence of behavioral traits or cognitive patterns
3. Suggested therapeutic techniques based on the content
4. Potential tags in these categories: Emotional Regulation, Behavioral Pattern, Cognitive Distortion, Attachment Style, Defense Mechanism, Communication Style
5. Any potential growth milestones evident in the entry
6. Assessment of mental health domains (Emotional, Cognitive, Behavioral, Relational, Self-Identity, Resilience)

Return ONLY valid JSON with no additional text.`
  }

  /**
   * Record metrics for prompt usage
   */
  private static async recordPromptMetrics(
    promptName: string,
    duration: number,
    inputTokens: number,
    outputTokens: number,
    success: boolean,
  ): Promise<void> {
    try {
      await PromptService.recordPromptUsageMetrics(promptName, duration, inputTokens, outputTokens, success)
    } catch (error) {
      console.error("Error recording prompt metrics:", error)
    }
  }

  /**
   * Update the clinical profile with analysis results
   */
  private static async updateProfileWithAnalysis(profileId: string, analysis: any): Promise<void> {
    try {
      // Update the base profile
      if (analysis.profile_updates) {
        await ClinicalProfileService.updateProfile(profileId, {
          primary_focus: analysis.profile_updates.primary_focus || [],
          primary_diagnosis: analysis.profile_updates.primary_diagnosis || null,
          secondary_diagnosis: analysis.profile_updates.secondary_diagnosis || null,
          dominant_behavioral_traits: analysis.profile_updates.dominant_behavioral_traits || [],
          dominant_cognitive_patterns: analysis.profile_updates.dominant_cognitive_patterns || [],
          preferred_therapeutic_techniques: analysis.profile_updates.preferred_therapeutic_techniques || [],
        })
      }

      // Add mental health domain assessments
      if (analysis.mental_health_domains) {
        for (const domain of analysis.mental_health_domains) {
          await ClinicalProfileService.addMentalHealthDomain(profileId, {
            domain_name: domain.name,
            level: domain.level,
            recent_notes: domain.notes,
          })
        }
      }

      // Add growth milestones
      if (analysis.growth_milestones) {
        for (const milestone of analysis.growth_milestones) {
          await ClinicalProfileService.addGrowthMilestone(profileId, {
            description: milestone.description,
            achieved_at: new Date().toISOString(),
            evidence_type: "journal_entry",
            evidence_id: milestone.evidence_id,
          })
        }
      }

      // Add tags
      if (analysis.tags) {
        for (const tag of analysis.tags) {
          // First, ensure the tag exists in the tags table
          // This would require additional code to create tags if they don't exist

          // Then link the tag to the profile
          await ClinicalProfileService.addProfileTag(profileId, {
            tag_id: tag.id, // This assumes the tag already exists
            category: tag.category as TagCategory,
            confidence: tag.confidence || 1.0,
          })
        }
      }
    } catch (error) {
      console.error("Error updating profile with analysis:", error)
    }
  }
}
