"use client"

import { useParams } from "next/navigation"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export function RoleBadge() {
  const { storeId } = useParams()
  const { role, loading } = usePermissions(storeId as string)

  if (loading || !role) return null

  const roleColors = {
    owner: "bg-primary text-primary-foreground",
    editor: "bg-blue-500 text-white",
    viewer: "bg-gray-500 text-white",
  }

  const roleDescriptions = {
    owner: "Full access to all features including billing and team management",
    editor: "Can modify content, products, and orders but cannot access billing or team settings",
    viewer: "Read-only access to content and analytics",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Badge className={roleColors[role] || "bg-gray-500"}>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{roleDescriptions[role]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

