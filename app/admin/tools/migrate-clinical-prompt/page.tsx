import { MigrateClinicalPromptButton } from "@/components/admin/migrate-clinical-prompt-button"

export default function MigrateClinicalPromptPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-light mb-6">Migrate Clinical Profile Prompt</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="mb-4">
          This tool will migrate the clinical profile analysis prompt from hardcoded implementation to the database
          prompt management system.
        </p>

        <p className="mb-6 text-sm text-muted-foreground">
          After migration, you'll be able to view and edit the prompt in the Admin &gt; Prompts dashboard.
        </p>

        <MigrateClinicalPromptButton />
      </div>
    </div>
  )
}
