import { NextResponse } from "next/server"
import { AdminAuthService } from "@/lib/admin/admin-auth"
import { runMigrations } from "@/lib/admin/db-migration"
import { seedPrompts } from "@/lib/admin/seed-prompts"

export async function POST() {
  try {
    // Check if the user is an admin - UPDATED to use AdminAuthService directly
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run migrations
    const migrationResult = await runMigrations()

    // Seed prompts
    const seedResult = await seedPrompts()

    return NextResponse.json({
      success: true,
      migrations: migrationResult,
      seeding: seedResult,
    })
  } catch (error) {
    console.error("Error initializing admin:", error)
    return NextResponse.json({ error: "Failed to initialize admin" }, { status: 500 })
  }
}
