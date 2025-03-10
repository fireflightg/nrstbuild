export interface StoreSettings {
  id: string
  storeId: string
  general: GeneralSettings
  email: EmailSettings
  security: SecuritySettings
  appearance: AppearanceSettings
  updatedAt: number
  createdAt: number
}

export interface GeneralSettings {
  storeName: string
  storeDescription: string
  contactEmail: string
  supportEmail: string
  phoneNumber: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  timezone: string
  currency: string
  language: string
}

export interface EmailSettings {
  notificationEmails: boolean
  marketingEmails: boolean
  orderConfirmationEmails: boolean
  shippingConfirmationEmails: boolean
  abandonedCartEmails: boolean
  emailFooter: string
  emailLogo: string
  senderName: string
  senderEmail: string
}

export interface SecuritySettings {
  twoFactorAuth: boolean
  passwordResetRequired: boolean
  sessionTimeout: number // in minutes
  ipRestrictions: string[]
  allowedLoginAttempts: number
  passwordMinLength: number
  passwordRequireSpecialChar: boolean
  passwordRequireNumber: boolean
  passwordRequireUppercase: boolean
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system"
  primaryColor: string
  accentColor: string
  logo: string
  favicon: string
  customCss: string
}

export type SettingsSection = "general" | "email" | "security" | "appearance"

