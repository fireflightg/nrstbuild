"use client"

import Head from "next/head"
import { useRouter } from "next/router"
import type { SeoSettings } from "@/types/seo"

interface MetaTagsProps {
  seo: Partial<SeoSettings>
  defaultTitle?: string
  defaultDescription?: string
  defaultImage?: string
  siteName?: string
}

export function MetaTags({
  seo,
  defaultTitle = "NRSTbuild",
  defaultDescription = "Build your online store with NRSTbuild",
  defaultImage = "/og-image.jpg",
  siteName = "NRSTbuild",
}: MetaTagsProps) {
  const router = useRouter()
  const currentUrl = `${process.env.NEXT_PUBLIC_APP_URL}${router.asPath}`

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

  // Structured data
  const structuredDataScript = seo.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`
    : null

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {seo.keywords && seo.keywords.length > 0 && <meta name="keywords" content={seo.keywords.join(", ")} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots Meta Tags */}
      {(noindex || nofollow) && (
        <meta name="robots" content={`${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}`} />
      )}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      <meta name="twitter:image" content={twitterImage} />
      {seo.twitterCreator && <meta name="twitter:creator" content={seo.twitterCreator} />}

      {/* Structured Data */}
      {structuredDataScript && <div dangerouslySetInnerHTML={{ __html: structuredDataScript }} />}
    </Head>
  )
}

