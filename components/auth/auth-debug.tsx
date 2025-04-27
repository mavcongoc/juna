"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"

export function AuthDebug() {
  const { user, session, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs">
        Auth Debug
      </button>

      {isOpen && (
        <div className="absolute bottom-10 right-0 bg-gray-900 text-white p-4 rounded-md shadow-lg w-80 text-xs">
          <h3 className="font-bold mb-2">Auth State</h3>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Loading:</span> {isLoading ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-semibold">Authenticated:</span> {user ? "Yes" : "No"}
            </div>
            {user && (
              <>
                <div>
                  <span className="font-semibold">User ID:</span> {user.id}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {user.email}
                </div>
              </>
            )}
            <div>
              <span className="font-semibold">Session:</span> {session ? "Valid" : "None"}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
