"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PermissionGuardProps {
  children: ReactNode
  requiredAction?: string
  requiredSubject?: string
  requiredRole?: "owner" | "editor" | "viewer"
  fallback?: ReactNode
}

export function PermissionGuard({
  children,
  requiredAction,
  requiredSubject,
  requiredRole,
  fallback = (
    <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
      You don't have permission to view this page.
    </div>
  ),
}: PermissionGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const storeId = params?.storeId as string

  const { can, role, loading: permissionsLoading } = usePermissions(storeId)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (!permissionsLoading && user) {
      let permitted = true

      // Check role-based permission
      if (requiredRole && role !== requiredRole && role !== "owner") {
        permitted = false
      }

      // Check action/subject permission
      if (requiredAction && requiredSubject) {
        permitted = can(requiredAction, requiredSubject)
      }

      setHasPermission(permitted)
    }
  }, [user, authLoading, permissionsLoading, role, can, requiredAction, requiredSubject, requiredRole, router])

  if (authLoading || permissionsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

