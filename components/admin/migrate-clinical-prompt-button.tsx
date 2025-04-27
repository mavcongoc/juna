"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { migrateClinicalPromptAction } from "@/lib/actions/migrate-clinical-prompt"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function MigrateClinicalPromptButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleMigrate = async () => {
    try {
      setIsLoading(true)

      const result = await migrateClinicalPromptAction()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleMigrate} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Migrating..." : "Migrate Clinical Profile Prompt"}
    </Button>
  )
}
