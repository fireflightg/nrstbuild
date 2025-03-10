import { collection, doc, getDoc, getDocs, query, where, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type {
  SeoSettings,
  StoreSeoSettings,
  PageSeoSettings,
  ProductSeoSettings,
  SitemapConfig,
  RobotsTxtConfig,
  SitemapEntry,
} from "@/types/seo"

class SeoService {
  // Store SEO settings
  async getStoreSeoSettings(storeId: string): Promise<StoreSeoSettings | null> {
    try {
      const docRef = doc(db, "stores", storeId, "settings", "seo")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { storeId, ...docSnap.data() } as StoreSeoSettings
      }

      return null
    } catch (error) {
      console.error("Error getting store SEO settings:", error)
      throw error
    }
  }

  async updateStoreSeoSettings(storeId: string, settings: Partial<SeoSettings>): Promise<void> {
    try {
      const docRef = doc(db, "stores", storeId, "settings", "seo")
      await setDoc(
        docRef,
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error updating store SEO settings:", error)
      throw error
    }
  }

  // Page SEO settings
  async getPageSeoSettings(storeId: string, pageId: string): Promise<PageSeoSettings | null> {
    try {
      const docRef = doc(db, "stores", storeId, "pages", pageId, "settings", "seo")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { storeId, pageId, ...docSnap.data() } as PageSeoSettings
      }

      return null
    } catch (error) {
      console.error("Error getting page SEO settings:", error)
      throw error
    }
  }

  async updatePageSeoSettings(storeId: string, pageId: string, settings: Partial<SeoSettings>): Promise<void> {
    try {
      const docRef = doc(db, "stores", storeId, "pages", pageId, "settings", "seo")
      await setDoc(
        docRef,
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error updating page SEO settings:", error)
      throw error
    }
  }

  // Product SEO settings
  async getProductSeoSettings(storeId: string, productId: string): Promise<ProductSeoSettings | null> {
    try {
      const docRef = doc(db, "stores", storeId, "products", productId, "settings", "seo")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { storeId, productId, ...docSnap.data() } as ProductSeoSettings
      }

      return null
    } catch (error) {
      console.error("Error getting product SEO settings:", error)
      throw error
    }
  }

  async updateProductSeoSettings(storeId: string, productId: string, settings: Partial<SeoSettings>): Promise<void> {
    try {
      const docRef = doc(db, "stores", storeId, "products", productId, "settings", "seo")
      await setDoc(
        docRef,
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error updating product SEO settings:", error)
      throw error
    }
  }

  // Sitemap configuration
  async getSitemapConfig(storeId: string): Promise<SitemapConfig | null> {
    try {
      const docRef = doc(db, "stores", storeId, "settings", "sitemap")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { storeId, ...docSnap.data() } as SitemapConfig
      }

      return null
    } catch (error) {
      console.error("Error getting sitemap config:", error)
      throw error
    }
  }

  async updateSitemapConfig(storeId: string, config: Partial<SitemapConfig>): Promise<void> {
    try {
      const docRef = doc(db, "stores", storeId, "settings", "sitemap")
      await setDoc(
        docRef,
        {
          ...config,
          lastUpdated: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error updating sitemap config:", error)
      throw error
    }
  }

  // Robots.txt configuration
  async getRobotsTxtConfig(storeId: string): Promise<RobotsTxtConfig | null> {
    try {
      const docRef = doc(db, "stores", storeId, "settings", "robotsTxt")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { storeId, ...docSnap.data() } as RobotsTxtConfig
      }

      return null
    } catch (error) {
      console.error("Error getting robots.txt config:", error)
      throw error
    }
  }

  async updateRobotsTxtConfig(storeId: string, config: Partial<RobotsTxtConfig>): Promise<void> {
    try {
      const docRef = doc(db, "stores", storeId, "settings", "robotsTxt")
      await setDoc(
        docRef,
        {
          ...config,
          lastUpdated: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error updating robots.txt config:", error)
      throw error
    }
  }

  // Generate sitemap entries
  async generateSitemapEntries(storeId: string): Promise<SitemapEntry[]> {
    try {
      const config = await this.getSitemapConfig(storeId)
      if (!config || !config.baseUrl) {
        throw new Error("Sitemap configuration not found or missing base URL")
      }

      const entries: SitemapEntry[] = [
        {
          url: config.baseUrl,
          priority: 1.0,
          changeFrequency: "weekly",
        },
      ]

      // Add store pages
      if (config.includePages) {
        const pagesQuery = query(collection(db, "stores", storeId, "pages"), where("published", "==", true))
        const pagesSnapshot = await getDocs(pagesQuery)

        pagesSnapshot.forEach((doc) => {
          const pageData = doc.data()
          if (pageData.slug && !config.excludeUrls.includes(`/${pageData.slug}`)) {
            entries.push({
              url: `${config.baseUrl}/${pageData.slug}`,
              lastModified: pageData.updatedAt?.toDate(),
              priority: 0.8,
              changeFrequency: "weekly",
            })
          }
        })
      }

      // Add products
      if (config.includeProducts) {
        const productsQuery = query(collection(db, "stores", storeId, "products"), where("published", "==", true))
        const productsSnapshot = await getDocs(productsQuery)

        productsSnapshot.forEach((doc) => {
          const productData = doc.data()
          if (productData.slug && !config.excludeUrls.includes(`/products/${productData.slug}`)) {
            entries.push({
              url: `${config.baseUrl}/products/${productData.slug}`,
              lastModified: productData.updatedAt?.toDate(),
              priority: 0.7,
              changeFrequency: "weekly",
            })
          }
        })
      }

      // Add blog posts
      if (config.includeBlog) {
        const blogQuery = query(collection(db, "stores", storeId, "blog"), where("published", "==", true))
        const blogSnapshot = await getDocs(blogQuery)

        blogSnapshot.forEach((doc) => {
          const blogData = doc.data()
          if (blogData.slug && !config.excludeUrls.includes(`/blog/${blogData.slug}`)) {
            entries.push({
              url: `${config.baseUrl}/blog/${blogData.slug}`,
              lastModified: blogData.updatedAt?.toDate(),
              priority: 0.6,
              changeFrequency: "weekly",
            })
          }
        })
      }

      // Add additional URLs
      if (config.additionalUrls && config.additionalUrls.length > 0) {
        entries.push(...config.additionalUrls)
      }

      return entries
    } catch (error) {
      console.error("Error generating sitemap entries:", error)
      throw error
    }
  }
}

export const seoService = new SeoService()

