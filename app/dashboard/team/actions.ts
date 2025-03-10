"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase/admin"
import type { UserRole } from "@/types/teams"
import nodemailer from "nodemailer"

interface InviteTeamMemberParams {
  email: string
  role: UserRole
  storeId: string
  teamName: string
  inviterName: string
}

export async function inviteTeamMember({ email, role, storeId, teamName, inviterName }: InviteTeamMemberParams) {
  try {
    // Verify the current user is authorized
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the current user has permission to invite users
    const storeRef = db.collection("stores").doc(storeId)
    const storeDoc = await storeRef.get()

    if (!storeDoc.exists) {
      return { success: false, error: "Store not found" }
    }

    const storeData = storeDoc.data()
    const teamRef = storeRef.collection("team")
    const currentUserTeamDoc = await teamRef.doc(session.user.id).get()

    // Only owners can add team members
    if (
      storeData?.ownerId !== session.user.id &&
      (!currentUserTeamDoc.exists || currentUserTeamDoc.data()?.role !== "owner")
    ) {
      return { success: false, error: "Only owners can invite team members" }
    }

    // Check if user is already a member
    const existingMemberQuery = await teamRef.where("email", "==", email.toLowerCase()).get()

    if (!existingMemberQuery.empty) {
      return { success: false, error: "User is already a team member" }
    }

    // Check for existing invitations
    const existingInviteQuery = await db
      .collection("invitations")
      .where("email", "==", email.toLowerCase())
      .where("storeId", "==", storeId)
      .where("status", "==", "pending")
      .get()

    if (!existingInviteQuery.empty) {
      return { success: false, error: "User has already been invited" }
    }

    // Create expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the invitation
    const invitationRef = await db.collection("invitations").add({
      email: email.toLowerCase(),
      role,
      storeId,
      teamName,
      invitedBy: session.user.id,
      inviterName: inviterName || session.user.name || "A team member",
      invitedAt: new Date(),
      status: "pending",
      expiresAt,
    })

    // Send the invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nrstbuild.com"
    const inviteUrl = `${appUrl}/invitation/${invitationRef.id}`

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      // Configure your email provider here
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@nrstbuild.com",
      to: email,
      subject: `You've been invited to join ${teamName} on NRSTbuild`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p>${inviterName || "A team member"} has invited you to join ${teamName} as a ${role} on NRSTbuild.</p>
          <p>Click the button below to accept this invitation:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #0070f3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>This invitation will expire in 7 days.</p>
          <p>If you don't have an account, you'll be able to create one when you accept the invitation.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="color: #666; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    revalidatePath(`/dashboard/${storeId}/team`)
    return { success: true, invitationId: invitationRef.id }
  } catch (error) {
    console.error("Error inviting team member:", error)
    return { success: false, error: "Failed to send invitation" }
  }
}

export async function updateTeamMemberRole(storeId: string, userId: string, role: UserRole) {
  try {
    // Verify the current user is authorized
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the current user has permission
    const storeRef = db.collection("stores").doc(storeId)
    const storeDoc = await storeRef.get()

    if (!storeDoc.exists) {
      return { success: false, error: "Store not found" }
    }

    const storeData = storeDoc.data()

    // Only owners can update roles
    if (storeData?.ownerId !== session.user.id) {
      return { success: false, error: "Only owners can update roles" }
    }

    // Cannot change the role of the owner
    if (storeData?.ownerId === userId) {
      return { success: false, error: "Cannot change the role of the store owner" }
    }

    // Update the role
    await storeRef.collection("team").doc(userId).update({
      role,
      updatedAt: new Date(),
    })

    revalidatePath(`/dashboard/${storeId}/team`)
    return { success: true }
  } catch (error) {
    console.error("Error updating team member role:", error)
    return { success: false, error: "Failed to update role" }
  }
}

export async function removeTeamMember(storeId: string, userId: string) {
  try {
    // Verify the current user is authorized
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the current user has permission
    const storeRef = db.collection("stores").doc(storeId)
    const storeDoc = await storeRef.get()

    if (!storeDoc.exists) {
      return { success: false, error: "Store not found" }
    }

    const storeData = storeDoc.data()

    // Only owners can remove team members
    if (storeData?.ownerId !== session.user.id) {
      return { success: false, error: "Only owners can remove team members" }
    }

    // Cannot remove the owner
    if (storeData?.ownerId === userId) {
      return { success: false, error: "Cannot remove the store owner" }
    }

    // Delete the team member
    await storeRef.collection("team").doc(userId).delete()

    revalidatePath(`/dashboard/${storeId}/team`)
    return { success: true }
  } catch (error) {
    console.error("Error removing team member:", error)
    return { success: false, error: "Failed to remove team member" }
  }
}

