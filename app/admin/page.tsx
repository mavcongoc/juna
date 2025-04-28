import { redirect } from "next/navigation"

export default function AdminIndexPage() {
  // Redirect to the dashboard
  redirect("/admin/dashboard")
}
