import { type NextRequest, NextResponse } from "next/server"
import { ClinicalProfileService } from "@/lib/services/clinical-profile-service"
import { getUserFromRequest } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const profile = await ClinicalProfileService.getOrCreateProfile(user.id)

    if (!profile) {
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    const milestone = await ClinicalProfileService.addGrowthMilestone(profile.id, body)

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error("Error adding growth milestone:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
