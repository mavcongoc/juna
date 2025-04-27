"use client"

import { useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DiffEditor } from "@monaco-editor/react"
import type { PromptVersion } from "@/lib/admin/types"

interface PromptVersionHistoryProps {
  promptId: string
  versions: PromptVersion[]
  adminUserId: string
}

export default function PromptVersionHistory({ promptId, versions, adminUserId }: PromptVersionHistoryProps) {
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const handleRestore = async (version: PromptVersion) => {
    setSelectedVersion(version)
    setIsConfirmOpen(true)
  }

  const confirmRestore = async () => {
    if (!selectedVersion) return

    setIsRestoring(true)
    try {
      const response = await fetch(`/api/admin/prompts/${promptId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId: selectedVersion.id,
          adminUserId,
          changeNotes: `Restored version from ${format(new Date(selectedVersion.created_at), "PPP")}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to restore version")
      }

      toast({
        title: "Version restored",
        description: "The prompt has been restored to the selected version.",
      })

      // Refresh the page to show the updated prompt
      window.location.reload()
    } catch (error) {
      console.error("Error restoring version:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore version. Please try again.",
      })
    } finally {
      setIsRestoring(false)
      setIsConfirmOpen(false)
    }
  }

  const toggleAccordion = (versionId: string) => {
    setExpandedItems((prev) =>
      prev.includes(versionId) ? prev.filter((id) => id !== versionId) : [...prev, versionId],
    )
  }

  // Find the current version (most recent) to compare with
  const currentVersion = sortedVersions.length > 0 ? sortedVersions[0] : null

  if (versions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No version history available.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This prompt has {versions.length} version{versions.length !== 1 ? "s" : ""}. You can view changes and restore
        previous versions if needed.
      </p>

      <Accordion type="multiple" value={expandedItems} className="w-full">
        {sortedVersions.map((version, index) => (
          <AccordionItem key={version.id} value={version.id} className="border rounded-md mb-2 overflow-hidden">
            <AccordionTrigger onClick={() => toggleAccordion(version.id)} className="px-4 py-2 hover:no-underline">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left">
                <div>
                  <span className="font-medium">
                    {index === 0 ? "Current Version" : `Version ${sortedVersions.length - index}`}
                  </span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                  </span>
                </div>
                {version.change_notes && (
                  <span className="text-sm text-muted-foreground truncate max-w-md">{version.change_notes}</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <div className="p-4 border-t bg-muted/30">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">Created</h4>
                  <p className="text-sm">{format(new Date(version.created_at), "PPpp")}</p>
                </div>

                {version.change_notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Change Notes</h4>
                    <p className="text-sm">{version.change_notes}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">System Prompt</h4>
                  {index > 0 && currentVersion ? (
                    <div className="h-[300px] border rounded-md overflow-hidden">
                      <DiffEditor
                        height="300px"
                        original={version.system_prompt}
                        modified={currentVersion.system_prompt}
                        language="markdown"
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          renderSideBySide: false,
                          minimap: { enabled: false },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap">{version.system_prompt}</pre>
                    </div>
                  )}
                </div>

                {index > 0 && (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => handleRestore(version)} disabled={isRestoring}>
                      Restore This Version
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore previous version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new version of the prompt using the content from the selected version. The current
              version will be preserved in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} disabled={isRestoring}>
              {isRestoring ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
