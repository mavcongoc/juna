import type React from "react"

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <main className="flex-1">{children}</main>
    </div>
  )
}
