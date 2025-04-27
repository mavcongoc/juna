import { type NextRequest, NextResponse } from "next/server"
import { ClinicalProfileService } from "@/lib/services/clinical-profile-service"
import { getUserFromRequest } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await ClinicalProfileService.getProfileWithRelations(user.id)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching clinical profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const updatedProfile = await ClinicalProfileService.updateProfile(profile.id, body)

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error("Error updating clinical profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
