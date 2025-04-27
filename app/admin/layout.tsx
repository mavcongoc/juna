import type React from "react"
import { Suspense } from "react"
import { AdminNav } from "@/components/admin/admin-nav"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Force dynamic rendering to ensure fresh auth checks
export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Simple server-side admin check
  const isAdmin = await checkAdminAccess()

  // If not admin, redirect to admin login
  if (!isAdmin) {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background md:block">
          <div className="flex h-full flex-col">
            <AdminNav />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          <Suspense fallback={<div className="p-8">Loading...</div>}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}

// Simple function to check if the current user is an admin
async function checkAdminAccess() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Get current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return false
    }

    // Check if user is in admin_users table
    const { data, error } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", session.user.id)
      .single()

    if (error || !data || !data.is_admin) {
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking admin access:", error)
    return false
  }
}
