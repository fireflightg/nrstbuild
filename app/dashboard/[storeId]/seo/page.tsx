import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SeoTabs } from "./components/seo-tabs"
import { SeoLoading } from "./components/loading"

export const metadata = {
  title: "SEO Settings",
  description: "Manage your store's SEO settings, sitemap, and robots.txt",
}

export default async function SeoPage({ params }: { params: { storeId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="SEO Settings" text="Optimize your store for search engines" />

      <PermissionGuard requiredAction="read" requiredSubject="seo">
        <Suspense fallback={<SeoLoading />}>
          <SeoTabs storeId={params.storeId} />
        </Suspense>
      </PermissionGuard>
    </DashboardShell>
  )
}

