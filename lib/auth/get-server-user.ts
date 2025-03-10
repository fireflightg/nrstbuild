import { cookies } from "next/headers"
import { auth } from "@/lib/firebase/admin"

export async function getServerUser() {
  try {
    const sessionCookie = cookies().get("session")?.value

    if (!sessionCookie) {
      return null
    }

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    // Get the user from Firebase Auth
    const user = await auth.getUser(decodedClaims.uid)

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      customClaims: user.customClaims,
    }
  } catch (error) {
    console.error("Error getting server user:", error)
    return null
  }
}

