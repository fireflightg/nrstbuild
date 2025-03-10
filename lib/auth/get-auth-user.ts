import type { NextRequest } from "next/server"
import { auth } from "@/lib/firebase/admin"
import type { DecodedIdToken } from "firebase-admin/auth"

export async function getAuthUser(req: NextRequest): Promise<DecodedIdToken | null> {
  try {
    const authHeader = req.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split("Bearer ")[1]

    if (!token) {
      return null
    }

    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error("Error getting auth user:", error)
    return null
  }
}

