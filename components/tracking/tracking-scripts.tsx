"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "./google-analytics"
import { FacebookPixel } from "./facebook-pixel"
import { GoogleTagManager } from "./google-tag-manager"
import { integrationsService } from "@/lib/services/integrationsService"
import type { TrackingIntegration } from "@/types/integrations"

interface TrackingScriptsProps {
  storeId: string
}

export function TrackingScripts({ storeId }: TrackingScriptsProps) {
  const [integrations, setIntegrations] = useState<TrackingIntegration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadIntegrations() {
      try {
        const trackingIntegrations = await integrationsService.getTrackingIntegrations(storeId)
        setIntegrations(trackingIntegrations.filter((integration) => integration.enabled))
      } catch (error) {
        console.error("Error loading tracking integrations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadIntegrations()
  }, [storeId])

  if (loading || integrations.length === 0) {
    return null
  }

  return (
    <>
      {integrations.map((integration) => {
        switch (integration.type) {
          case "google_analytics":
            return <GoogleAnalytics key={integration.id} measurementId={integration.trackingId} />
          case "facebook_pixel":
            return <FacebookPixel key={integration.id} pixelId={integration.trackingId} />
          case "google_tag_manager":
            return <GoogleTagManager key={integration.id} containerId={integration.trackingId} />
          default:
            return null
        }
      })}
    </>
  )
}

