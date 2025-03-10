"use server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase/admin"
import type { UserRole } from "@/types/teams"

// Add a helper function to check permissions
async function checkPermission(storeId: string, action: string, subject: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { allowed: false, error: "Unauthorized" }
  }

  // Check if user is store owner
  const storeRef = db.collection("stores").doc(storeId)
  const storeDoc = await storeRef.get()

  if (!storeDoc.exists) {
    return { allowed: false, error: "Store not found" }
  }

  const storeData = storeDoc.data()

  // Store owners have all permissions
  if (storeData?.ownerId === session.user.id) {
    return { allowed: true, role: "owner" as UserRole }
  }

  // Check team membership and role
  const teamMemberRef = storeRef.collection("team").doc(session.user.id)
  const teamMemberDoc = await teamMemberRef.get()

  if (!teamMemberDoc.exists) {
    return { allowed: false, error: "Not a team member" }
  }

  const role = teamMemberDoc.data()?.role as UserRole

  // Define permissions for each role
  const permissions = {
    owner: ["manage:all"],
    editor: ["create:product", "read:product", "update:product", "delete:product"],
    viewer: ["read:product"],
  }

  const hasPermission = permissions[role].some((p) => {
    const [permAction, permSubject] = p.split(":")
    return (
      (permAction === "manage" && (permSubject === "all" || permSubject === subject)) ||
      (permAction === action && (permSubject === "all" || permSubject === subject))
    )
  })

  return {
    allowed: hasPermission,
    role,
    error: hasPermission ? null : "Insufficient permissions",
  }
}

// Then use this in your server actions
export async function createProduct(storeId: string, data: any) {
  const { allowed, error } = await checkPermission(storeId, "create", "product")

  if (!allowed) {
    return { success: false, error }
  }

  // Proceed with creating the product
  // ...
}

export async function updateProduct(storeId: string, productId: string, data: any) {
  const { allowed, error } = await checkPermission(storeId, "update", "product")

  if (!allowed) {
    return { success: false, error }
  }

  // Proceed with updating the product
  // ...
}

export async function deleteProduct(storeId: string, productId: string) {
  const { allowed, error } = await checkPermission(storeId, "delete", "product")

  if (!allowed) {
    return { success: false, error }
  }

  // Proceed with deleting the product
  // ...
}

