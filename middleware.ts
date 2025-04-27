import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  try {
    // Create a new middleware client for each request
    const supabase = createMiddlewareClient({
      req: request,
      res,
      options: {
        auth: {
          persistSession: true,
          debug: false, // Disable debug logs
        },
      },
    })

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Define route types
    const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
    const isProtectedRoute =
      request.nextUrl.pathname.startsWith("/journal") || request.nextUrl.pathname.startsWith("/profile")
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
    const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login"

    // Log authentication status for debugging
    console.log(
      `[MIDDLEWARE] Path: ${request.nextUrl.pathname}, Auth: ${!!session}, Protected: ${isProtectedRoute}, Admin: ${isAdminRoute}`,
    )

    // Prevent redirect loops by checking the URL
    const isRedirectLoop = request.nextUrl.searchParams.has("authRedirect")

    if (isRedirectLoop) {
      console.log("[MIDDLEWARE] Detected potential redirect loop, proceeding without redirect")
      return res
    }

    // If accessing protected routes without session, redirect to sign in
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
      redirectUrl.searchParams.set("authRedirect", "true") // Mark as redirected
      console.log(`[MIDDLEWARE] Redirecting unauthenticated user to: ${redirectUrl.toString()}`)
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing auth routes with session, redirect to journal
    if (isAuthRoute && session) {
      // Check if there's a redirectedFrom parameter
      const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom")
      const redirectUrl = new URL(redirectedFrom || "/journal", request.url)
      redirectUrl.searchParams.set("authRedirect", "true") // Mark as redirected
      console.log(`[MIDDLEWARE] Redirecting authenticated user to: ${redirectUrl.toString()}`)
      return NextResponse.redirect(redirectUrl)
    }

    // For admin routes, let the page handle the admin check
    // The admin layout will handle redirecting non-admin users
    if (isAdminRoute && !isAdminLoginRoute) {
      // We'll let the admin layout handle the admin check
      return res
    }

    return res
  } catch (error) {
    console.error("[MIDDLEWARE] Error:", error)
    // In case of error, proceed with the request rather than blocking
    return res
  }
}

export const config = {
  matcher: ["/journal/:path*", "/auth/:path*", "/profile/:path*", "/admin/:path*"],
}
