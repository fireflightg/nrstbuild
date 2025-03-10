"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StoreSeoSettings } from "../store/components/store-seo-settings"
import { SitemapSettings } from "../sitemap/components/sitemap-settings"
import { RobotsTxtSettings } from "../robots/components/robots-txt-settings"

export function SeoTabs({ storeId }: { storeId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("store")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard/${storeId}/seo/${value}`)
  }

  return (
    <Tabs defaultValue="store" value={activeTab} onValueChange={handleTabChange} className="mt-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="store">Store SEO</TabsTrigger>
        <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
        <TabsTrigger value="robots">Robots.txt</TabsTrigger>
      </TabsList>
      <TabsContent value="store" className="mt-4">
        <StoreSeoSettings storeId={storeId} />
      </TabsContent>
      <TabsContent value="sitemap" className="mt-4">
        <SitemapSettings storeId={storeId} />
      </TabsContent>
      <TabsContent value="robots" className="mt-4">
        <RobotsTxtSettings storeId={storeId} />
      </TabsContent>
    </Tabs>
  )
}

