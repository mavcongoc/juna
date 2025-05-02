import { NextResponse } from "next/server"
import { AdminAuthService } from "@/lib/admin/admin-auth"
import { createApiSupabaseClient } from "@/lib/supabase-api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if the user is an admin - UPDATED to use AdminAuthService directly
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createApiSupabaseClient()
    const { data, error } = await supabase.from("prompts").select("*").eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching prompt ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if the user is an admin - UPDATED to use AdminAuthService directly
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const supabase = createApiSupabaseClient()

    const { data: result, error } = await supabase.from("prompts").update(data).eq("id", params.id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error updating prompt ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if the user is an admin - UPDATED to use AdminAuthService directly
    const isAdmin = await AdminAuthService.isAdmin()

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createApiSupabaseClient()
    const { error } = await supabase.from("prompts").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting prompt ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 })
  }
}
