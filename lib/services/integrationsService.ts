import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { SocialMediaWidget, TrackingIntegration } from "@/types/integrations"

class IntegrationsService {
  // Social Media Widgets
  async getSocialMediaWidgets(storeId: string): Promise<SocialMediaWidget[]> {
    try {
      const widgetsQuery = query(collection(db, "stores", storeId, "widgets"))
      const snapshot = await getDocs(widgetsQuery)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SocialMediaWidget[]
    } catch (error) {
      console.error("Error getting social media widgets:", error)
      throw error
    }
  }

  async getSocialMediaWidget(storeId: string, widgetId: string): Promise<SocialMediaWidget | null> {
    try {
      const widgetRef = doc(db, "stores", storeId, "widgets", widgetId)
      const widgetSnap = await getDoc(widgetRef)

      if (widgetSnap.exists()) {
        return {
          id: widgetSnap.id,
          ...widgetSnap.data(),
        } as SocialMediaWidget
      }

      return null
    } catch (error) {
      console.error("Error getting social media widget:", error)
      throw error
    }
  }

  async createSocialMediaWidget(
    storeId: string,
    widget: Omit<SocialMediaWidget, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const widgetRef = await addDoc(collection(db, "stores", storeId, "widgets"), {
        ...widget,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return widgetRef.id
    } catch (error) {
      console.error("Error creating social media widget:", error)
      throw error
    }
  }

  async updateSocialMediaWidget(storeId: string, widgetId: string, widget: Partial<SocialMediaWidget>): Promise<void> {
    try {
      const widgetRef = doc(db, "stores", storeId, "widgets", widgetId)
      await updateDoc(widgetRef, {
        ...widget,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating social media widget:", error)
      throw error
    }
  }

  async deleteSocialMediaWidget(storeId: string, widgetId: string): Promise<void> {
    try {
      const widgetRef = doc(db, "stores", storeId, "widgets", widgetId)
      await deleteDoc(widgetRef)
    } catch (error) {
      console.error("Error deleting social media widget:", error)
      throw error
    }
  }

  // Tracking Integrations
  async getTrackingIntegrations(storeId: string): Promise<TrackingIntegration[]> {
    try {
      const integrationsQuery = query(collection(db, "stores", storeId, "tracking"))
      const snapshot = await getDocs(integrationsQuery)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        storeId,
        ...doc.data(),
      })) as TrackingIntegration[]
    } catch (error) {
      console.error("Error getting tracking integrations:", error)
      throw error
    }
  }

  async getTrackingIntegration(
    storeId: string,
    type: TrackingIntegration["type"],
  ): Promise<TrackingIntegration | null> {
    try {
      const integrationsQuery = query(collection(db, "stores", storeId, "tracking"), where("type", "==", type))
      const snapshot = await getDocs(integrationsQuery)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return {
          id: doc.id,
          storeId,
          ...doc.data(),
        } as TrackingIntegration
      }

      return null
    } catch (error) {
      console.error("Error getting tracking integration:", error)
      throw error
    }
  }

  async createTrackingIntegration(
    storeId: string,
    integration: Omit<TrackingIntegration, "id" | "storeId" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      // Check if integration already exists
      const existingIntegration = await this.getTrackingIntegration(storeId, integration.type)

      if (existingIntegration) {
        // Update existing integration
        await this.updateTrackingIntegration(storeId, existingIntegration.id, integration)
        return existingIntegration.id
      }

      // Create new integration
      const integrationRef = await addDoc(collection(db, "stores", storeId, "tracking"), {
        ...integration,
        storeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return integrationRef.id
    } catch (error) {
      console.error("Error creating tracking integration:", error)
      throw error
    }
  }

  async updateTrackingIntegration(
    storeId: string,
    integrationId: string,
    integration: Partial<TrackingIntegration>,
  ): Promise<void> {
    try {
      const integrationRef = doc(db, "stores", storeId, "tracking", integrationId)
      await updateDoc(integrationRef, {
        ...integration,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating tracking integration:", error)
      throw error
    }
  }

  async deleteTrackingIntegration(storeId: string, integrationId: string): Promise<void> {
    try {
      const integrationRef = doc(db, "stores", storeId, "tracking", integrationId)
      await deleteDoc(integrationRef)
    } catch (error) {
      console.error("Error deleting tracking integration:", error)
      throw error
    }
  }

  async toggleTrackingIntegration(storeId: string, integrationId: string, enabled: boolean): Promise<void> {
    try {
      const integrationRef = doc(db, "stores", storeId, "tracking", integrationId)
      await updateDoc(integrationRef, {
        enabled,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error toggling tracking integration:", error)
      throw error
    }
  }
}

export const integrationsService = new IntegrationsService()

