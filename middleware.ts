import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/firebase/admin"

export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes and public API routes
  if (
    !request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.startsWith("/api/public/") ||
    request.nextUrl.pathname.startsWith("/api/webhooks/")
  ) {
    return NextResponse.next()
  }

  try {
    // Get the Authorization header
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse(JSON.stringify({ error: "Missing or invalid authorization token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1]

    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Missing token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    try {
      // Verify the token with Firebase Admin
      await auth.verifyIdToken(token)

      // Token is valid, proceed to the API route
      return NextResponse.next()
    } catch (error) {
      console.error("Error verifying auth token:", error)
      return new NextResponse(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("Middleware error:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: "/api/:path*",
}

