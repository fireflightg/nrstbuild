import type React from "react"
// Import the RoleBadge component
import { RoleBadge } from "@/components/dashboard/role-badge"

// Add the RoleBadge to your DashboardHeader component
export function DashboardHeader({
  heading,
  text,
  children,
}: {
  heading: string
  text?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
          <RoleBadge />
        </div>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  )
}

