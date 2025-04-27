import { Suspense } from "react"
import { PromptService } from "@/lib/admin/prompt-service"
import { PromptEditForm } from "@/components/admin/prompt-edit-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function NewPromptContent() {
  // Get all categories for the dropdown
  const categories = await PromptService.getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Prompt</h1>
        <p className="text-muted-foreground">Define a new system prompt for your AI interactions</p>
      </div>

      <PromptEditForm categories={categories} />
    </div>
  )
}

export default function NewPromptPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/prompts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prompts
          </Button>
        </Link>
      </div>

      <Suspense fallback={<NewPromptSkeleton />}>
        <NewPromptContent />
      </Suspense>
    </div>
  )
}

function NewPromptSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
      </div>
    </div>
  )
}
