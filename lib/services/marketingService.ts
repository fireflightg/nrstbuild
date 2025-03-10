import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Timestamp,
  increment,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type {
  Subscriber,
  SubscriberList,
  EmailTemplate,
  EmailCampaign,
  Coupon,
  CouponUsage,
  CouponValidationResult,
} from "@/types/marketing"

class MarketingService {
  // Subscriber Management
  async getSubscribers(storeId: string, status?: string, tag?: string, limit = 100) {
    let subscribersQuery = query(collection(db, "stores", storeId, "subscribers"), orderBy("subscribedAt", "desc"))

    if (status) {
      subscribersQuery = query(subscribersQuery, where("status", "==", status))
    }

    if (tag) {
      subscribersQuery = query(subscribersQuery, where("tags", "array-contains", tag))
    }

    subscribersQuery = query(subscribersQuery, limit)

    const snapshot = await getDocs(subscribersQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscriber[]
  }

  async addSubscriber(storeId: string, subscriber: Omit<Subscriber, "id">) {
    const subscriberRef = await addDoc(collection(db, "stores", storeId, "subscribers"), {
      ...subscriber,
      subscribedAt: serverTimestamp(),
      status: "subscribed",
      tags: subscriber.tags || [],
    })
    return subscriberRef.id
  }

  async updateSubscriber(storeId: string, subscriberId: string, data: Partial<Subscriber>) {
    const subscriberRef = doc(db, "stores", storeId, "subscribers", subscriberId)
    await updateDoc(subscriberRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async unsubscribe(storeId: string, email: string) {
    const subscribersQuery = query(collection(db, "stores", storeId, "subscribers"), where("email", "==", email))

    const snapshot = await getDocs(subscribersQuery)

    if (!snapshot.empty) {
      const subscriberId = snapshot.docs[0].id
      const subscriberRef = doc(db, "stores", storeId, "subscribers", subscriberId)

      await updateDoc(subscriberRef, {
        status: "unsubscribed",
        unsubscribedAt: serverTimestamp(),
      })

      return true
    }

    return false
  }

  // Subscriber Lists
  async getSubscriberLists(storeId: string) {
    const listsQuery = query(collection(db, "stores", storeId, "subscriberLists"), orderBy("createdAt", "desc"))

    const snapshot = await getDocs(listsQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SubscriberList[]
  }

  async createSubscriberList(storeId: string, data: Pick<SubscriberList, "name" | "description">) {
    const listRef = await addDoc(collection(db, "stores", storeId, "subscriberLists"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      subscriberCount: 0,
    })
    return listRef.id
  }

  async updateSubscriberList(storeId: string, listId: string, data: Partial<SubscriberList>) {
    const listRef = doc(db, "stores", storeId, "subscriberLists", listId)
    await updateDoc(listRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async addSubscriberToList(storeId: string, listId: string, subscriberId: string) {
    // Add subscriber to list
    const subscriptionRef = await addDoc(collection(db, "stores", storeId, "subscriberLists", listId, "subscribers"), {
      subscriberId,
      addedAt: serverTimestamp(),
    })

    // Update list count
    const listRef = doc(db, "stores", storeId, "subscriberLists", listId)
    await updateDoc(listRef, {
      subscriberCount: increment(1),
      updatedAt: serverTimestamp(),
    })

    return subscriptionRef.id
  }

  async removeSubscriberFromList(storeId: string, listId: string, subscriberId: string) {
    const subscriptionsQuery = query(
      collection(db, "stores", storeId, "subscriberLists", listId, "subscribers"),
      where("subscriberId", "==", subscriberId),
    )

    const snapshot = await getDocs(subscriptionsQuery)

    if (!snapshot.empty) {
      const subscriptionId = snapshot.docs[0].id
      await deleteDoc(doc(db, "stores", storeId, "subscriberLists", listId, "subscribers", subscriptionId))

      // Update list count
      const listRef = doc(db, "stores", storeId, "subscriberLists", listId)
      await updateDoc(listRef, {
        subscriberCount: increment(-1),
        updatedAt: serverTimestamp(),
      })

      return true
    }

    return false
  }

  // Email Templates
  async getEmailTemplates(storeId: string, category?: string) {
    let templatesQuery = query(collection(db, "stores", storeId, "emailTemplates"), orderBy("updatedAt", "desc"))

    if (category) {
      templatesQuery = query(templatesQuery, where("category", "==", category))
    }

    const snapshot = await getDocs(templatesQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailTemplate[]
  }

  async getEmailTemplate(storeId: string, templateId: string) {
    const templateRef = doc(db, "stores", storeId, "emailTemplates", templateId)
    const templateSnap = await getDoc(templateRef)

    if (templateSnap.exists()) {
      return {
        id: templateSnap.id,
        ...templateSnap.data(),
      } as EmailTemplate
    }

    return null
  }

  async createEmailTemplate(storeId: string, template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">) {
    const templateRef = await addDoc(collection(db, "stores", storeId, "emailTemplates"), {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return templateRef.id
  }

  async updateEmailTemplate(storeId: string, templateId: string, data: Partial<EmailTemplate>) {
    const templateRef = doc(db, "stores", storeId, "emailTemplates", templateId)
    await updateDoc(templateRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  // Email Campaigns
  async getEmailCampaigns(storeId: string, status?: string) {
    let campaignsQuery = query(collection(db, "stores", storeId, "emailCampaigns"), orderBy("createdAt", "desc"))

    if (status) {
      campaignsQuery = query(campaignsQuery, where("status", "==", status))
    }

    const snapshot = await getDocs(campaignsQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailCampaign[]
  }

  async getEmailCampaign(storeId: string, campaignId: string) {
    const campaignRef = doc(db, "stores", storeId, "emailCampaigns", campaignId)
    const campaignSnap = await getDoc(campaignRef)

    if (campaignSnap.exists()) {
      return {
        id: campaignSnap.id,
        ...campaignSnap.data(),
      } as EmailCampaign
    }

    return null
  }

  async createEmailCampaign(
    storeId: string,
    campaign: Omit<EmailCampaign, "id" | "createdAt" | "updatedAt" | "stats">,
  ) {
    const campaignRef = await addDoc(collection(db, "stores", storeId, "emailCampaigns"), {
      ...campaign,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        bounced: 0,
        complaints: 0,
      },
    })
    return campaignRef.id
  }

  async updateEmailCampaign(storeId: string, campaignId: string, data: Partial<EmailCampaign>) {
    const campaignRef = doc(db, "stores", storeId, "emailCampaigns", campaignId)
    await updateDoc(campaignRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async updateCampaignStats(storeId: string, campaignId: string, stats: Partial<EmailCampaign["stats"]>) {
    const campaignRef = doc(db, "stores", storeId, "emailCampaigns", campaignId)
    await updateDoc(campaignRef, {
      stats: stats,
      updatedAt: serverTimestamp(),
    })
  }

  // Coupons
  async getCoupons(storeId: string, status?: string) {
    let couponsQuery = query(collection(db, "stores", storeId, "coupons"), orderBy("createdAt", "desc"))

    if (status) {
      couponsQuery = query(couponsQuery, where("status", "==", status))
    }

    const snapshot = await getDocs(couponsQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Coupon[]
  }

  async getCoupon(storeId: string, couponId: string) {
    const couponRef = doc(db, "stores", storeId, "coupons", couponId)
    const couponSnap = await getDoc(couponRef)

    if (couponSnap.exists()) {
      return {
        id: couponSnap.id,
        ...couponSnap.data(),
      } as Coupon
    }

    return null
  }

  async getCouponByCode(storeId: string, code: string): Promise<Coupon | null> {
    const couponsQuery = query(
      collection(db, "stores", storeId, "coupons"),
      where("code", "==", code.toUpperCase()),
      where("status", "==", "active"),
      limit(1),
    )

    const snapshot = await getDocs(couponsQuery)

    if (!snapshot.empty) {
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as Coupon
    }

    return null
  }

  async createCoupon(storeId: string, coupon: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usedCount">) {
    // Convert code to uppercase
    const couponWithUpperCode = {
      ...coupon,
      code: coupon.code.toUpperCase(),
    }

    const couponRef = await addDoc(collection(db, "stores", storeId, "coupons"), {
      ...couponWithUpperCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      usedCount: 0,
    })
    return couponRef.id
  }

  async updateCoupon(storeId: string, couponId: string, data: Partial<Coupon>) {
    const couponRef = doc(db, "stores", storeId, "coupons", couponId)

    // If code is being updated, convert to uppercase
    if (data.code) {
      data.code = data.code.toUpperCase()
    }

    await updateDoc(couponRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async validateCoupon(
    storeId: string,
    code: string,
    customerId: string,
    cartTotal: number,
    productIds?: string[],
  ): Promise<CouponValidationResult> {
    try {
      // Find the coupon
      const coupon = await this.getCouponByCode(storeId, code)

      if (!coupon) {
        return { valid: false, error: "Coupon not found" }
      }

      // Check if coupon is active
      if (coupon.status !== "active") {
        return { valid: false, error: "Coupon is not active" }
      }

      // Check validity dates
      const now = new Date()
      if (now < (coupon.startDate as Timestamp).toDate()) {
        return { valid: false, error: "Coupon is not valid yet" }
      }

      if (coupon.endDate && now > (coupon.endDate as Timestamp).toDate()) {
        return { valid: false, error: "Coupon has expired" }
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, error: "Coupon usage limit has been reached" }
      }

      // Check minimum purchase
      if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
        return {
          valid: false,
          error: `Minimum purchase amount of $${coupon.minPurchase.toFixed(2)} required`,
        }
      }

      // Check if customer can use this coupon
      if (coupon.customerEmails && coupon.customerEmails.length > 0) {
        // Get customer email
        const userRef = doc(db, "users", customerId)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          return { valid: false, error: "Invalid customer" }
        }

        const customerEmail = userSnap.data().email

        if (!coupon.customerEmails.includes(customerEmail)) {
          return { valid: false, error: "Coupon not available for this customer" }
        }
      }

      // Check if customer has used this one-time coupon
      if (coupon.oneTimeUse) {
        const usageQuery = query(
          collection(db, "stores", storeId, "couponUsages"),
          where("couponId", "==", coupon.id),
          where("customerId", "==", customerId),
          limit(1),
        )

        const usageSnap = await getDocs(usageQuery)

        if (!usageSnap.empty) {
          return { valid: false, error: "Coupon has already been used by this customer" }
        }
      }

      // Check product restrictions if applicable
      if (productIds && productIds.length > 0 && coupon.products && coupon.products.length > 0) {
        const hasValidProduct = productIds.some((id) => coupon.products!.includes(id))

        if (!hasValidProduct) {
          return { valid: false, error: "Coupon is not valid for these products" }
        }
      }

      // Check excluded products
      if (productIds && productIds.length > 0 && coupon.excludedProducts && coupon.excludedProducts.length > 0) {
        const hasExcludedProduct = productIds.some((id) => coupon.excludedProducts!.includes(id))

        if (hasExcludedProduct) {
          return { valid: false, error: "Coupon is not valid for some products in your cart" }
        }
      }

      // Calculate discount
      let discountAmount = 0

      if (coupon.type === "percentage") {
        discountAmount = cartTotal * (coupon.value / 100)

        // Apply max discount if set
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount
        }
      } else if (coupon.type === "fixed") {
        discountAmount = Math.min(coupon.value, cartTotal)
      }
      // Free shipping would be applied separately

      return {
        valid: true,
        coupon,
        discountAmount: Number.parseFloat(discountAmount.toFixed(2)),
      }
    } catch (error) {
      console.error("Error validating coupon:", error)
      return { valid: false, error: "Error validating coupon" }
    }
  }

  async recordCouponUsage(storeId: string, usage: Omit<CouponUsage, "id" | "usedAt">) {
    try {
      // Add usage record
      const usageRef = await addDoc(collection(db, "stores", storeId, "couponUsages"), {
        ...usage,
        usedAt: serverTimestamp(),
      })

      // Increment coupon used count
      const couponRef = doc(db, "stores", storeId, "coupons", usage.couponId)
      await updateDoc(couponRef, {
        usedCount: increment(1),
        updatedAt: serverTimestamp(),
      })

      return usageRef.id
    } catch (error) {
      console.error("Error recording coupon usage:", error)
      throw error
    }
  }
}

export const marketingService = new MarketingService()

