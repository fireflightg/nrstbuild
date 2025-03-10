"use server"

import { revalidatePath } from "next/cache"
import { getSettings, updateSettings } from "@/lib/services/settingsService"
import type { GeneralSettings, EmailSettings, SecuritySettings, AppearanceSettings } from "@/types/settings"
import { getCurrentUser } from "@/lib/firebase/auth"
import { getStoreById } from "@/lib/services/storeService"

// Helper to validate user has permission to update settings
const validatePermission = async (storeId: string) => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const store = await getStoreById(storeId)
  if (!store) {
    throw new Error("Store not found")
  }

  // Check if user is owner or has admin role
  if (store.ownerId !== user.uid) {
    const teamMember = await getTeamMember(storeId, user.uid)
    if (!teamMember || teamMember.role !== "admin") {
      throw new Error("Insufficient permissions")
    }
  }

  return user
}

// Get team member
const getTeamMember = async (storeId: string, userId: string) => {
  // Implementation depends on your team service
  // This is a placeholder
  return null
}

// Get settings
export async function getStoreSettings(storeId: string) {
  try {
    await validatePermission(storeId)
    return await getSettings(storeId)
  } catch (error) {
    console.error("Error getting settings:", error)
    throw error
  }
}

// Update general settings
export async function updateGeneralSettings(storeId: string, data: Partial<GeneralSettings>) {
  try {
    await validatePermission(storeId)
    await updateSettings(storeId, "general", data)
    revalidatePath(`/dashboard/${storeId}/settings`)
    return { success: true }
  } catch (error) {
    console.error("Error updating general settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Update email settings
export async function updateEmailSettings(storeId: string, data: Partial<EmailSettings>) {
  try {
    await validatePermission(storeId)
    await updateSettings(storeId, "email", data)
    revalidatePath(`/dashboard/${storeId}/settings`)
    return { success: true }
  } catch (error) {
    console.error("Error updating email settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Update security settings
export async function updateSecuritySettings(storeId: string, data: Partial<SecuritySettings>) {
  try {
    await validatePermission(storeId)
    await updateSettings(storeId, "security", data)
    revalidatePath(`/dashboard/${storeId}/settings`)
    return { success: true }
  } catch (error) {
    console.error("Error updating security settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Update appearance settings
export async function updateAppearanceSettings(storeId: string, data: Partial<AppearanceSettings>) {
  try {
    await validatePermission(storeId)
    await updateSettings(storeId, "appearance", data)
    revalidatePath(`/dashboard/${storeId}/settings`)
    return { success: true }
  } catch (error) {
    console.error("Error updating appearance settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

