"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubscribersList } from "../subscribers/components/subscribers-list"
import { EmailCampaignsList } from "../campaigns/components/email-campaigns-list"
import { CouponsList } from "../coupons/components/coupons-list"

export function MarketingTabs({ storeId }: { storeId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("subscribers")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard/${storeId}/marketing/${value}`)
  }

  return (
    <Tabs defaultValue="subscribers" value={activeTab} onValueChange={handleTabChange} className="mt-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
        <TabsTrigger value="coupons">Discount Coupons</TabsTrigger>
      </TabsList>
      <TabsContent value="subscribers" className="mt-4">
        <SubscribersList storeId={storeId} />
      </TabsContent>
      <TabsContent value="campaigns" className="mt-4">
        <EmailCampaignsList storeId={storeId} />
      </TabsContent>
      <TabsContent value="coupons" className="mt-4">
        <CouponsList storeId={storeId} />
      </TabsContent>
    </Tabs>
  )
}

