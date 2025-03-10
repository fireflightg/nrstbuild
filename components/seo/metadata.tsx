import type { SeoSettings } from "@/types/seo"
import type { Metadata } from "next"

export function generateMetadata(
  seo: Partial<SeoSettings>,
  options?: {
    defaultTitle?: string
    defaultDescription?: string
    defaultImage?: string
    siteName?: string
    baseUrl?: string
    pathname?: string
  },
): Metadata {
  const {
    defaultTitle = "NRSTbuild",
    defaultDescription = "Build your online store with NRSTbuild",
    defaultImage = "/og-image.jpg",
    siteName = "NRSTbuild",
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nrstbuild.com",
    pathname = "/",
  } = options || {}

  const currentUrl = `${baseUrl}${pathname}`

  // Use provided values or defaults
  const title = seo.title || defaultTitle
  const description = seo.description || defaultDescription
  const ogTitle = seo.ogTitle || title
  const ogDescription = seo.ogDescription || description
  const ogImage = seo.ogImage || defaultImage
  const ogType = seo.ogType || "website"
  const twitterCard = seo.twitterCard || "summary_large_image"
  const twitterTitle = seo.twitterTitle || ogTitle
  const twitterDescription = seo.twitterDescription || ogDescription
  const twitterImage = seo.twitterImage || ogImage
  const canonicalUrl = seo.canonicalUrl || currentUrl
  const noindex = seo.noindex || false
  const nofollow = seo.nofollow || false

  return {
    title,
    description,
    keywords: seo.keywords,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: ogType,
      url: currentUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      siteName,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      images: [
        {
          url: twitterImage,
          alt: twitterTitle,
        },
      ],
      creator: seo.twitterCreator,
    },
  }
}

