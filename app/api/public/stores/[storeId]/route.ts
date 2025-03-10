import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase/admin"

export async function GET(req: NextRequest, { params }: { params: { storeId: string } }) {
  const { storeId } = params

  try {
    // Get public store details
    const storeDoc = await db.collection("stores").doc(storeId).get()

    if (!storeDoc.exists) {
      return new NextResponse(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const storeData = storeDoc.data()

    // Only return public fields
    const publicData = {
      id: storeDoc.id,
      name: storeData?.name,
      description: storeData?.description,
      logo: storeData?.logo,
      banner: storeData?.banner,
      customDomain: storeData?.customDomain,
      username: storeData?.username,
      socialLinks: storeData?.socialLinks,
      isActive: storeData?.isActive,
    }

    return new NextResponse(JSON.stringify(publicData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error handling public store request:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

