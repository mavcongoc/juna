"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLoginModal from "@/components/admin/admin-login-modal"
import { AdminAuthService } from "@/lib/admin/admin-auth"

export default function AdminLoginModalWrapper() {
  const [isOpen, setIsOpen] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  // Check if already admin on mount
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const isAdmin = await AdminAuthService.isAdminClient()

        if (isAdmin) {
          // Already admin, close modal and refresh
          setIsOpen(false)
          router.refresh()
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkAdminStatus()
  }, [router])

  const handleClose = () => {
    setIsOpen(false)
    // Redirect to home if modal is closed without login
    router.push("/")
  }

  if (isChecking) {
    return null // Don't show anything while checking
  }

  return <AdminLoginModal open={isOpen} onClose={handleClose} />
}
