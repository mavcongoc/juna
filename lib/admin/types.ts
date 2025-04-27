/**
 * Type definitions for the Admin Prompt Management System
 */

export interface Prompt {
  id: string
  name: string
  description: string
  system_prompt: string
  temperature: number
  category: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface PromptVersion {
  id: string
  prompt_id: string
  system_prompt: string
  temperature: number
  created_at: string
  created_by: string
  change_notes: string
}

export interface PromptUsage {
  id: string
  prompt_id: string
  location: string
  description: string
  component_path: string
}

export interface AdminUser {
  id: string
  email: string
  is_super_admin: boolean
}

export interface PromptWithUsage extends Prompt {
  usage: PromptUsage[]
  versions: PromptVersion[]
}

export interface PromptTestResult {
  id: string
  prompt_version_id: string
  input: string
  output: string
  duration: number
  tokens_used: number
  created_at: string
  created_by: string
}

export interface PromptUpdatePayload {
  name?: string
  description?: string
  system_prompt?: string
  temperature?: number
  category?: string
  is_active?: boolean
  change_notes?: string
}

export interface PromptMetric {
  id: string
  prompt_id: string
  duration_ms: number
  input_tokens: number
  output_tokens: number
  success: boolean
  created_at: string
}

export interface PromptMetrics {
  totalCalls: number
  successRate: number
  avgDuration: number
  totalTokens: number
  timeSeriesData: Array<{
    date: string
    calls: number
    avgDuration: number
    tokens: number
  }>
}
