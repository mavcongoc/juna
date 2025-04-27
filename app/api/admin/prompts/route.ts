import { NextResponse } from "next/server"
import { AdminAuthService } from "@/lib/admin/admin-auth"
import { createApiSupabaseClient } from "@/lib/supabase-api"

export async function GET() {
  try {
    // Check if the user is an admin
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createApiSupabaseClient()
    const { data, error } = await supabase.from("prompts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ensure we're returning an array, even if empty
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching prompts:", error)
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if the user is an admin
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const supabase = createApiSupabaseClient()

    const { data: result, error } = await supabase.from("prompts").insert([data]).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating prompt:", error)
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 })
  }
}
