// This file configures the dynamic route segment to only match valid UUIDs
export function generateStaticParams() {
  return []
}

// Add a dynamic segment constraint to ensure 'talk' isn't matched as an ID
export const dynamicParams = true

// Add a matcher function to validate the ID parameter
export function validateSegment(segment) {
  // UUID regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // Reserved route names that should not be treated as IDs
  const reservedRoutes = ["talk", "insights", "actions", "history"]

  // If the segment is a reserved route name, it's not a valid ID
  if (reservedRoutes.includes(segment.toLowerCase())) {
    return false
  }

  // Otherwise, check if it looks like a UUID
  return segment.length > 8
}
