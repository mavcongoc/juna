"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Prompt, PromptUpdatePayload } from "@/lib/admin/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the form schema with Zod
const promptFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  system_prompt: z.string().min(10, "System prompt must be at least 10 characters"),
  temperature: z.number().min(0).max(2),
  model: z.string().default("gpt-4o"),
  max_tokens: z.number().min(1).max(4096).default(1000),
  category: z.string().min(1, "Category is required"),
  is_active: z.boolean(),
  change_notes: z.string().optional(),
})

type PromptFormValues = z.infer<typeof promptFormSchema>

interface PromptEditFormProps {
  prompt?: Prompt
  onSave?: (updatedPrompt: any) => void
}

// Available models
const AVAILABLE_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
]

export default function PromptEditForm({ prompt, onSave }: PromptEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>(["General", "Journal", "Chat", "Analysis"])

  // Set default values based on existing prompt or create new defaults
  const defaultValues: PromptFormValues = {
    name: prompt?.name || "",
    description: prompt?.description || "",
    system_prompt: prompt?.system_prompt || "",
    temperature: prompt?.temperature || 0.7,
    model: prompt?.model || "gpt-4o",
    max_tokens: prompt?.max_tokens || 1000,
    category: prompt?.category || (categories.length > 0 ? categories[0] : "General"),
    is_active: prompt?.is_active !== undefined ? prompt?.is_active : true,
    change_notes: "",
  }

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
  })

  // Update form values when prompt changes
  useEffect(() => {
    if (prompt) {
      form.reset({
        name: prompt.name,
        description: prompt.description,
        system_prompt: prompt.system_prompt,
        temperature: prompt.temperature,
        model: prompt.model || "gpt-4o",
        max_tokens: prompt.max_tokens || 1000,
        category: prompt.category,
        is_active: prompt.is_active,
        change_notes: "",
      })
    }
  }, [prompt, form])

  const onSubmit = async (data: PromptFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload: PromptUpdatePayload = {
        ...data,
      }

      const url = prompt?.id ? `/api/admin/prompts/${prompt.id}` : "/api/admin/prompts"

      const response = await fetch(url, {
        method: prompt?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save prompt")
      }

      const savedPrompt = await response.json()

      toast({
        title: prompt?.id ? "Prompt updated" : "Prompt created",
        description: `Successfully ${prompt?.id ? "updated" : "created"} prompt "${data.name}"`,
      })

      if (onSave) {
        onSave(savedPrompt)
      } else {
        // Navigate to the prompt detail page if it's a new prompt
        if (!prompt?.id) {
          router.push(`/admin/prompts/${savedPrompt.id}`)
        } else {
          router.refresh()
        }
      }
    } catch (err) {
      console.error("Error saving prompt:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save prompt. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter prompt name" {...field} />
                </FormControl>
                <FormDescription>A unique identifier for this prompt</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    <SelectItem value="New">+ Add New Category</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Group related prompts together</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what this prompt is used for" className="resize-none" {...field} />
              </FormControl>
              <FormDescription>A brief description of the prompt's purpose</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the system prompt text"
                  className="min-h-[200px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>The actual prompt text that will be sent to the AI model</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The OpenAI model to use</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_tokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={100}
                    max={4096}
                    step={100}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
                <FormDescription>Maximum number of tokens in the response</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value.toFixed(2)}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
                <FormDescription>
                  {field.value < 0.4
                    ? "More precise and deterministic"
                    : field.value > 0.7
                      ? "More creative and varied"
                      : "Balanced responses"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>Only active prompts will be used in the application</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {prompt?.id && (
          <FormField
            control={form.control}
            name="change_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Change Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe what changes you made and why" className="resize-none" {...field} />
                </FormControl>
                <FormDescription>Document the changes made to this prompt for version history</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : prompt?.id ? "Update Prompt" : "Create Prompt"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Also export as a named export for flexibility
export { PromptEditForm }
