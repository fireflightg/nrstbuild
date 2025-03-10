import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase/admin"
import { XMLBuilder } from "fast-xml-parser"

export async function GET(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const storeId = params.storeId

    // Get sitemap configuration
    const sitemapRef = db.collection("stores").doc(storeId).collection("settings").doc("sitemap")
    const sitemapDoc = await sitemapRef.get()

    if (!sitemapDoc.exists) {
      return new NextResponse("Sitemap configuration not found", { status: 404 })
    }

    const config = sitemapDoc.data()

    if (!config.baseUrl) {
      return new NextResponse("Base URL is required in sitemap configuration", { status: 400 })
    }

    // Generate sitemap entries
    const entries = []

    // Add homepage
    entries.push({
      loc: config.baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: 1.0,
    })

    // Add pages
    if (config.includePages) {
      const pagesSnapshot = await db
        .collection("stores")
        .doc(storeId)
        .collection("pages")
        .where("published", "==", true)
        .get()

      for (const doc of pagesSnapshot.docs) {
        const pageData = doc.data()
        if (pageData.slug && !config.excludeUrls.includes(`/${pageData.slug}`)) {
          entries.push({
            loc: `${config.baseUrl}/${pageData.slug}`,
            lastmod: pageData.updatedAt
              ? new Date(pageData.updatedAt.toDate()).toISOString()
              : new Date().toISOString(),
            changefreq: "weekly",
            priority: 0.8,
          })
        }
      }
    }

    // Add products
    if (config.includeProducts) {
      const productsSnapshot = await db
        .collection("stores")
        .doc(storeId)
        .collection("products")
        .where("published", "==", true)
        .get()

      for (const doc of productsSnapshot.docs) {
        const productData = doc.data()
        if (productData.slug && !config.excludeUrls.includes(`/products/${productData.slug}`)) {
          entries.push({
            loc: `${config.baseUrl}/products/${productData.slug}`,
            lastmod: productData.updatedAt
              ? new Date(productData.updatedAt.toDate()).toISOString()
              : new Date().toISOString(),
            changefreq: "weekly",
            priority: 0.7,
          })
        }
      }
    }

    // Add blog posts
    if (config.includeBlog) {
      const blogSnapshot = await db
        .collection("stores")
        .doc(storeId)
        .collection("blog")
        .where("published", "==", true)
        .get()

      for (const doc of blogSnapshot.docs) {
        const blogData = doc.data()
        if (blogData.slug && !config.excludeUrls.includes(`/blog/${blogData.slug}`)) {
          entries.push({
            loc: `${config.baseUrl}/blog/${blogData.slug}`,
            lastmod: blogData.updatedAt
              ? new Date(blogData.updatedAt.toDate()).toISOString()
              : new Date().toISOString(),
            changefreq: "weekly",
            priority: 0.6,
          })
        }
      }
    }

    // Add additional URLs
    if (config.additionalUrls && config.additionalUrls.length > 0) {
      for (const entry of config.additionalUrls) {
        entries.push({
          loc: entry.url,
          lastmod: entry.lastModified ? new Date(entry.lastModified.toDate()).toISOString() : new Date().toISOString(),
          changefreq: entry.changeFrequency || "monthly",
          priority: entry.priority || 0.5,
        })
      }
    }

    // Build XML
    const builder = new XMLBuilder({
      format: true,
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      suppressEmptyNode: true,
    })

    const xmlObj = {
      urlset: {
        "@_xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
        url: entries,
      },
    }

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(xmlObj)

    // Update last generated timestamp
    await sitemapRef.update({
      lastGenerated: new Date(),
    })

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    })
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return new NextResponse("Error generating sitemap", { status: 500 })
  }
}

