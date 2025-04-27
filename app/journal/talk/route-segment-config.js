// This file ensures that /journal/talk is properly recognized as its own route
export const dynamic = "force-dynamic"

// Explicitly mark this as a route, not a dynamic parameter
export const isRoute = true

// Explicitly name the segment
export const routeSegment = "talk"
