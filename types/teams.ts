export type UserRole = "owner" | "editor" | "viewer"

export interface TeamMember {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole
  invitedAt: Date
  joinedAt?: Date
  invitedBy: string
}

export interface TeamInvitation {
  id: string
  email: string
  role: UserRole
  teamId: string
  storeId?: string
  invitedBy: string
  invitedAt: Date
  status: "pending" | "accepted" | "declined"
  expiresAt: Date
}

export interface Permission {
  action: string
  subject: string
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    // Full access - owners can do everything
    { action: "manage", subject: "all" },
  ],
  editor: [
    // Content permissions
    { action: "read", subject: "content" },
    { action: "create", subject: "content" },
    { action: "update", subject: "content" },
    { action: "delete", subject: "content" },

    // Products and inventory
    { action: "read", subject: "product" },
    { action: "create", subject: "product" },
    { action: "update", subject: "product" },
    { action: "delete", subject: "product" },

    // Orders management
    { action: "read", subject: "order" },
    { action: "update", subject: "order" },

    // Appointments
    { action: "read", subject: "appointment" },
    { action: "create", subject: "appointment" },
    { action: "update", subject: "appointment" },

    // Analytics read-only
    { action: "read", subject: "analytics" },

    // Limited settings
    { action: "read", subject: "settings" },
    { action: "update", subject: "settings.appearance" },
  ],
  viewer: [
    // Read-only permissions
    { action: "read", subject: "content" },
    { action: "read", subject: "product" },
    { action: "read", subject: "order" },
    { action: "read", subject: "appointment" },
    { action: "read", subject: "analytics" },
    { action: "read", subject: "settings" },
  ],
}

