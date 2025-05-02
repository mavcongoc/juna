import { type NextRequest, NextResponse } from "next/server"
import { ClinicalProfileService } from "@/lib/services/clinical-profile-service"
import { getUserWithRole } from "@/lib/auth-utils" // Use the secure helper

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user securely
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Call service with authenticated user ID (RLS protects underlying data)
    const profile = await ClinicalProfileService.getProfileWithRelations(authenticatedUserId)

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
    // 1. Authenticate user securely
    const { user } = await getUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // 2. Get request body
    const body = await request.json()

    // 3. Call service with authenticated user ID (RLS protects underlying data)
    const profile = await ClinicalProfileService.getOrCreateProfile(authenticatedUserId)

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
