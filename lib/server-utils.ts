import { cookies, headers } from "next/headers"

// Server-only utilities for working with headers and cookies
export function getRequestHeaders() {
  return headers()
}

export function getRequestCookies() {
  return cookies()
}

// This function should only be called from server components or API routes
export function getSessionCookie() {
  const cookieStore = cookies()
  return cookieStore.get("sb-auth-token")
}
