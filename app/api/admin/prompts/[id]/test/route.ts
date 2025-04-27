import { type NextRequest, NextResponse } from "next/server"
import { AdminAuthService } from "@/lib/admin/admin-auth"
import { getSupabaseClient } from "@/lib/supabase-client"
import { getOpenAI } from "@/lib/openai"

/**
 * POST /api/admin/prompts/:id/test
 * Test a prompt
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if the user is authenticated
    const supabase = getSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user is an admin
    const isAdmin = await AdminAuthService.isAdmin(session.user.id)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the admin user ID
    const adminUserId = await AdminAuthService.getAdminUserId(session.user.id)

    if (!adminUserId) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    // Parse the request body
    const body = await request.json()
    const { input, promptVersionId, variables = {} } = body

    if (!input || !promptVersionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the prompt version
    const { data: promptVersion, error } = await supabase
      .from("prompt_versions")
      .select("*")
      .eq("id", promptVersionId)
      .single()

    if (error || !promptVersion) {
      return NextResponse.json({ error: "Prompt version not found" }, { status: 404 })
    }

    // Replace variables in the prompt template
    let promptTemplate = promptVersion.template

    // Replace variables in the prompt template
    Object.entries(variables).forEach(([key, value]) => {
      promptTemplate = promptTemplate.replace(new RegExp(`{{${key}}}`, "g"), String(value))
    })

    // Replace the input variable
    promptTemplate = promptTemplate.replace(/{{input}}/g, input)

    // Get the OpenAI client
    const openai = getOpenAI()

    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: promptTemplate,
        },
        {
          role: "user",
          content: input,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Get the response
    const response = completion.choices[0].message.content

    // Log the test in the database
    await supabase.from("prompt_tests").insert({
      prompt_version_id: promptVersionId,
      admin_user_id: adminUserId,
      input,
      variables: variables,
      response,
      created_at: new Date().toISOString(),
    })

    // Return the response
    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error testing prompt:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
