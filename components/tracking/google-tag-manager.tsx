"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import type { GoogleTagManagerConfig } from "@/types/integrations"

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

interface GoogleTagManagerProps {
  containerId: string
  config?: Partial<GoogleTagManagerConfig>
}

export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!containerId || !window.dataLayer) return

    window.dataLayer.push({
      event: "pageview",
      page: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
    })
  }, [pathname, searchParams, containerId])

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${containerId}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  )
}

