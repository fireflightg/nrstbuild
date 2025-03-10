import { db } from "@/lib/firebase/admin"
import type { DecodedIdToken } from "firebase-admin/auth"

type Permission = "read" | "write" | "delete" | "admin"

export async function verifyPermission(
  user: DecodedIdToken,
  resourceType: string,
  resourceId: string,
  permission: Permission,
): Promise<boolean> {
  try {
    // If no user, no permissions
    if (!user || !user.uid) {
      return false
    }

    // Check if user is the resource owner
    if (resourceType === "store") {
      const storeDoc = await db.collection("stores").doc(resourceId).get()

      if (!storeDoc.exists) {
        return false
      }

      const storeData = storeDoc.data()

      // If user is the store owner, they have all permissions
      if (storeData?.ownerId === user.uid) {
        return true
      }

      // Check team membership and role for the store
      const teamMemberDoc = await db.collection("stores").doc(resourceId).collection("team").doc(user.uid).get()

      if (!teamMemberDoc.exists) {
        return false
      }

      const role = teamMemberDoc.data()?.role

      // Define permissions for each role
      const rolePermissions: Record<string, Permission[]> = {
        owner: ["read", "write", "delete", "admin"],
        editor: ["read", "write"],
        viewer: ["read"],
      }

      // Check if the user's role has the required permission
      return rolePermissions[role]?.includes(permission) || false
    }

    // For other resource types, implement specific permission logic
    if (resourceType === "product") {
      // Get the store ID for the product
      const productDoc = await db.collection("products").doc(resourceId).get()

      if (!productDoc.exists) {
        return false
      }

      const productData = productDoc.data()
      const storeId = productData?.storeId

      // Verify permissions for the store that owns this product
      return await verifyPermission(user, "store", storeId, permission)
    }

    // Default to false for unknown resource types
    return false
  } catch (error) {
    console.error("Error verifying permission:", error)
    return false
  }
}

