"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, ArrowRightIcon } from "lucide-react"

export default function PromptMigrationTool() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    migratedCount?: number
  } | null>(null)

  const handleMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/migrate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to migrate prompts")
      }

      setResult({
        success: true,
        message: data.message,
        migratedCount: data.migratedCount,
      })
    } catch (error) {
      console.error("Error during prompt migration:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Migration Tool</CardTitle>
        <CardDescription>Migrate legacy prompt templates from code to the database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          This tool will migrate any prompt templates defined in code to the database. This is useful when transitioning
          from hardcoded prompts to the managed prompt system.
        </p>

        <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
          <div className="flex-1">
            <h3 className="font-medium">Code-based Templates</h3>
            <p className="text-sm text-muted-foreground">Defined in prompt-templates.ts</p>
          </div>
          <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <h3 className="font-medium">Database Templates</h3>
            <p className="text-sm text-muted-foreground">Stored in prompts table</p>
          </div>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.success && result.migratedCount !== undefined && (
                <span className="block mt-2">
                  {result.migratedCount === 0
                    ? "No new prompts were migrated. They may already exist in the database."
                    : `${result.migratedCount} prompt${result.migratedCount === 1 ? "" : "s"} migrated successfully.`}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigration} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating Prompts...
            </>
          ) : (
            "Migrate Prompts to Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
