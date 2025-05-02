import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js" // Use standard createClient

// Helper function to create a Supabase client with the Service Role Key
// IMPORTANT: Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
// This should ONLY be used in secure server-side environments like this API route.
const createAdminSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase URL or Service Role Key is missing from environment variables.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}


export async function POST(request: Request) {
  try {
    // --- Authorization Check (Crucial for Setup Route) ---
    // This route should ideally only run once or be protected.
    // Check if a super_admin already exists. If so, deny access.
    const checkSupabase = createAdminSupabaseClient(); // Use admin client for check
    const { data: existingSuperAdmin, error: checkError } = await checkSupabase
        .from('user_roles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1)
        .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully

    if (checkError) {
        console.error("Error checking for existing super admin:", checkError);
        return NextResponse.json({ error: "Failed to verify setup status" }, { status: 500 });
    }

    if (existingSuperAdmin) {
        console.warn("Attempted to run admin setup when a super admin already exists.");
        return NextResponse.json({ error: "Setup has already been completed." }, { status: 403 }); // Forbidden
    }
    // --- End Authorization Check ---


    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get the Supabase service client (with admin privileges)
    const supabaseAdmin = createAdminSupabaseClient();

    // 1. Create the user in Supabase Auth using the admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    })

    if (userError || !userData.user) {
      console.error("Error creating user:", userError)
      // Check for specific errors like "User already registered"
      if (userError?.message.includes("already registered")) {
          return NextResponse.json({ error: "User with this email already exists." }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: userError?.message || "Failed to create user" }, { status: 500 })
    }

    const newUserId = userData.user.id;

    // 2. Add the user to the user_roles table with 'super_admin' role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUserId,
      role: 'super_admin'
    })

    if (roleError) {
      console.error(`Error assigning super_admin role to user ${newUserId}:`, roleError)

      // Try to delete the created auth user if role assignment fails
      try {
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          console.log(`Successfully cleaned up auth user ${newUserId} after role assignment failure.`);
      } catch (cleanupError) {
          console.error(`Failed to cleanup auth user ${newUserId} after role assignment error:`, cleanupError);
          // Log this critical failure, manual cleanup might be needed
      }

      return NextResponse.json({ error: roleError.message || "Failed to assign super_admin role" }, { status: 500 })
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
