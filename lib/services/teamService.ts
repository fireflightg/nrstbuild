import { db } from "@/lib/firebase/config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore"
import type { TeamMember, TeamInvitation, UserRole } from "@/types/teams"

class TeamService {
  // Get all team members for a store
  async getTeamMembers(storeId: string): Promise<TeamMember[]> {
    const teamQuery = query(collection(db, "stores", storeId, "team"))

    const snapshot = await getDocs(teamQuery)
    return snapshot.docs.map((doc) => ({
      ...(doc.data() as TeamMember),
      uid: doc.id,
    }))
  }

  // Get a user's role in a store
  async getUserRole(storeId: string, userId: string): Promise<UserRole | null> {
    try {
      const docRef = doc(db, "stores", storeId, "team", userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data().role as UserRole
      }

      // Check if user is store owner in the store document
      const storeRef = doc(db, "stores", storeId)
      const storeSnap = await getDoc(storeRef)

      if (storeSnap.exists() && storeSnap.data().ownerId === userId) {
        return "owner"
      }

      return null
    } catch (error) {
      console.error("Error getting user role:", error)
      return null
    }
  }

  // Update user role
  async updateUserRole(storeId: string, userId: string, role: UserRole): Promise<void> {
    const memberRef = doc(db, "stores", storeId, "team", userId)

    await updateDoc(memberRef, {
      role,
      updatedAt: serverTimestamp(),
    })
  }

  // Invite a new team member
  async inviteTeamMember(storeId: string, email: string, role: UserRole, invitedBy: string): Promise<string> {
    const invitationsRef = collection(db, "invitations")

    // Create the invitation with an expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const docRef = await addDoc(invitationsRef, {
      email: email.toLowerCase(),
      role,
      storeId,
      invitedBy,
      invitedAt: serverTimestamp(),
      status: "pending",
      expiresAt,
    })

    // Here you would trigger an email send using Firebase Functions
    // We'll implement this in a separate file

    return docRef.id
  }

  // Accept an invitation
  async acceptInvitation(invitationId: string, userId: string): Promise<boolean> {
    try {
      await runTransaction(db, async (transaction) => {
        const invitationRef = doc(db, "invitations", invitationId)
        const invitationSnap = await transaction.get(invitationRef)

        if (!invitationSnap.exists()) {
          throw new Error("Invitation not found")
        }

        const invitation = invitationSnap.data() as TeamInvitation

        if (invitation.status !== "pending") {
          throw new Error("Invitation has already been processed")
        }

        const now = new Date()
        if (invitation.expiresAt.toDate() < now) {
          throw new Error("Invitation has expired")
        }

        // Update the invitation status
        transaction.update(invitationRef, {
          status: "accepted",
          acceptedAt: serverTimestamp(),
        })

        // Add the user to the team
        const storeId = invitation.storeId
        const teamMemberRef = doc(db, "stores", storeId, "team", userId)

        // Get user data
        const userRef = doc(db, "users", userId)
        const userSnap = await transaction.get(userRef)

        transaction.set(teamMemberRef, {
          uid: userId,
          email: invitation.email,
          displayName: userSnap.exists() ? userSnap.data().displayName : null,
          photoURL: userSnap.exists() ? userSnap.data().photoURL : null,
          role: invitation.role,
          invitedAt: invitation.invitedAt,
          joinedAt: serverTimestamp(),
          invitedBy: invitation.invitedBy,
        })
      })

      return true
    } catch (error) {
      console.error("Error accepting invitation:", error)
      return false
    }
  }

  // Remove a team member
  async removeTeamMember(storeId: string, userId: string): Promise<void> {
    const teamMemberRef = doc(db, "stores", storeId, "team", userId)
    await deleteDoc(teamMemberRef)
  }

  // Get all stores a user has access to
  async getUserStores(userId: string): Promise<string[]> {
    // First, get stores where user is a team member
    const teamQuery = query(collection(db, "stores"), where(`team.${userId}`, "!=", null))

    // Also get stores where user is the owner
    const ownerQuery = query(collection(db, "stores"), where("ownerId", "==", userId))

    const [teamSnap, ownerSnap] = await Promise.all([getDocs(teamQuery), getDocs(ownerQuery)])

    const stores = new Set<string>()

    teamSnap.docs.forEach((doc) => stores.add(doc.id))
    ownerSnap.docs.forEach((doc) => stores.add(doc.id))

    return Array.from(stores)
  }
}

export const teamService = new TeamService()

