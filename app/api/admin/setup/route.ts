import { NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get the Supabase service client (with admin privileges)
    const supabase = getServiceClient()

    if (!supabase) {
      return NextResponse.json({ error: "Failed to initialize Supabase client with admin privileges" }, { status: 500 })
    }

    // 1. Create the user in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    })

    if (userError || !userData.user) {
      console.error("Error creating user:", userError)
      return NextResponse.json({ error: userError?.message || "Failed to create user" }, { status: 500 })
    }

    // 2. Add the user to the admin_users table
    const { error: adminError } = await supabase.from("admin_users").insert({
      user_id: userData.user.id,
      is_admin: true,
      is_super_admin: true, // First admin is a super admin
    })

    if (adminError) {
      console.error("Error creating admin user:", adminError)

      // Try to delete the created user if admin record creation fails
      await supabase.auth.admin.deleteUser(userData.user.id)

      return NextResponse.json({ error: adminError.message || "Failed to create admin record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      userId: userData.user.id,
    })
  } catch (error) {
    console.error("Unexpected error in admin setup:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
