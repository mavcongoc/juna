"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface UsagePoint {
  name: string
  file: string
  description: string
  promptName: string
  flowDirection: "in" | "out"
}

const usagePoints: UsagePoint[] = [
  {
    name: "Journal Entry Analysis",
    file: "app/api/analyze-entry/route.ts",
    description: "Analyzes journal entries to extract emotions, themes, and insights",
    promptName: "journalAnalysis",
    flowDirection: "in",
  },
  {
    name: "Chat Interface",
    file: "app/api/chat/route.ts",
    description: "Powers the AI chat interface for user conversations",
    promptName: "conversationalChat",
    flowDirection: "in",
  },
  {
    name: "Insights Generation",
    file: "app/api/insights/route.ts",
    description: "Generates insights from multiple journal entries over time",
    promptName: "insightsSummary",
    flowDirection: "in",
  },
]

export default function PromptUsageFlow() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prompt Usage Flow</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usagePoints.map((point, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{point.name}</CardTitle>
                <Badge variant="outline">{point.promptName}</Badge>
              </div>
              <CardDescription>
                <code className="text-xs">{point.file}</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{point.description}</p>

              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium text-sm mb-2">Flow Process:</h4>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>
                    Application requests the <strong>{point.promptName}</strong> prompt
                  </li>
                  <li>GPTService checks the cache for the prompt</li>
                  <li>If not in cache, fetches from database via PromptDBService</li>
                  <li>Falls back to code-defined prompts if needed</li>
                  <li>Processes user input with the prompt</li>
                  <li>Records usage metrics back to the database</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Retrieval Logic</CardTitle>
          <CardDescription>How prompts are retrieved and used in the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md overflow-auto">
            <pre className="text-xs">
              {`// Pseudocode for prompt retrieval flow
async function getPromptForUse(promptName) {
  // 1. Check cache first for performance
  const cachedPrompt = promptCache.get(promptName);
  if (cachedPrompt) {
    return cachedPrompt;
  }
  
  // 2. Try to get from database
  try {
    const dbPrompt = await PromptDBService.getPromptByName(promptName);
    if (dbPrompt) {
      // Store in cache and return
      promptCache.set(promptName, dbPrompt);
      return dbPrompt;
    }
  } catch (error) {
    console.error(\`Error fetching prompt \${promptName} from database\`, error);
  }
  
  // 3. Fall back to code-defined prompts
  const codePrompt = PromptTemplates[promptName];
  if (codePrompt) {
    console.warn(\`Using code-defined prompt for \${promptName}\`);
    return codePrompt;
  }
  
  // 4. Last resort: return a generic prompt
  console.error(\`Prompt \${promptName} not found anywhere\`);
  return {
    system: "You are a helpful assistant.",
    temperature: 0.7
  };
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
