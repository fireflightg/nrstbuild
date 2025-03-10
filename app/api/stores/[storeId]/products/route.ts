import { type NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/with-auth"
import { db } from "@/lib/firebase/admin"

async function handler(req: NextRequest, { params }: { params: { storeId: string } }) {
  const { storeId } = params
  const user = (req as any).user // Added by withPermission

  try {
    if (req.method === "GET") {
      // Get all products for the store
      const productsSnapshot = await db.collection("stores").doc(storeId).collection("products").get()

      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return new NextResponse(JSON.stringify({ products }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } else if (req.method === "POST") {
      // Create a new product
      const data = await req.json()

      // Validate the data
      if (!data || typeof data !== "object" || !data.name) {
        return new NextResponse(JSON.stringify({ error: "Invalid product data" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Add metadata
      const productData = {
        ...data,
        storeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        updatedBy: user.uid,
      }

      // Create the product
      const productRef = await db.collection("stores").doc(storeId).collection("products").add(productData)

      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "Product created successfully",
          productId: productRef.id,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      )
    } else {
      return new NextResponse(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("Error handling products request:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Wrap the handler with permission check
export const GET = withPermission(handler, "store", (req, params) => params.storeId, "read")

export const POST = withPermission(handler, "store", (req, params) => params.storeId, "write")

