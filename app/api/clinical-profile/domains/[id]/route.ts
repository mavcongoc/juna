import { type NextRequest, NextResponse } from "next/server"
import { ClinicalProfileService } from "@/lib/services/clinical-profile-service"
import { getUserFromRequest } from "@/lib/auth-utils"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const domain = await ClinicalProfileService.updateMentalHealthDomain(params.id, body)

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    return NextResponse.json({ domain })
  } catch (error) {
    console.error("Error updating mental health domain:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
