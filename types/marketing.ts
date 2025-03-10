import type { Timestamp } from "firebase/firestore"

export interface Subscriber {
  id: string
  email: string
  firstName?: string
  lastName?: string
  source?: string
  subscribedAt: Date | Timestamp
  unsubscribedAt?: Date | Timestamp
  status: "subscribed" | "unsubscribed" | "bounced"
  tags: string[]
  customFields?: Record<string, any>
}

export interface SubscriberList {
  id: string
  name: string
  description?: string
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  subscriberCount: number
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  previewText?: string
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  createdBy: string
  category: "newsletter" | "promotion" | "announcement" | "welcome" | "other"
  status: "draft" | "active" | "archived"
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  templateId: string
  listIds: string[]
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled"
  scheduledAt?: Date | Timestamp
  sentAt?: Date | Timestamp
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  createdBy: string
  stats?: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    unsubscribed: number
    bounced: number
    complaints: number
  }
  mailjetId?: string // ID returned from Mailjet API
}

export interface Coupon {
  id: string
  code: string
  type: "percentage" | "fixed" | "free_shipping"
  value: number // Percentage or fixed amount
  minPurchase?: number
  maxDiscount?: number
  startDate: Date | Timestamp
  endDate?: Date | Timestamp
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  createdBy: string
  status: "active" | "expired" | "disabled"
  usageLimit?: number
  usedCount: number
  products?: string[] // Product IDs this coupon applies to (if empty, applies to all)
  excludedProducts?: string[] // Product IDs excluded from this coupon
  customerEmails?: string[] // If specified, only these customers can use the coupon
  oneTimeUse: boolean // If true, each customer can only use once
}

export interface CouponUsage {
  id: string
  couponId: string
  couponCode: string
  orderId: string
  customerId: string
  usedAt: Date | Timestamp
  discountAmount: number
  orderTotal: number
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  error?: string
  discountAmount?: number
}

