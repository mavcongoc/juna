import { Suspense } from "react"
import { PromptService } from "@/lib/admin/prompt-service"
import { checkAdminAuth } from "@/lib/admin/admin-auth"
import { PromptTestingInterface } from "@/components/admin/prompt-testing-interface"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function PromptTestContent() {
  // Get all prompts for the dropdown
  const prompts = await PromptService.getAllPrompts()

  return <PromptTestingInterface prompts={prompts} />
}

export default async function PromptTestPage() {
  const authResult = await checkAdminAuth()
  if (!authResult.isAuthenticated) {
    return <div>Unauthorized. Please sign in as an admin.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/prompts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prompts
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Prompt Testing Lab</h1>
        <p className="text-muted-foreground">Test your prompts with different inputs before deploying</p>
      </div>

      <Suspense fallback={<PromptTestSkeleton />}>
        <PromptTestContent />
      </Suspense>
    </div>
  )
}

function PromptTestSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}
