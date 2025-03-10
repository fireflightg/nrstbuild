import { type NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "./get-auth-user"
import { verifyPermission } from "./verify-permissions"

type ApiHandler = (req: NextRequest, params: any) => Promise<NextResponse>

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, params: any) => {
    try {
      const user = await getAuthUser(req)

      if (!user) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }
      // Add the user to the request for the handler to use
      ;(req as any).user = user

      return handler(req, params)
    } catch (error) {
      console.error("Error in withAuth:", error)
      return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}

export function withPermission(
  handler: ApiHandler,
  resourceType: string,
  getResourceId: (req: NextRequest, params: any) => string,
  permission: "read" | "write" | "delete" | "admin",
): ApiHandler {
  return async (req: NextRequest, params: any) => {
    try {
      const user = await getAuthUser(req)

      if (!user) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      const resourceId = getResourceId(req, params)

      const hasPermission = await verifyPermission(user, resourceType, resourceId, permission)

      if (!hasPermission) {
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
      // Add the user to the request for the handler to use
      ;(req as any).user = user

      return handler(req, params)
    } catch (error) {
      console.error("Error in withPermission:", error)
      return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}

