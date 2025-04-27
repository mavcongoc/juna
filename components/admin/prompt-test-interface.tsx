"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Variable } from "lucide-react"
import type { Prompt } from "@/lib/admin/types"

interface PromptTestInterfaceProps {
  prompt: Prompt
  adminUserId: string
}

const testFormSchema = z.object({
  userInput: z.string().min(1, "Input is required"),
  variables: z.record(z.string()).optional(),
})

type TestFormValues = z.infer<typeof testFormSchema>

export default function PromptTestInterface({ prompt, adminUserId }: PromptTestInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({})
  const [extractedVariables, setExtractedVariables] = useState<string[]>([])

  // Extract variables from the prompt on component mount
  useState(() => {
    const regex = /\{\{([^}]+)\}\}/g
    const matches = [...prompt.system_prompt.matchAll(regex)]
    const variables = matches.map((match) => match[1].trim())
    const uniqueVariables = Array.from(new Set(variables))
    setExtractedVariables(uniqueVariables)

    // Initialize variables with empty values
    const initialVars: Record<string, string> = {}
    uniqueVariables.forEach((variable) => {
      initialVars[variable] = ""
    })
    setPromptVariables(initialVars)
  }, [prompt.system_prompt])

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      userInput: "",
      variables: promptVariables,
    },
  })

  const onSubmit = async (data: TestFormValues) => {
    setIsLoading(true)
    setResponse(null)
    setResponseTime(null)

    const startTime = Date.now()

    try {
      const response = await fetch(`/api/admin/prompts/${prompt.id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: data.userInput,
          variables: promptVariables,
          adminUserId,
        }),
      })

      if (!response.ok) {
        throw new Error("Test request failed")
      }

      const result = await response.json()
      setResponse(result.response)
      setResponseTime(Date.now() - startTime)
    } catch (error) {
      console.error("Error testing prompt:", error)
      setResponse("Error: Failed to get a response from the AI model. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVariableChange = (variable: string, value: string) => {
    setPromptVariables((prev) => ({
      ...prev,
      [variable]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Test Prompt</CardTitle>
          <CardDescription>Test how this prompt performs with different inputs and variables</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {extractedVariables.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Variable className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Template Variables</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractedVariables.map((variable) => (
                      <div key={variable} className="space-y-2">
                        <label htmlFor={variable} className="text-sm font-medium">
                          {variable}
                        </label>
                        <Input
                          id={variable}
                          value={promptVariables[variable] || ""}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          placeholder={`Value for ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="userInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Input</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter test input here..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormDescription>This is what the user would say to the AI</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Prompt"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Response</CardTitle>
            {responseTime && <Badge variant="outline">{(responseTime / 1000).toFixed(2)}s</Badge>}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="formatted" className="w-full">
              <TabsList>
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>
              <TabsContent value="formatted" className="pt-4">
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: response }} />
                </div>
              </TabsContent>
              <TabsContent value="raw" className="pt-4">
                <pre className="bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap text-sm">{response}</pre>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Note: Test responses are not saved and do not affect metrics.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
