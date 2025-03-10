import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { IntegrationsTabs } from "./components/integrations-tabs"
import { IntegrationsLoading } from "./components/loading"

export const metadata = {
  title: "Integrations",
  description: "Manage your social media widgets and tracking integrations",
}

export default async function IntegrationsPage({ params }: { params: { storeId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Integrations" text="Manage your social media widgets and tracking integrations" />

      <PermissionGuard requiredAction="read" requiredSubject="integrations">
        <Suspense fallback={<IntegrationsLoading />}>
          <IntegrationsTabs storeId={params.storeId} />
        </Suspense>
      </PermissionGuard>
    </DashboardShell>
  )
}

