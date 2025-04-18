import type React from "react"
import { AdminNav } from "@/components/admin/nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <AdminNav />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
