import { Suspense } from "react"
import { InvitationAccept } from "./components/invitation-accept"
import { InvitationLoading } from "./components/invitation-loading"

export const metadata = {
  title: "Team Invitation",
  description: "Accept an invitation to join a team",
}

export default function InvitationPage({ params }: { params: { id: string } }) {
  return (
    <div className="container flex h-screen max-w-lg flex-col items-center justify-center">
      <Suspense fallback={<InvitationLoading />}>
        <InvitationAccept invitationId={params.id} />
      </Suspense>
    </div>
  )
}

