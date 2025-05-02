import { type NextRequest, NextResponse } from "next/server"
import { ClinicalProfileService } from "@/lib/services/clinical-profile-service"
import { getUserWithRole } from "@/lib/auth-utils" // Use the secure helper

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

    const domain = await ClinicalProfileService.addMentalHealthDomain(profile.id, body)

    return NextResponse.json({ domain })
  } catch (error) {
    console.error("Error adding mental health domain:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
