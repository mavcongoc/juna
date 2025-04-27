import { getServiceClient } from "../supabase-client"

/**
 * Add an admin user to the system
 * @param {string} email - The email of the admin user
 * @param {boolean} isSuperAdmin - Whether the user should be a super admin
 * @returns {Promise<boolean>} True if the user was added successfully, false otherwise
 */
export async function addAdminUser(email: string, isSuperAdmin = false): Promise<boolean> {
  try {
    const supabase = getServiceClient()

    // Check if user already exists in auth
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError) {
      console.error(`Error checking if user ${email} exists:`, userError)
      return false
    }

    let userId = existingUser?.user?.id

    // If user doesn't exist in auth, create them
    if (!userId) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { is_admin: true },
      })

      if (createError) {
        console.error(`Error creating user ${email}:`, createError)
        return false
      }

      userId = newUser.user.id
    }

    // Check if user already exists in admin_users table
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (adminCheckError) {
      console.error(`Error checking if admin user ${email} exists:`, adminCheckError)
      return false
    }

    // If user already exists in admin_users table, update super admin status if needed
    if (existingAdmin) {
      if (isSuperAdmin) {
        const { error: updateError } = await supabase
          .from("admin_users")
          .update({ is_super_admin: true })
          .eq("id", existingAdmin.id)

        if (updateError) {
          console.error(`Error updating admin user ${email}:`, updateError)
          return false
        }
      }
      return true
    }

    // Insert new admin user
    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: userId,
      email,
      is_super_admin: isSuperAdmin,
    })

    if (insertError) {
      console.error(`Error adding admin user ${email}:`, insertError)
      return false
    }

    console.log(`Admin user ${email} added successfully`)
    return true
  } catch (error) {
    console.error(`Unexpected error in addAdminUser for ${email}:`, error)
    return false
  }
}
