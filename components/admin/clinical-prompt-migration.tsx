"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function ClinicalPromptMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleMigrate = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/migrate-clinical-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to migrate clinical profile prompt")
      }

      setResult({
        success: true,
        message: data.message || "Clinical profile analysis prompt successfully migrated",
      })
    } catch (error) {
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
        <CardTitle>Clinical Profile Analysis Prompt</CardTitle>
        <CardDescription>
          Migrate the clinical profile analysis prompt from code to the database prompt management system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will create the clinical profile analysis prompt in the database if it doesn't already exist, allowing it
          to be managed through the admin prompt dashboard.
        </p>

        {result && (
          <Alert className={result.success ? "bg-green-50" : "bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigrate} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Migrating..." : "Migrate Prompt"}
        </Button>
      </CardFooter>
    </Card>
  )
}
