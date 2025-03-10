"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SocialMediaWidgets } from "../social-media/components/social-media-widgets"
import { TrackingIntegrations } from "../tracking/components/tracking-integrations"

export function IntegrationsTabs({ storeId }: { storeId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("social-media")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard/${storeId}/integrations/${value}`)
  }

  return (
    <Tabs defaultValue="social-media" value={activeTab} onValueChange={handleTabChange} className="mt-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="social-media">Social Media Widgets</TabsTrigger>
        <TabsTrigger value="tracking">Tracking & Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="social-media" className="mt-4">
        <SocialMediaWidgets storeId={storeId} />
      </TabsContent>
      <TabsContent value="tracking" className="mt-4">
        <TrackingIntegrations storeId={storeId} />
      </TabsContent>
    </Tabs>
  )
}

