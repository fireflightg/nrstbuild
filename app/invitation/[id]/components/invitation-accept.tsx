"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import { teamService } from "@/lib/services/teamService"
import type { TeamInvitation } from "@/types/teams"
import { db } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function InvitationAccept({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const { user, signIn } = useAuth()
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch invitation data
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const invitationRef = doc(db, "invitations", invitationId)
        const docSnap = await getDoc(invitationRef)

        if (docSnap.exists()) {
          setInvitation({
            id: docSnap.id,
            ...docSnap.data(),
          } as TeamInvitation)
        } else {
          setError("Invitation not found or has expired")
        }
      } catch (err) {
        console.error("Error fetching invitation:", err)
        setError("Failed to load invitation")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [invitationId])

  // Handle invitation acceptance
  async function handleAcceptInvitation() {
    if (!invitation) return

    setAccepting(true)

    try {
      // If user is not signed in, redirect to sign in page with return URL
      if (!user) {
        const returnUrl = `/invitation/${invitationId}`
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
        return
      }

      // Accept the invitation
      const success = await teamService.acceptInvitation(invitationId, user.uid)

      if (success) {
        router.push(`/dashboard/${invitation.storeId}`)
      } else {
        setError("Failed to accept invitation")
      }
    } catch (err) {
      console.error("Error accepting invitation:", err)
      setError("Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <LoadingSpinner />
          <p className="mt-4 text-center text-sm text-muted-foreground">Loading invitation...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !invitation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invitation Error</CardTitle>
          <CardDescription>There was a problem with this invitation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">{error || "Invitation not found or has expired"}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/")}>Go to Homepage</Button>
        </CardFooter>
      </Card>
    )
  }

  // Check if invitation has expired
  const now = new Date()
  const isExpired = invitation.expiresAt.toDate() < now

  if (isExpired) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>This invitation is no longer valid</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            This invitation has expired. Please contact the team owner for a new invitation.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/")}>Go to Homepage</Button>
        </CardFooter>
      </Card>
    )
  }

  if (invitation.status !== "pending") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invitation Already Processed</CardTitle>
          <CardDescription>This invitation has already been {invitation.status}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {invitation.status === "accepted"
              ? "You have already accepted this invitation. You can now access the store."
              : "This invitation has been declined."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => router.push(invitation.status === "accepted" ? `/dashboard/${invitation.storeId}` : "/")}
          >
            {invitation.status === "accepted" ? "Go to Dashboard" : "Go to Homepage"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Invitation</CardTitle>
        <CardDescription>You've been invited to join a team on NRSTbuild</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm font-medium">Invitation Details</p>
          <div className="mt-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Team:</span>
              <span className="font-medium">{invitation.teamName || "Team"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Invited by:</span>
              <span className="font-medium">{invitation.inviterName || "Team Member"}</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            By accepting this invitation, you'll be able to collaborate on this store based on the permissions granted
            to your role.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={() => router.push("/")} disabled={accepting}>
          Decline
        </Button>
        <Button onClick={handleAcceptInvitation} disabled={accepting}>
          {accepting ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Accepting...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

