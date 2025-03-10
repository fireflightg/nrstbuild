"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import type { StoreSettings } from "@/types/settings"
import { subscribeToSettings } from "@/lib/services/settingsService"
import GeneralSettingsForm from "./general-settings-form"
import EmailSettingsForm from "./email-settings-form"
import SecuritySettingsForm from "./security-settings-form"
import AppearanceSettingsForm from "./appearance-settings-form"

interface SettingsTabsProps {
  storeId: string
  initialSettings: StoreSettings
}

export default function SettingsTabs({ storeId, initialSettings }: SettingsTabsProps) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState("general")

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToSettings(storeId, (updatedSettings) => {
      setSettings(updatedSettings)
    })

    return () => unsubscribe()
  }, [storeId])

  return (
    <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
      </TabsList>

      <Card className="p-6">
        <TabsContent value="general" className="mt-0">
          <GeneralSettingsForm storeId={storeId} settings={settings.general} />
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <EmailSettingsForm storeId={storeId} settings={settings.email} />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecuritySettingsForm storeId={storeId} settings={settings.security} />
        </TabsContent>

        <TabsContent value="appearance" className="mt-0">
          <AppearanceSettingsForm storeId={storeId} settings={settings.appearance} />
        </TabsContent>
      </Card>
    </Tabs>
  )
}

