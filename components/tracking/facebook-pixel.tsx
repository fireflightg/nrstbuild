"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import type { FacebookPixelConfig } from "@/types/integrations"

declare global {
  interface Window {
    fbq: (command: string, action: string, params?: Record<string, any>) => void
  }
}

interface FacebookPixelProps {
  pixelId: string
  config?: Partial<FacebookPixelConfig>
}

export function FacebookPixel({ pixelId, config }: FacebookPixelProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pixelId || !window.fbq) return

    window.fbq("track", "PageView")
  }, [pathname, searchParams, pixelId])

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
            ${config?.enableAdvancedMatching ? `fbq('init', '${pixelId}', ${JSON.stringify(config.enableAdvancedMatching)});` : ""}
            ${config?.enableAutomaticEvents ? `fbq('dataProcessingOptions', []);` : ""}
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

