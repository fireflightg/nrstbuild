import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TeamManagement } from "@/app/dashboard/[storeId]/team/components/team-management"
import { LoadingTeamMembers } from "@/app/dashboard/[storeId]/team/components/loading"

export const metadata = {
  title: "Team Management",
  description: "Manage your team members and their permissions",
}

export default async function TeamPage({ params }: { params: { storeId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Team Management" text="Invite team members and manage permissions" />

      <Suspense fallback={<LoadingTeamMembers />}>
        <TeamManagement storeId={params.storeId} currentUserId={session.user.id} />
      </Suspense>
    </DashboardShell>
  )
}

