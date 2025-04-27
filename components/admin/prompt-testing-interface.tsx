"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clock, Zap, Save, Copy, AlertCircle, History } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { PromptWithUsage, PromptTestResult } from "@/lib/admin/types"

interface PromptTestingInterfaceProps {
  prompts: PromptWithUsage[]
}

export function PromptTestingInterface({ prompts }: PromptTestingInterfaceProps) {
  const { toast } = useToast()
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")
  const [input, setInput] = useState("")
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    output: string
    duration: number
    tokensUsed: number
    timestamp: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testHistory, setTestHistory] = useState<PromptTestResult[]>([])
  const [activeTab, setActiveTab] = useState<"test" | "history" | "variables">("test")
  const [extractedVariables, setExtractedVariables] = useState<string[]>([])

  // Get the selected prompt and its versions
  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId)
  const promptVersions = selectedPrompt?.versions || []

  // Get the selected version
  const selectedVersion = promptVersions.find((v) => v.id === selectedVersionId)

  // Effect to update the selected version when the prompt changes
  useEffect(() => {
    if (selectedPrompt && promptVersions.length > 0) {
      setSelectedVersionId(promptVersions[0].id)
    } else {
      setSelectedVersionId("")
    }
  }, [selectedPromptId, selectedPrompt, promptVersions])

  // Effect to extract variables from the prompt template
  useEffect(() => {
    if (selectedVersion?.system_prompt) {
      // Extract variables using regex {{variable_name}}
      const regex = /\{\{([^}]+)\}\}/g
      const matches = selectedVersion.system_prompt.match(regex) || []
      const vars = matches.map((match) => match.slice(2, -2))

      // Remove duplicates
      const uniqueVars = [...new Set(vars)]
      setExtractedVariables(uniqueVars)

      // Initialize variables object with empty strings
      const initialVars: Record<string, string> = {}
      uniqueVars.forEach((v) => {
        initialVars[v] = variables[v] || ""
      })
      setVariables(initialVars)
    } else {
      setExtractedVariables([])
      setVariables({})
    }
  }, [selectedVersion])

  // Effect to fetch test history when the version changes
  useEffect(() => {
    if (selectedVersionId) {
      fetchTestHistory()
    } else {
      setTestHistory([])
    }
  }, [selectedVersionId])

  const fetchTestHistory = async () => {
    if (!selectedPromptId || !selectedVersionId) return

    try {
      const response = await fetch(`/api/admin/prompts/${selectedPromptId}/test?versionId=${selectedVersionId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch test history: ${response.statusText}`)
      }

      const data = await response.json()
      setTestHistory(data.test_results || [])
    } catch (err) {
      console.error("Error fetching test history:", err)
      toast({
        title: "Error",
        description: "Failed to load test history",
        variant: "destructive",
      })
    }
  }

  const runTest = async () => {
    if (!selectedPromptId || !selectedVersionId || !input.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Prepare the payload with variables
      const payload = {
        input,
        promptVersionId: selectedVersionId,
        variables,
      }

      const response = await fetch(`/api/admin/prompts/${selectedPromptId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to test prompt")
      }

      const data = await response.json()

      setResult({
        output: data.output,
        duration: data.duration,
        tokensUsed: data.tokens_used,
        timestamp: new Date().toISOString(),
      })

      // Add to test history
      setTestHistory([data.test_result, ...testHistory])

      toast({
        title: "Test completed",
        description: `Completed in ${(data.duration / 1000).toFixed(2)}s`,
      })
    } catch (err) {
      console.error("Error testing prompt:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")

      toast({
        title: "Test failed",
        description: err instanceof Error ? err.message : "Failed to test prompt",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard",
    })
  }

  const saveAsTemplate = () => {
    if (!input.trim()) return

    const templateName = prompt("Enter a name for this template:")
    if (!templateName) return

    // Save to local storage
    const templates = JSON.parse(localStorage.getItem("promptTestTemplates") || "{}")
    templates[templateName] = input
    localStorage.setItem("promptTestTemplates", JSON.stringify(templates))

    toast({
      title: "Template saved",
      description: `"${templateName}" has been saved as a template`,
    })
  }

  const loadTemplate = () => {
    const templates = JSON.parse(localStorage.getItem("promptTestTemplates") || "{}")
    const templateNames = Object.keys(templates)

    if (templateNames.length === 0) {
      toast({
        title: "No templates",
        description: "You don't have any saved templates",
      })
      return
    }

    const templateName = prompt("Enter the name of the template to load:", templateNames.join(", "))
    if (!templateName || !templates[templateName]) return

    setInput(templates[templateName])
    toast({
      title: "Template loaded",
      description: `"${templateName}" has been loaded`,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select a Prompt</CardTitle>
          <CardDescription>Choose a prompt to test from your prompt library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Prompt</label>
              <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a prompt" />
                </SelectTrigger>
                <SelectContent>
                  {prompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name} {!prompt.is_active && "(Inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Version</label>
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId} disabled={!selectedPrompt}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent>
                  {promptVersions.map((version, index) => (
                    <SelectItem key={version.id} value={version.id}>
                      {index === 0 ? "Current Version" : `Version ${promptVersions.length - index}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPrompt && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">System Prompt</h3>
                <Badge variant={selectedPrompt.is_active ? "default" : "outline"}>
                  {selectedPrompt.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-2 bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap">{selectedVersion?.system_prompt}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPrompt && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="test">Test Input</TabsTrigger>
                <TabsTrigger value="variables" disabled={extractedVariables.length === 0}>
                  Variables {extractedVariables.length > 0 && `(${extractedVariables.length})`}
                </TabsTrigger>
                <TabsTrigger value="history">History {testHistory.length > 0 && `(${testHistory.length})`}</TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Test Input</CardTitle>
                    <CardDescription>Enter text to test with this prompt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Enter your test input here..."
                      className="min-h-[200px] font-mono text-sm"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={saveAsTemplate}>
                        <Save className="mr-2 h-4 w-4" />
                        Save as Template
                      </Button>
                      <Button variant="outline" size="sm" onClick={loadTemplate}>
                        <History className="mr-2 h-4 w-4" />
                        Load Template
                      </Button>
                    </div>
                    <Button onClick={runTest} disabled={isLoading || !input.trim() || !selectedVersionId}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Run Test
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Sample inputs */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sample Inputs</CardTitle>
                    <CardDescription>Quick test examples based on the prompt category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedPrompt.category === "Analysis" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() =>
                              setInput(
                                "I've been feeling anxious about my upcoming presentation at work. I keep worrying that I'll forget what to say or that people will judge me harshly. Last night I couldn't sleep because I kept imagining worst-case scenarios.",
                              )
                            }
                          >
                            Journal entry about anxiety
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() =>
                              setInput(
                                "Today was a really good day. I finished my project ahead of schedule and my boss was impressed. I feel proud of myself and confident in my abilities. I'm looking forward to taking on more challenging work in the future.",
                              )
                            }
                          >
                            Positive journal entry
                          </Button>
                        </>
                      )}

                      {selectedPrompt.category === "Conversation" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() =>
                              setInput(
                                "I've been feeling overwhelmed lately with all my responsibilities. Do you have any advice?",
                              )
                            }
                          >
                            Seeking advice for feeling overwhelmed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() =>
                              setInput("Can you help me understand why I keep procrastinating on important tasks?")
                            }
                          >
                            Question about procrastination
                          </Button>
                        </>
                      )}

                      {selectedPrompt.category === "Content Generation" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => setInput("Generate 3 journal prompts about self-reflection")}
                          >
                            Generate journal prompts
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => setInput("Create a daily affirmation focused on self-compassion")}
                          >
                            Create affirmation
                          </Button>
                        </>
                      )}

                      {/* Generic examples for any category */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => setInput("This is a test input to see how the prompt responds to basic text.")}
                      >
                        Basic test input
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => setInput("Can you explain how this prompt works and what it's designed to do?")}
                      >
                        Meta-prompt question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Template Variables</CardTitle>
                    <CardDescription>Fill in values for variables used in this prompt template</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {extractedVariables.length > 0 ? (
                      <div className="space-y-4">
                        {extractedVariables.map((variable) => (
                          <div key={variable} className="grid gap-2">
                            <label className="text-sm font-medium">{variable}</label>
                            <Input
                              placeholder={`Value for {{${variable}}}`}
                              value={variables[variable] || ""}
                              onChange={(e) =>
                                setVariables({
                                  ...variables,
                                  [variable]: e.target.value,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No variables found in this prompt template.</p>
                    )}
                  </CardContent>
                </Card>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Variables are placeholders in the format <code>{"{{variable_name}}"}</code> in your prompt template.
                    They will be replaced with the values you provide here.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Test History</CardTitle>
                    <CardDescription>Previous test results for this prompt version</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {testHistory.length > 0 ? (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {testHistory.map((test) => (
                          <div key={test.id} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">Input</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(test.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-sm line-clamp-2">{test.input}</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">Output</div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {(test.duration / 1000).toFixed(2)}s
                                </Badge>
                                <Badge variant="outline">{test.tokens_used} tokens</Badge>
                              </div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-md">
                              <div className="text-sm line-clamp-3">{test.output}</div>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full" onClick={() => setInput(test.input)}>
                              Reuse This Input
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No test history available for this prompt version
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Results</span>
                  {result && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {(result.duration / 1000).toFixed(2)}s
                      </Badge>
                      <Badge variant="outline">{result.tokensUsed} tokens</Badge>
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  {result ? `Generated on ${new Date(result.timestamp).toLocaleString()}` : "Run a test to see results"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Processing your request...</p>
                  </div>
                ) : error ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : result ? (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md min-h-[300px] max-h-[500px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{result.output}</pre>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.output)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Output
                      </Button>
                    </div>

                    {/* Try to detect if the output is JSON */}
                    {result.output.trim().startsWith("{") && result.output.trim().endsWith("}") && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">JSON Preview</h3>
                        <div className="bg-muted p-4 rounded-md overflow-x-auto">
                          <pre className="text-xs">
                            {(() => {
                              try {
                                const json = JSON.parse(result.output)
                                return JSON.stringify(json, null, 2)
                              } catch (e) {
                                return "Invalid JSON"
                              }
                            })()}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="bg-muted/50 rounded-full p-4 mb-4">
                      <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No test results yet</h3>
                    <p className="text-muted-foreground max-w-md">
                      Select a prompt, enter some test input, and click "Run Test" to see the results here.
                    </p>
                  </div>
                )}
              </CardContent>
              {result && (
                <CardFooter className="border-t pt-4">
                  <div className="w-full">
                    <h3 className="text-sm font-medium mb-2">Performance Analysis</h3>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Response Time</span>
                          <span
                            className={
                              result.duration < 2000
                                ? "text-green-500"
                                : result.duration < 5000
                                  ? "text-amber-500"
                                  : "text-red-500"
                            }
                          >
                            {(result.duration / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              result.duration < 2000
                                ? "bg-green-500"
                                : result.duration < 5000
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(100, (result.duration / 10000) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Token Usage</span>
                          <span>{result.tokensUsed} tokens</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${Math.min(100, (result.tokensUsed / 2000) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
