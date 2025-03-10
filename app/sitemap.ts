import type { MetadataRoute } from "next"
import { db } from "@/lib/firebase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nrstbuild.com"

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  // Get public blog posts
  try {
    const blogPosts = await db.collection("blog").where("published", "==", true).get()

    for (const post of blogPosts.docs) {
      const data = post.data()
      routes.push({
        url: `${baseUrl}/blog/${data.slug}`,
        lastModified: data.updatedAt ? new Date(data.updatedAt.toDate()) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error)
  }

  return routes
}

