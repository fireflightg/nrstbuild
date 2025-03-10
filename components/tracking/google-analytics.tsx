"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import type { GoogleAnalyticsConfig } from "@/types/integrations"

declare global {
  interface Window {
    gtag: (command: string, action: string, params?: Record<string, any>) => void
  }
}

interface GoogleAnalyticsProps {
  measurementId: string
  config?: Partial<GoogleAnalyticsConfig>
}

export function GoogleAnalytics({ measurementId, config }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!measurementId || !window.gtag) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")

    window.gtag("config", measurementId, {
      page_path: url,
      anonymize_ip: config?.enableAnonymousIp,
      ...config?.customDimensions,
    })
  }, [pathname, searchParams, measurementId, config])

  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              ${config?.enableAnonymousIp ? "anonymize_ip: true," : ""}
              ${config?.enableEcommerce ? "send_page_view: false," : ""}
            });
          `,
        }}
      />
    </>
  )
}

