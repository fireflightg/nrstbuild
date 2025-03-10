"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase/admin"
import type { SeoSettings, SitemapConfig, RobotsTxtConfig } from "@/types/seo"
import { XMLBuilder } from "fast-xml-parser"

// Helper function to check permissions
async function checkPermission(storeId: string, action: string, subject: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { allowed: false, error: "Unauthorized" }
  }

  // Check if user is store owner
  const storeRef = db.collection("stores").doc(storeId)
  const storeDoc = await storeRef.get()

  if (!storeDoc.exists) {
    return { allowed: false, error: "Store not found" }
  }

  const storeData = storeDoc.data()

  // Store owners have all permissions
  if (storeData?.ownerId === session.user.id) {
    return { allowed: true, role: "owner" }
  }

  // Check team membership and role
  const teamMemberRef = storeRef.collection("team").doc(session.user.id)
  const teamMemberDoc = await teamMemberRef.get()

  if (!teamMemberDoc.exists) {
    return { allowed: false, error: "Not a team member" }
  }

  const role = teamMemberDoc.data()?.role

  // Define permissions for each role
  const permissions = {
    owner: ["manage:all"],
    editor: ["create:seo", "read:seo", "update:seo"],
    viewer: ["read:seo"],
  }

  const hasPermission = permissions[role].some((p) => {
    const [permAction, permSubject] = p.split(":")
    return (
      (permAction === "manage" && (permSubject === "all" || permSubject === subject)) ||
      (permAction === action && (permSubject === "all" || permSubject === subject))
    )
  })

  return {
    allowed: hasPermission,
    role,
    error: hasPermission ? null : "Insufficient permissions",
  }
}

// Store SEO Settings
export async function updateStoreSeoSettings(storeId: string, settings: Partial<SeoSettings>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    const seoRef = db.collection("stores").doc(storeId).collection("settings").doc("seo")
    await seoRef.set(
      {
        ...settings,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    revalidatePath(`/dashboard/${storeId}/seo`)
    return { success: true }
  } catch (error) {
    console.error("Error updating store SEO settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Page SEO Settings
export async function updatePageSeoSettings(storeId: string, pageId: string, settings: Partial<SeoSettings>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    const seoRef = db
      .collection("stores")
      .doc(storeId)
      .collection("pages")
      .doc(pageId)
      .collection("settings")
      .doc("seo")
    await seoRef.set(
      {
        ...settings,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    revalidatePath(`/dashboard/${storeId}/pages/${pageId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating page SEO settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Product SEO Settings
export async function updateProductSeoSettings(storeId: string, productId: string, settings: Partial<SeoSettings>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    const seoRef = db
      .collection("stores")
      .doc(storeId)
      .collection("products")
      .doc(productId)
      .collection("settings")
      .doc("seo")
    await seoRef.set(
      {
        ...settings,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    revalidatePath(`/dashboard/${storeId}/products/${productId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating product SEO settings:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Sitemap Configuration
export async function updateSitemapConfig(storeId: string, config: Partial<SitemapConfig>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    const sitemapRef = db.collection("stores").doc(storeId).collection("settings").doc("sitemap")
    await sitemapRef.set(
      {
        ...config,
        lastUpdated: new Date(),
      },
      { merge: true },
    )

    revalidatePath(`/dashboard/${storeId}/seo/sitemap`)
    return { success: true }
  } catch (error) {
    console.error("Error updating sitemap config:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Robots.txt Configuration
export async function updateRobotsTxtConfig(storeId: string, config: Partial<RobotsTxtConfig>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    const robotsRef = db.collection("stores").doc(storeId).collection("settings").doc("robotsTxt")
    await robotsRef.set(
      {
        ...config,
        lastUpdated: new Date(),
      },
      { merge: true },
    )

    revalidatePath(`/dashboard/${storeId}/seo/robots`)
    return { success: true }
  } catch (error) {
    console.error("Error updating robots.txt config:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Generate Sitemap XML
export async function generateSitemapXml(storeId: string) {
  try {
    const { allowed, error } = await checkPermission(storeId, "read", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    // Get sitemap configuration
    const sitemapRef = db.collection("stores").doc(storeId).collection("settings").doc("sitemap")
    const sitemapDoc = await sitemapRef.get()

    if (!sitemapDoc.exists) {
      return { success: false, error: "Sitemap configuration not found" }
    }

    const config = sitemapDoc.data() as SitemapConfig

    if (!config.baseUrl) {
      return { success: false, error: "Base URL is required in sitemap configuration" }
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

    return { success: true, xml }
  } catch (error) {
    console.error("Error generating sitemap XML:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Generate Robots.txt
export async function generateRobotsTxt(storeId: string) {
  try {
    const { allowed, error } = await checkPermission(storeId, "read", "seo")

    if (!allowed) {
      return { success: false, error }
    }

    // Get robots.txt configuration
    const robotsRef = db.collection("stores").doc(storeId).collection("settings").doc("robotsTxt")
    const robotsDoc = await robotsRef.get()

    if (!robotsDoc.exists) {
      return { success: false, error: "Robots.txt configuration not found" }
    }

    const config = robotsDoc.data() as RobotsTxtConfig

    // Build robots.txt content
    let content = "# Generated by NRSTbuild\n"
    content += "User-agent: *\n"

    if (config.allowAll) {
      content += "Allow: /\n"
    } else {
      // Add disallow paths
      if (config.disallowPaths && config.disallowPaths.length > 0) {
        for (const path of config.disallowPaths) {
          content += `Disallow: ${path}\n`
        }
      }
    }

    // Add sitemap URL if available
    if (config.sitemapUrl) {
      content += `\nSitemap: ${config.sitemapUrl}\n`
    }

    // Add custom rules
    if (config.customRules && config.customRules.length > 0) {
      content += "\n# Custom rules\n"
      for (const rule of config.customRules) {
        content += `${rule}\n`
      }
    }

    // Update last updated timestamp
    await robotsRef.update({
      lastUpdated: new Date(),
    })

    return { success: true, content }
  } catch (error) {
    console.error("Error generating robots.txt:", error)
    return { success: false, error: (error as Error).message }
  }
}

