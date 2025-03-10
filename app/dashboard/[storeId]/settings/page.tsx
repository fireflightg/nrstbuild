import { Suspense } from "react"
import { getStoreSettings } from "./actions"
import SettingsTabs from "./components/settings-tabs"
import SettingsLoading from "./components/settings-loading"

interface SettingsPageProps {
  params: {
    storeId: string
  }
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { storeId } = params

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings and preferences.</p>
      </div>

      <Suspense fallback={<SettingsLoading />}>
        <SettingsTabsWrapper storeId={storeId} />
      </Suspense>
    </div>
  )
}

async function SettingsTabsWrapper({ storeId }: { storeId: string }) {
  const settings = await getStoreSettings(storeId)

  return <SettingsTabs storeId={storeId} initialSettings={settings} />
}

