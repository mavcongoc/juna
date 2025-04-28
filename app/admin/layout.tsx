import type React from "react"
import { Suspense } from "react"
import { AdminNav } from "@/components/admin/admin-nav"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { ThemeProvider } from "@/components/theme-provider"

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <AdminHeader />
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
        </ThemeProvider>
      </body>
    </html>
  )
}

// Simple function to check if the current user is an admin
async function checkAdminAccess() {
  try {
    // First check for admin session cookie
    const cookieStore = cookies()
    const adminSessionCookie = cookieStore.get("admin_session")

    if (adminSessionCookie?.value === "true") {
      return true
    }

    // If no cookie, check the database
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

    // Set the admin session cookie for future requests
    cookieStore.set("admin_session", "true", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return true
  } catch (error) {
    console.error("Error checking admin access:", error)
    return false
  }
}
