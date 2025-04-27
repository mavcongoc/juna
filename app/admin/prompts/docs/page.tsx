import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function PromptDocumentationPage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Prompt Management Documentation</h1>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Documentation</AlertTitle>
        <AlertDescription>This page provides documentation for the prompt management system.</AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Guide</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Management System</CardTitle>
              <CardDescription>
                A comprehensive system for managing AI prompts with versioning, testing, and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Prompt Management System provides a centralized way to manage, version, test, and analyze AI prompts
                used throughout the application. It enables prompt reuse, consistent performance monitoring, and
                collaborative improvement of AI interactions.
              </p>

              <h3 className="text-lg font-semibold mt-4">Key Features</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Centralized prompt storage with categorization</li>
                <li>Version control with change history</li>
                <li>Interactive testing interface</li>
                <li>Performance metrics and analytics</li>
                <li>Seamless integration with the GPT service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>How the prompt management system is structured</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">The prompt management system consists of several key components:</p>

              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Database Layer</strong> - Stores prompts, versions, usage information, and metrics
                </li>
                <li>
                  <strong>Service Layer</strong> - Provides methods for interacting with prompts (PromptService)
                </li>
                <li>
                  <strong>API Layer</strong> - REST endpoints for CRUD operations on prompts
                </li>
                <li>
                  <strong>UI Components</strong> - Admin interface for managing prompts
                </li>
                <li>
                  <strong>Integration Layer</strong> - Connects the GPT service with the prompt database
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Using Prompts in Code</CardTitle>
              <CardDescription>How to use managed prompts in your application code</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">To use a managed prompt in your code, use the GPT service's template methods:</p>

              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`
// Example: Using a prompt template
import { getGPTService } from "@/lib/gpt-service"

async function generateInsights(journalEntry) {
  const gptService = getGPTService()
  
  const result = await gptService.generateStructuredDataWithTemplate(
    "analyze_journal_entry",  // Prompt name in the database
    {
      entry: journalEntry.content,
      date: journalEntry.created_at
    },
    { maxTokens: 1500 }  // Optional overrides
  )
  
  if (result.success && result.data) {
    return result.data
  }
  
  throw new Error(\`Failed to generate insights: \${result.error}\`)
}
                `}</code>
              </pre>

              <h3 className="text-lg font-semibold mt-6">Template Variables</h3>
              <p className="mb-2">
                Prompt templates can include variables using the <code>{"{{variable_name}}"}</code> syntax. These
                variables are replaced with the values provided in the <code>promptVariables</code> object.
              </p>

              <h3 className="text-lg font-semibold mt-6">Available Methods</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <code>generateTextWithTemplate</code> - For generating text responses
                </li>
                <li>
                  <code>generateStructuredDataWithTemplate</code> - For generating structured data (JSON)
                </li>
                <li>
                  <code>streamTextWithTemplate</code> - For streaming text responses
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creating and Editing Prompts</CardTitle>
              <CardDescription>How to manage prompts in the admin interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Creating a New Prompt</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Navigate to the Prompts section in the admin dashboard</li>
                <li>Click "Create New Prompt"</li>
                <li>
                  Fill in the required fields:
                  <ul className="list-disc pl-6 mt-2">
                    <li>
                      <strong>Name</strong> - A unique identifier for the prompt
                    </li>
                    <li>
                      <strong>Description</strong> - What the prompt does and how it's used
                    </li>
                    <li>
                      <strong>Category</strong> - Logical grouping for the prompt
                    </li>
                    <li>
                      <strong>System Prompt</strong> - The actual prompt template
                    </li>
                    <li>
                      <strong>Temperature</strong> - Controls randomness (0.0-1.0)
                    </li>
                  </ul>
                </li>
                <li>Add change notes describing the initial version</li>
                <li>Click "Create Prompt" to save</li>
              </ol>

              <h3 className="text-lg font-semibold mt-4">Editing an Existing Prompt</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Find the prompt in the list and click on it</li>
                <li>Make your changes in the Edit tab</li>
                <li>Add change notes explaining your modifications</li>
                <li>Click "Update Prompt" to save a new version</li>
              </ol>

              <h3 className="text-lg font-semibold mt-4">Testing Prompts</h3>
              <p>
                Use the Test tab to try out your prompt with sample inputs. This helps ensure the prompt works as
                expected before using it in production.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>Reference documentation for the Prompt Management API</CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold">PromptService Methods</h3>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium">getAllPrompts()</h4>
                  <p className="text-sm text-muted-foreground">
                    Returns all prompts with their usage information and versions.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">getPromptById(id: string)</h4>
                  <p className="text-sm text-muted-foreground">
                    Returns a single prompt with all its versions and usage information.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">createPrompt(payload: PromptUpdatePayload, adminUserId: string)</h4>
                  <p className="text-sm text-muted-foreground">Creates a new prompt and its initial version.</p>
                </div>

                <div>
                  <h4 className="font-medium">
                    updatePrompt(id: string, payload: PromptUpdatePayload, adminUserId: string)
                  </h4>
                  <p className="text-sm text-muted-foreground">Updates a prompt and creates a new version.</p>
                </div>

                <div>
                  <h4 className="font-medium">deletePrompt(id: string)</h4>
                  <p className="text-sm text-muted-foreground">Deletes a prompt and all associated data.</p>
                </div>

                <div>
                  <h4 className="font-medium">getActivePromptByName(name: string)</h4>
                  <p className="text-sm text-muted-foreground">Returns the active version of a prompt by name.</p>
                </div>

                <div>
                  <h4 className="font-medium">
                    recordPromptUsageMetrics(promptName: string, duration: number, inputTokens: number, outputTokens:
                    number, success: boolean)
                  </h4>
                  <p className="text-sm text-muted-foreground">Records usage metrics for a prompt.</p>
                </div>

                <div>
                  <h4 className="font-medium">
                    getPromptMetrics(promptId: string, timeRange: 'day' | 'week' | 'month')
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Returns metrics for a prompt within the specified time range.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-6">GPT Service Methods</h3>

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium">
                    generateTextWithTemplate(promptName: string, promptVariables: Record&lt;string, string&gt;,
                    options?: GPTServiceOptions)
                  </h4>
                  <p className="text-sm text-muted-foreground">Generates text using a named prompt template.</p>
                </div>

                <div>
                  <h4 className="font-medium">
                    generateStructuredDataWithTemplate&lt;T&gt;(promptName: string, promptVariables: Record&lt;string,
                    string&gt;, options?: GPTServiceOptions, schema?: z.ZodType&lt;T&gt;)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Generates structured data using a named prompt template with optional schema validation.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">
                    streamTextWithTemplate(promptName: string, promptVariables: Record&lt;string, string&gt;,
                    callbacks?: StreamCallbacks, options?: GPTServiceOptions)
                  </h4>
                  <p className="text-sm text-muted-foreground">Streams text using a named prompt template.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="best-practices" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Engineering Best Practices</CardTitle>
              <CardDescription>Guidelines for creating effective prompts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Structure</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Be specific and clear</strong> - Clearly define what you want the model to do
                </li>
                <li>
                  <strong>Use sections</strong> - Break complex prompts into labeled sections
                </li>
                <li>
                  <strong>Include examples</strong> - Provide examples of desired outputs when appropriate
                </li>
                <li>
                  <strong>Define the format</strong> - Specify the exact format you want for the output
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Variables</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Use descriptive names</strong> - Variable names should clearly indicate their purpose
                </li>
                <li>
                  <strong>Document expected values</strong> - Include comments about what values are expected
                </li>
                <li>
                  <strong>Handle edge cases</strong> - Consider what happens with empty or unexpected values
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Temperature Settings</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Low temperature (0.0-0.3)</strong> - For factual, consistent, deterministic responses
                </li>
                <li>
                  <strong>Medium temperature (0.3-0.7)</strong> - For balanced creativity and consistency
                </li>
                <li>
                  <strong>High temperature (0.7-1.0)</strong> - For creative, varied, diverse responses
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Testing</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Test edge cases</strong> - Try inputs that might cause problems
                </li>
                <li>
                  <strong>Validate outputs</strong> - Ensure outputs match your expectations
                </li>
                <li>
                  <strong>Iterate based on results</strong> - Refine prompts based on test outcomes
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Versioning</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Write meaningful change notes</strong> - Document why changes were made
                </li>
                <li>
                  <strong>Make incremental improvements</strong> - Change one aspect at a time
                </li>
                <li>
                  <strong>Compare performance</strong> - Use metrics to compare versions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Patterns</CardTitle>
              <CardDescription>Best practices for integrating prompts into your application</CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold">Fallback Mechanisms</h3>
              <p className="mb-4">Always implement fallback mechanisms in case a prompt fails:</p>

              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`
// Example: Implementing fallbacks
async function getAnalysis(entry) {
  try {
    // Try the database prompt first
    const result = await gptService.generateStructuredDataWithTemplate(
      "analyze_entry",
      { content: entry.content }
    )
    
    if (result.success) {
      return result.data
    }
    
    // If that fails, try a hardcoded fallback prompt
    console.warn("Database prompt failed, using fallback")
    return await fallbackAnalysis(entry)
  } catch (error) {
    console.error("Analysis failed:", error)
    // Return a minimal safe result
    return { 
      success: false,
      error: "Could not analyze entry",
      fallback: true
    }
  }
}
                `}</code>
              </pre>

              <h3 className="text-lg font-semibold mt-6">Caching Strategies</h3>
              <p>The prompt system includes built-in caching, but you can implement additional caching:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Cache final results for identical inputs</li>
                <li>Implement response caching for expensive operations</li>
                <li>Use stale-while-revalidate patterns for UI</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">Error Handling</h3>
              <p>Implement comprehensive error handling:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Log errors with context for debugging</li>
                <li>Provide user-friendly error messages</li>
                <li>Track error rates to identify problematic prompts</li>
                <li>Implement retry logic with exponential backoff</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
