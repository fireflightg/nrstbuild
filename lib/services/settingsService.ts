import { db } from "@/lib/firebase/firestore"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type DocumentReference,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import type {
  StoreSettings,
  GeneralSettings,
  EmailSettings,
  SecuritySettings,
  AppearanceSettings,
  SettingsSection,
} from "@/types/settings"

// Default settings
const defaultGeneralSettings: GeneralSettings = {
  storeName: "",
  storeDescription: "",
  contactEmail: "",
  supportEmail: "",
  phoneNumber: "",
  address: {
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  },
  timezone: "America/New_York",
  currency: "USD",
  language: "en",
}

const defaultEmailSettings: EmailSettings = {
  notificationEmails: true,
  marketingEmails: true,
  orderConfirmationEmails: true,
  shippingConfirmationEmails: true,
  abandonedCartEmails: false,
  emailFooter: "",
  emailLogo: "",
  senderName: "",
  senderEmail: "",
}

const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: false,
  passwordResetRequired: false,
  sessionTimeout: 60,
  ipRestrictions: [],
  allowedLoginAttempts: 5,
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUppercase: true,
}

const defaultAppearanceSettings: AppearanceSettings = {
  theme: "system",
  primaryColor: "#4f46e5",
  accentColor: "#10b981",
  logo: "",
  favicon: "",
  customCss: "",
}

export const defaultSettings: Omit<StoreSettings, "id" | "storeId" | "updatedAt" | "createdAt"> = {
  general: defaultGeneralSettings,
  email: defaultEmailSettings,
  security: defaultSecuritySettings,
  appearance: defaultAppearanceSettings,
}

// Get settings document reference
const getSettingsRef = (storeId: string): DocumentReference => {
  return doc(db, "stores", storeId, "settings", "global")
}

// Get settings
export const getSettings = async (storeId: string): Promise<StoreSettings> => {
  const settingsRef = getSettingsRef(storeId)
  const settingsSnap = await getDoc(settingsRef)

  if (!settingsSnap.exists()) {
    // Create default settings if they don't exist
    const newSettings: StoreSettings = {
      id: "global",
      storeId,
      ...defaultSettings,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    }

    await setDoc(settingsRef, newSettings)
    return newSettings
  }

  return settingsSnap.data() as StoreSettings
}

// Update settings
export const updateSettings = async (
  storeId: string,
  section: SettingsSection,
  data: Partial<GeneralSettings | EmailSettings | SecuritySettings | AppearanceSettings>,
): Promise<void> => {
  const settingsRef = getSettingsRef(storeId)

  // First, ensure settings exist
  await getSettings(storeId)

  // Update only the specified section
  await updateDoc(settingsRef, {
    [section]: data,
    updatedAt: Date.now(),
  })
}

// Subscribe to settings changes
export const subscribeToSettings = (storeId: string, callback: (settings: StoreSettings) => void): Unsubscribe => {
  const settingsRef = getSettingsRef(storeId)

  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as StoreSettings)
    } else {
      // Create default settings if they don't exist
      getSettings(storeId).then(callback)
    }
  })
}

