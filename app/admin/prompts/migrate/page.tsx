import { ClinicalPromptMigration } from "@/components/admin/clinical-prompt-migration"

export default function MigratePromptsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Migrate Prompts</h1>

      <div className="grid gap-8">
        <ClinicalPromptMigration />
        {/* Other migration components can be added here */}
      </div>
    </div>
  )
}
