import PromptFlowDiagram from "@/components/prompt-flow-diagram"
import PromptUsageFlow from "@/components/prompt-usage-flow"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PromptDocumentationPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Prompt Management System</h1>
        <p className="text-muted-foreground">Documentation for the prompt management system in Juna</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flow">Flow Diagram</TabsTrigger>
          <TabsTrigger value="usage">Usage Points</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Management System Overview</CardTitle>
              <CardDescription>A comprehensive system for managing AI prompts in the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Prompt Management System provides a structured way to store, version, test, and analyze AI prompts
                used throughout the Juna application. This system replaces hardcoded prompts with a database-driven
                approach that offers several advantages:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Centralized Management:</strong> All prompts are stored in a single location, making them
                  easier to manage and update.
                </li>
                <li>
                  <strong>Versioning:</strong> Changes to prompts are tracked with version history, allowing for
                  rollbacks if needed.
                </li>
                <li>
                  <strong>Performance Metrics:</strong> Usage and performance data is collected to help optimize prompts
                  over time.
                </li>
                <li>
                  <strong>Testing Interface:</strong> Prompts can be tested before deployment to ensure they produce the
                  expected results.
                </li>
                <li>
                  <strong>Caching:</strong> Frequently used prompts are cached for better performance.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>The tables that store prompt data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold">prompts</h3>
                  <p className="text-sm text-muted-foreground mb-2">Main table for prompt definitions</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <code>
                      id, name, description, system_prompt, temperature, category, is_active, created_at, updated_at
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold">prompt_versions</h3>
                  <p className="text-sm text-muted-foreground mb-2">Version history for prompts</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <code>id, prompt_id, system_prompt, temperature, created_at, created_by, change_notes</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold">prompt_usage</h3>
                  <p className="text-sm text-muted-foreground mb-2">Where prompts are used in the application</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <code>id, prompt_id, location, description, component_path, created_at, updated_at</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold">prompt_metrics</h3>
                  <p className="text-sm text-muted-foreground mb-2">Performance metrics for prompts</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <code>id, prompt_id, duration_ms, input_tokens, output_tokens, success, created_at</code>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold">prompt_test_results</h3>
                  <p className="text-sm text-muted-foreground mb-2">Results from prompt testing</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <code>id, prompt_version_id, input, output, duration, tokens_used, created_at, created_by</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow">
          <PromptFlowDiagram />
        </TabsContent>

        <TabsContent value="usage">
          <PromptUsageFlow />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>How to interact with the prompt management system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold">PromptDBService</h3>
                <p className="text-sm text-muted-foreground mb-2">Service for interacting with the prompt database</p>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">
                      static async getPromptByName(name: string): Promise&lt;Prompt | null&gt;
                    </code>
                    <p className="text-xs mt-1">Get a prompt by name from the database or cache</p>
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">static async getAllPrompts(): Promise&lt;Prompt[]&gt;</code>
                    <p className="text-xs mt-1">Get all prompts from the database</p>
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">
                      static async getPromptVersions(promptId: string): Promise&lt;PromptVersion[]&gt;
                    </code>
                    <p className="text-xs mt-1">Get version history for a prompt</p>
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">
                      static async savePrompt(prompt: Partial&lt;Prompt&gt;, adminUserId: string, changeNotes?: string):
                      Promise&lt;{"{"}success: boolean; promptId?: string; error?: string{"}"}&gt;
                    </code>
                    <p className="text-xs mt-1">Create or update a prompt</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold">GPTService</h3>
                <p className="text-sm text-muted-foreground mb-2">Service for interacting with OpenAI's GPT models</p>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">
                      async generateTextWithTemplate(promptName: string, promptVariables: Record&lt;string, string&gt;,
                      options?: GPTServiceOptions): Promise&lt;GPTServiceResponse&lt;string&gt;&gt;
                    </code>
                    <p className="text-xs mt-1">Generate text using a named prompt template</p>
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">
                      async generateStructuredDataWithTemplate&lt;T&gt;(promptName: string, promptVariables:
                      Record&lt;string, string&gt;, options?: GPTServiceOptions, schema?: z.ZodType&lt;T&gt;):
                      Promise&lt;GPTServiceResponse&lt;T&gt;&gt;
                    </code>
                    <p className="text-xs mt-1">Generate structured data using a named prompt template</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
