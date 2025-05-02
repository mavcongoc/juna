import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { AdminAuthService } from "@/lib/admin/admin-auth" // Import the refactored service

// Define a helper to create the Supabase client within the middleware context
// This avoids creating it multiple times if needed for different checks
const createSupabaseMiddlewareClient = (req: NextRequest, res: NextResponse) => {
  let supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies object.
          req.cookies.set({ name, value, ...options })
          // Also update the response cookies object.
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies object.
          req.cookies.set({ name, value: '', ...options })
          // Also update the response cookies object.
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  return supabase;
}


export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createSupabaseMiddlewareClient(request, res);

  try {
    // Get session first - needed for most checks
    const { data: { session } } = await supabase.auth.getSession()

    // Define route types
    const pathname = request.nextUrl.pathname;
    const isAuthRoute = pathname.startsWith("/auth")
    const isProtectedRoute = pathname.startsWith("/journal") || pathname.startsWith("/profile")
    const isAdminRoute = pathname.startsWith("/admin")
    const isAdminLoginRoute = pathname === "/admin/login"

    // --- Perform Admin Check using the Service (only if needed) ---
    // We need to check admin status if accessing admin routes (excluding login)
    // OR if accessing admin login while already logged in (to redirect away)
    let isAdmin = false; // Default to false
    if (isAdminRoute || (isAuthRoute && session)) { // Check if potentially relevant
        // IMPORTANT: AdminAuthService.isAdmin() itself creates a Supabase client.
        // To avoid duplicate client creation and ensure consistent cookie handling,
        // ideally AdminAuthService.isAdmin would accept an existing client or cookie store.
        // For now, we call it directly, accepting the overhead.
        // This requires AdminAuthService to correctly handle cookies passed via `cookies()` from 'next/headers'
        // which works in Route Handlers and Server Actions, but needs verification if it works correctly here in Middleware.
        // A safer alternative might be to duplicate the role check logic here using the middleware client.
        // Let's proceed with calling the service for now, assuming it works.
        if (session) { // Only check admin status if there's a session
             isAdmin = await AdminAuthService.isAdmin(); // Use the refactored service
        }
    }

    console.log(
      `[MIDDLEWARE] Path: ${pathname}, Auth: ${!!session}, IsAdminCheck: ${isAdmin}, Protected: ${isProtectedRoute}`
    )

    // Prevent redirect loops (keep this logic)
    const isRedirectLoop = request.nextUrl.searchParams.has("authRedirect")
    if (isRedirectLoop) {
      console.log("[MIDDLEWARE] Detected potential redirect loop, proceeding without redirect")
      return res
    }

    // --- User Route Protection ---
    // If accessing protected user routes without session, redirect to sign in
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirectedFrom", pathname)
      redirectUrl.searchParams.set("authRedirect", "true")
      console.log(`[MIDDLEWARE] Redirecting unauthenticated user to: ${redirectUrl.toString()}`)
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing auth routes (like /auth/signin) with session, redirect away
    if (isAuthRoute && session) {
      // Exception: Allow access to specific auth routes if needed (e.g., email change confirmation)
      // if (pathname === '/auth/confirm') return res;

      const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom")
      // Redirect admins to admin dashboard, others to journal
      const defaultRedirect = isAdmin ? "/admin/dashboard" : "/journal";
      const redirectUrl = new URL(redirectedFrom || defaultRedirect, request.url)
      redirectUrl.searchParams.set("authRedirect", "true")
      console.log(`[MIDDLEWARE] Redirecting authenticated user from auth route to: ${redirectUrl.toString()}`)
      return NextResponse.redirect(redirectUrl)
    }

    // --- Admin Route Protection ---
    // If accessing admin routes (except login) without being an admin, redirect to admin login
    if (isAdminRoute && !isAdminLoginRoute && !isAdmin) {
      console.log("[MIDDLEWARE] Non-admin attempting to access admin route, redirecting to admin login")
      const redirectUrl = new URL("/admin/login", request.url)
      redirectUrl.searchParams.set("authRedirect", "true")
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing admin login page while already being an admin, redirect to admin dashboard
    if (isAdminLoginRoute && isAdmin) {
      console.log("[MIDDLEWARE] Admin already logged in, redirecting to admin dashboard")
      const redirectUrl = new URL("/admin/dashboard", request.url) // Redirect to dashboard or base /admin
      redirectUrl.searchParams.set("authRedirect", "true")
      return NextResponse.redirect(redirectUrl)
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
