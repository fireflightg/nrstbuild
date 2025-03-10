import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MarketingOverview } from "./components/marketing-overview"
import { MarketingTabs } from "./components/marketing-tabs"
import { MarketingLoading } from "./components/loading"

export const metadata = {
  title: "Marketing",
  description: "Manage your email campaigns and discount coupons",
}

export default async function MarketingPage({ params }: { params: { storeId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Marketing" text="Manage your email campaigns and discount coupons" />

      <PermissionGuard requiredAction="read" requiredSubject="marketing">
        <Suspense fallback={<MarketingLoading />}>
          <MarketingOverview storeId={params.storeId} />
          <MarketingTabs storeId={params.storeId} />
        </Suspense>
      </PermissionGuard>
    </DashboardShell>
  )
}

