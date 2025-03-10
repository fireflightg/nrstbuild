"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { mailjetService } from "@/lib/services/mailjetService"
import { marketingService } from "@/lib/services/marketingService"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase/admin"
import type { Subscriber, SubscriberList, EmailTemplate, Coupon } from "@/types/marketing"

// Helper function to check permissions
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
    return { allowed: true, role: "owner" }
  }

  // Check team membership and role
  const teamMemberRef = storeRef.collection("team").doc(session.user.id)
  const teamMemberDoc = await teamMemberRef.get()

  if (!teamMemberDoc.exists) {
    return { allowed: false, error: "Not a team member" }
  }

  const role = teamMemberDoc.data()?.role

  // Define permissions for each role
  const permissions = {
    owner: ["manage:all"],
    editor: ["create:marketing", "read:marketing", "update:marketing", "delete:marketing"],
    viewer: ["read:marketing"],
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

// Subscriber Actions
export async function createSubscriber(
  storeId: string,
  data: {
    email: string
    firstName?: string
    lastName?: string
    source?: string
    tags?: string[]
  },
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    // Check if subscriber already exists
    const existingSubscribers = await marketingService.getSubscribers(storeId)
    const existing = existingSubscribers.find((s) => s.email.toLowerCase() === data.email.toLowerCase())

    if (existing) {
      if (existing.status === "unsubscribed") {
        // Re-subscribe
        await marketingService.updateSubscriber(storeId, existing.id, {
          status: "subscribed",
          unsubscribedAt: null,
        })

        return { success: true, id: existing.id, message: "Subscriber re-subscribed" }
      }

      return { success: false, error: "Email is already subscribed" }
    }

    // Create subscriber in Firestore
    const subscriberId = await marketingService.addSubscriber(storeId, {
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      source: data.source || "manual",
      subscribedAt: new Date(),
      status: "subscribed",
      tags: data.tags || [],
    })

    // Create contact in Mailjet
    await mailjetService.createContact(data.email, `${data.firstName || ""} ${data.lastName || ""}`.trim(), {
      source: data.source || "manual",
    })

    revalidatePath(`/dashboard/${storeId}/marketing/subscribers`)
    return { success: true, id: subscriberId }
  } catch (error) {
    console.error("Error creating subscriber:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateSubscriber(storeId: string, subscriberId: string, data: Partial<Subscriber>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    await marketingService.updateSubscriber(storeId, subscriberId, data)

    revalidatePath(`/dashboard/${storeId}/marketing/subscribers`)
    return { success: true }
  } catch (error) {
    console.error("Error updating subscriber:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function unsubscribe(storeId: string, email: string) {
  try {
    const success = await marketingService.unsubscribe(storeId, email)

    return { success }
  } catch (error) {
    console.error("Error unsubscribing:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Subscriber List Actions
export async function createSubscriberList(
  storeId: string,
  data: {
    name: string
    description?: string
  },
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    // Create list in Firestore
    const listId = await marketingService.createSubscriberList(storeId, data)

    // Create list in Mailjet
    const mjResponse = await mailjetService.createContactsList(data.name, data.description)

    if (mjResponse.success) {
      // Store Mailjet list ID reference
      const listRef = db.collection("stores").doc(storeId).collection("subscriberLists").doc(listId)
      await listRef.update({
        mailjetId: mjResponse.data.Data[0].ID,
      })
    }

    revalidatePath(`/dashboard/${storeId}/marketing/subscribers`)
    return { success: true, id: listId }
  } catch (error) {
    console.error("Error creating subscriber list:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateSubscriberList(storeId: string, listId: string, data: Partial<SubscriberList>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    await marketingService.updateSubscriberList(storeId, listId, data)

    revalidatePath(`/dashboard/${storeId}/marketing/subscribers`)
    return { success: true }
  } catch (error) {
    console.error("Error updating subscriber list:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Email Template Actions
export async function createEmailTemplate(
  storeId: string,
  data: {
    name: string
    subject: string
    content: string
    previewText?: string
    category: EmailTemplate["category"]
  },
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    const session = await getServerSession(authOptions)

    const templateId = await marketingService.createEmailTemplate(storeId, {
      ...data,
      createdBy: session!.user.id,
      status: "draft",
    })

    revalidatePath(`/dashboard/${storeId}/marketing/templates`)
    return { success: true, id: templateId }
  } catch (error) {
    console.error("Error creating email template:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateEmailTemplate(storeId: string, templateId: string, data: Partial<EmailTemplate>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    await marketingService.updateEmailTemplate(storeId, templateId, data)

    revalidatePath(`/dashboard/${storeId}/marketing/templates`)
    revalidatePath(`/dashboard/${storeId}/marketing/templates/${templateId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating email template:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Email Campaign Actions
export async function createEmailCampaign(
  storeId: string,
  data: {
    name: string
    subject: string
    templateId: string
    listIds: string[]
  },
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    const session = await getServerSession(authOptions)

    const campaignId = await marketingService.createEmailCampaign(storeId, {
      ...data,
      createdBy: session!.user.id,
      status: "draft",
    })

    revalidatePath(`/dashboard/${storeId}/marketing/campaigns`)
    return { success: true, id: campaignId }
  } catch (error) {
    console.error("Error creating email campaign:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function scheduleCampaign(storeId: string, campaignId: string, scheduledDate: Date) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    const campaign = await marketingService.getEmailCampaign(storeId, campaignId)

    if (!campaign) {
      return { success: false, error: "Campaign not found" }
    }

    if (campaign.status !== "draft") {
      return { success: false, error: "Only draft campaigns can be scheduled" }
    }

    if (campaign.mailjetId) {
      // Schedule in Mailjet
      const response = await mailjetService.scheduleCampaign(Number.parseInt(campaign.mailjetId), scheduledDate)

      if (!response.success) {
        return { success: false, error: response.error }
      }
    }

    // Update in Firestore
    await marketingService.updateEmailCampaign(storeId, campaignId, {
      status: "scheduled",
      scheduledAt: scheduledDate,
    })

    revalidatePath(`/dashboard/${storeId}/marketing/campaigns`)
    revalidatePath(`/dashboard/${storeId}/marketing/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error("Error scheduling campaign:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function sendCampaign(storeId: string, campaignId: string) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    const campaign = await marketingService.getEmailCampaign(storeId, campaignId)

    if (!campaign) {
      return { success: false, error: "Campaign not found" }
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return { success: false, error: "Campaign cannot be sent" }
    }

    // If campaign hasn't been created in Mailjet yet, we need to create it
    if (!campaign.mailjetId) {
      // Get template
      const template = await marketingService.getEmailTemplate(storeId, campaign.templateId)

      if (!template) {
        return { success: false, error: "Template not found" }
      }

      // Get store info for sender details
      const storeRef = db.collection("stores").doc(storeId)
      const storeDoc = await storeRef.get()

      if (!storeDoc.exists) {
        return { success: false, error: "Store not found" }
      }

      const storeData = storeDoc.data()

      // Create campaign in Mailjet
      const response = await mailjetService.createCampaignDraft({
        name: campaign.name,
        subject: campaign.subject,
        sender: {
          email: storeData.email || process.env.MAILJET_SENDER_EMAIL,
          name: storeData.name || "Your Store",
        },
        listIds: campaign.listIds.map((id) => Number.parseInt(id)),
        htmlContent: template.content,
        textContent: template.content.replace(/<[^>]*>/g, ""), // Simple HTML to text conversion
      })

      if (!response.success) {
        return { success: false, error: response.error }
      }

      // Update campaign with Mailjet ID
      const mailjetId = response.data.Data[0].ID
      await marketingService.updateEmailCampaign(storeId, campaignId, {
        mailjetId: mailjetId.toString(),
      })

      // Now send the campaign
      const sendResponse = await mailjetService.sendCampaign(mailjetId)

      if (!sendResponse.success) {
        return { success: false, error: sendResponse.error }
      }
    } else {
      // Campaign already exists in Mailjet, just send it
      const sendResponse = await mailjetService.sendCampaign(Number.parseInt(campaign.mailjetId))

      if (!sendResponse.success) {
        return { success: false, error: sendResponse.error }
      }
    }

    // Update campaign status
    await marketingService.updateEmailCampaign(storeId, campaignId, {
      status: "sending",
      sentAt: new Date(),
    })

    revalidatePath(`/dashboard/${storeId}/marketing/campaigns`)
    revalidatePath(`/dashboard/${storeId}/marketing/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error("Error sending campaign:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Coupon Actions
export async function createCoupon(
  storeId: string,
  data: {
    code: string
    type: Coupon["type"]
    value: number
    minPurchase?: number
    maxDiscount?: number
    startDate: Date
    endDate?: Date
    usageLimit?: number
    products?: string[]
    excludedProducts?: string[]
    customerEmails?: string[]
    oneTimeUse: boolean
  },
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    const session = await getServerSession(authOptions)

    // Check if code already exists
    const existingCoupon = await marketingService.getCouponByCode(storeId, data.code)

    if (existingCoupon) {
      return { success: false, error: "Coupon code already exists" }
    }

    const couponId = await marketingService.createCoupon(storeId, {
      ...data,
      createdBy: session!.user.id,
      status: "active",
    })

    revalidatePath(`/dashboard/${storeId}/marketing/coupons`)
    return { success: true, id: couponId }
  } catch (error) {
    console.error("Error creating coupon:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateCoupon(storeId: string, couponId: string, data: Partial<Coupon>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "marketing")

    if (!allowed) {
      return { success: false, error }
    }

    // If code is changing, check if new code already exists
    if (data.code) {
      const existingCoupon = await marketingService.getCouponByCode(storeId, data.code)

      if (existingCoupon && existingCoupon.id !== couponId) {
        return { success: false, error: "Coupon code already exists" }
      }
    }

    await marketingService.updateCoupon(storeId, couponId, data)

    revalidatePath(`/dashboard/${storeId}/marketing/coupons`)
    revalidatePath(`/dashboard/${storeId}/marketing/coupons/${couponId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating coupon:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function validateCoupon(storeId: string, code: string, cartTotal: number, productIds?: string[]) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { valid: false, error: "Unauthorized" }
    }

    const result = await marketingService.validateCoupon(storeId, code, session.user.id, cartTotal, productIds)

    return result
  } catch (error) {
    console.error("Error validating coupon:", error)
    return { valid: false, error: (error as Error).message }
  }
}

