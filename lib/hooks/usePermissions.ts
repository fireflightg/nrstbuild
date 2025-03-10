"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { teamService } from "@/lib/services/teamService"
import { type Permission, ROLE_PERMISSIONS, type UserRole } from "@/types/teams"

export function usePermissions(storeId: string) {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    async function fetchUserRole() {
      if (!user || !storeId) {
        setLoading(false)
        return
      }

      try {
        const fetchedRole = await teamService.getUserRole(storeId, user.uid)
        setRole(fetchedRole)

        if (fetchedRole) {
          setPermissions(ROLE_PERMISSIONS[fetchedRole])
        } else {
          setPermissions([])
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user, storeId])

  const can = (action: string, subject: string): boolean => {
    if (!permissions.length) return false

    // Check for wildcard permissions
    const hasWildcard = permissions.some(
      (p) =>
        (p.action === "manage" && p.subject === "all") ||
        (p.action === "manage" && p.subject === subject) ||
        (p.action === action && p.subject === "all"),
    )

    if (hasWildcard) return true

    // Check for exact permission
    return permissions.some((p) => p.action === action && p.subject === subject)
  }

  const isOwner = role === "owner"
  const isEditor = role === "editor"
  const isViewer = role === "viewer"

  return {
    can,
    role,
    isOwner,
    isEditor,
    isViewer,
    loading,
    permissions,
  }
}

