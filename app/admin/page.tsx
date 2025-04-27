import { AdminAuthService } from "@/lib/admin/admin-auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  // Check if the user is an admin - UPDATED to use AdminAuthService directly
  const isAdmin = await AdminAuthService.isAdmin()

  if (!isAdmin) {
    // If not an admin, redirect to the home page
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-lg mb-4">Welcome to the admin dashboard.</p>
      <p>Use the navigation menu to access different admin features.</p>
    </div>
  )
}
