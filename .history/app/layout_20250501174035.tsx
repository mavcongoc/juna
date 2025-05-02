import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import MobileNav from "@/components/mobile-nav"
import { AuthProvider } from "@/contexts/auth-context"
// import ThemeDecoration from "@/components/theme-decoration" // Temporarily commented out
import { AuthLoadingIndicator } from "@/components/auth/auth-loading-indicator"
import { AuthDebug } from "@/components/auth/auth-debug"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Juna",
  description: "Smart mental health companion for reflection and self-insight",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {/* <ThemeDecoration /> */} {/* Temporarily commented out */}
            <Header />
            <AuthLoadingIndicator />
            {process.env.NODE_ENV === "development" && <AuthDebug />}
            <main className="min-h-[calc(100vh-64px)] pb-16 md:pb-0">{children}</main>
            <MobileNav />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
