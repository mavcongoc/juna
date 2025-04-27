import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth-utils"
import { ProfileOverview } from "@/components/clinical-profile/profile-overview"

export default async function ClinicalProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="!text-xl !font-light text-center bg-gradient-to-r from-purple-600 to-blue-400 bg-clip-text text-transparent mb-6">
        Clinical Profile
      </h1>

      <Suspense fallback={<p className="text-center">Loading profile...</p>}>
        <ProfileOverview userId={user.id} />
      </Suspense>
    </div>
  )
}
