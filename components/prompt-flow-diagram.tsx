"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PromptFlowDiagram() {
  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[800px] p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Prompt Management System Flow</h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="col-span-1 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle>Storage Layer</CardTitle>
              <CardDescription>Database Tables</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>prompts</strong>: Main prompt definitions
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>prompt_versions</strong>: Version history
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>prompt_usage</strong>: Where prompts are used
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>prompt_metrics</strong>: Performance data
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>prompt_test_results</strong>: Testing history
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle>Service Layer</CardTitle>
              <CardDescription>Business Logic</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>PromptService</strong>: CRUD operations
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>GPTService</strong>: AI integration
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>Cache Layer</strong>: Performance optimization
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>Metrics Collection</strong>: Usage tracking
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle>Application Layer</CardTitle>
              <CardDescription>User Interfaces</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>Admin UI</strong>: Prompt management
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>Testing UI</strong>: Prompt validation
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>Analytics UI</strong>: Performance metrics
                </li>
                <li className="p-2 bg-white dark:bg-gray-800 rounded-md">
                  <strong>Version History</strong>: Change tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Flow arrows and connections */}
        <div className="relative h-40 mb-8">
          <div className="absolute left-1/6 top-0 w-2/3 h-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-gray-400 relative">
              <div className="absolute -top-2 right-0 h-4 w-4 rotate-45 border-t-2 border-r-2 border-gray-400"></div>
            </div>
          </div>
          <div className="absolute left-1/6 top-1/2 -translate-y-1/2 text-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-md shadow-sm">
              <p className="font-medium">Prompt Retrieval Flow</p>
              <p className="text-xs mt-1">1. App requests prompt by name</p>
              <p className="text-xs">2. Check cache first</p>
              <p className="text-xs">3. Fetch from DB if not cached</p>
              <p className="text-xs">4. Fall back to code if needed</p>
            </div>
          </div>
          <div className="absolute right-1/6 top-1/2 -translate-y-1/2 text-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-md shadow-sm">
              <p className="font-medium">Metrics Collection Flow</p>
              <p className="text-xs mt-1">1. Track prompt usage</p>
              <p className="text-xs">2. Measure performance</p>
              <p className="text-xs">3. Store in metrics table</p>
              <p className="text-xs">4. Display in analytics UI</p>
            </div>
          </div>
        </div>

        {/* Application usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Application Usage Points</CardTitle>
            <CardDescription>Where prompts are used in the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950 rounded-md">
                <h3 className="font-bold">Journal Analysis</h3>
                <p className="text-sm mt-1">
                  Used in: <code>app/api/analyze-entry/route.ts</code>
                </p>
                <p className="text-sm mt-1">
                  Purpose: Analyzes journal entries to extract emotions, themes, and insights
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-md">
                <h3 className="font-bold">Conversational Chat</h3>
                <p className="text-sm mt-1">
                  Used in: <code>app/api/chat/route.ts</code>
                </p>
                <p className="text-sm mt-1">Purpose: Powers the AI chat interface for user conversations</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                <h3 className="font-bold">Insights Summary</h3>
                <p className="text-sm mt-1">
                  Used in: <code>app/api/insights/route.ts</code>
                </p>
                <p className="text-sm mt-1">Purpose: Generates insights from multiple journal entries over time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
