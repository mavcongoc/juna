import { NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/auth-utils' // Import the helper

export const dynamic = 'force-dynamic' // Ensure this route is always dynamic

export async function GET() {
  try {
    // Use the server-side helper to get the user and their role
    const { user, role } = await getUserWithRole();

    if (!user) {
      // If no user is authenticated, return 401 Unauthorized
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return the role (which might be null if not found or error occurred during fetch)
    return NextResponse.json({ role });

  } catch (error: any) {
    console.error("[API /api/auth/role] Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}