export interface SocialMediaWidget {
  id: string
  type: "youtube" | "twitch" | "spotify" | "instagram" | "twitter" | "tiktok"
  url: string
  embedCode?: string
  title?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  loop?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TrackingIntegration {
  id: string
  storeId: string
  type: "google_analytics" | "facebook_pixel" | "google_tag_manager" | "hotjar" | "tiktok_pixel"
  trackingId: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GoogleAnalyticsConfig {
  measurementId: string
  enableAnonymousIp?: boolean
  enableEcommerce?: boolean
  enableCrossDomainLinking?: boolean
  customDimensions?: Record<string, string>
}

export interface FacebookPixelConfig {
  pixelId: string
  enableAdvancedMatching?: boolean
  enableAutomaticEvents?: boolean
}

export interface GoogleTagManagerConfig {
  containerId: string
}

export interface HotjarConfig {
  siteId: string
}

export interface TikTokPixelConfig {
  pixelId: string
}

