export interface SeoSettings {
  id?: string
  title: string
  description: string
  keywords: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: "website" | "article" | "profile" | "book" | "music" | "video"
  twitterCard?: "summary" | "summary_large_image" | "app" | "player"
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  twitterCreator?: string
  canonicalUrl?: string
  noindex?: boolean
  nofollow?: boolean
  structuredData?: Record<string, any>
  updatedAt?: Date
}

export interface StoreSeoSettings extends SeoSettings {
  storeId: string
}

export interface PageSeoSettings extends SeoSettings {
  storeId: string
  pageId: string
  pagePath: string
}

export interface ProductSeoSettings extends SeoSettings {
  storeId: string
  productId: string
}

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
}

export interface SitemapConfig {
  storeId: string
  baseUrl: string
  includeProducts: boolean
  includePages: boolean
  includeBlog: boolean
  excludeUrls: string[]
  additionalUrls: SitemapEntry[]
  lastGenerated?: Date
}

export interface RobotsTxtConfig {
  storeId: string
  allowAll: boolean
  disallowPaths: string[]
  customRules: string[]
  sitemapUrl?: string
  lastUpdated?: Date
}

