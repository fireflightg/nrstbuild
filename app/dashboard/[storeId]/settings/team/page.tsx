import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { TeamManagement } from "@/app/dashboard/[storeId]/team/components/team-management"

export default function TeamSettingsPage({ params }: { params: { storeId: string } }) {
  return (
    <PermissionGuard
      requiredRole="owner"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="mt-2 text-muted-foreground">Only store owners can manage team settings.</p>
        </div>
      }
    >
      <TeamManagement storeId={params.storeId} />
    </PermissionGuard>
  )
}

