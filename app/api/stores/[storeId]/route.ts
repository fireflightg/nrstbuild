import { type NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/with-auth"
import { db } from "@/lib/firebase/admin"

async function handler(req: NextRequest, { params }: { params: { storeId: string } }) {
  const { storeId } = params
  const user = (req as any).user // Added by withPermission

  try {
    if (req.method === "GET") {
      // Get store details
      const storeDoc = await db.collection("stores").doc(storeId).get()

      if (!storeDoc.exists) {
        return new NextResponse(JSON.stringify({ error: "Store not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

      return new NextResponse(JSON.stringify({ id: storeDoc.id, ...storeDoc.data() }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } else if (req.method === "PUT" || req.method === "PATCH") {
      // Update store details
      const data = await req.json()

      // Validate the data
      if (!data || typeof data !== "object") {
        return new NextResponse(JSON.stringify({ error: "Invalid request body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Remove sensitive fields that shouldn't be updated directly
      const { ownerId, createdAt, ...updateData } = data

      // Add audit fields
      updateData.updatedAt = new Date().toISOString()
      updateData.updatedBy = user.uid

      // Update the store
      await db.collection("stores").doc(storeId).update(updateData)

      return new NextResponse(JSON.stringify({ success: true, message: "Store updated successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } else if (req.method === "DELETE") {
      // Delete the store
      await db.collection("stores").doc(storeId).delete()

      return new NextResponse(JSON.stringify({ success: true, message: "Store deleted successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } else {
      return new NextResponse(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("Error handling store request:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Wrap the handler with permission check
export const GET = withPermission(handler, "store", (req, params) => params.storeId, "read")

export const PUT = withPermission(handler, "store", (req, params) => params.storeId, "write")

export const PATCH = withPermission(handler, "store", (req, params) => params.storeId, "write")

export const DELETE = withPermission(handler, "store", (req, params) => params.storeId, "delete")

