import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { PromptService } from "@/lib/admin/prompt-service"
import PromptEditForm from "@/components/admin/prompt-edit-form"
import PromptVersionHistory from "@/components/admin/prompt-version-history"
import PromptTestInterface from "@/components/admin/prompt-test-interface"
import PromptMetricsDashboard from "@/components/admin/prompt-metrics-dashboard"
import { checkAdminAuth } from "@/lib/admin/admin-auth"

export const dynamic = "force-dynamic"

async function getPrompt(id: string) {
  const prompt = await PromptService.getPromptById(id)
  if (!prompt) {
    notFound()
  }
  return prompt
}

export default async function PromptDetailPage({ params }: { params: { id: string } }) {
  const authResult = await checkAdminAuth()
  if (!authResult.isAuthenticated) {
    return <div>Unauthorized. Please sign in as an admin.</div>
  }

  const prompt = await getPrompt(params.id)

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">{prompt.name}</h1>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="pt-4">
          <PromptEditForm prompt={prompt} adminUserId={authResult.user?.id || ""} />
        </TabsContent>

        <TabsContent value="versions" className="pt-4">
          <PromptVersionHistory
            promptId={prompt.id}
            versions={prompt.versions}
            adminUserId={authResult.user?.id || ""}
          />
        </TabsContent>

        <TabsContent value="test" className="pt-4">
          <PromptTestInterface prompt={prompt} adminUserId={authResult.user?.id || ""} />
        </TabsContent>

        <TabsContent value="metrics" className="pt-4">
          <Suspense fallback={<Skeleton className="w-full h-[500px]" />}>
            <PromptMetricsDashboard promptId={prompt.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
