import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { PWARegister } from "@/components/pwa/pwa-register"
import { OfflineDetector } from "@/components/pwa/offline-detector"
import { OfflineActionHandler } from "@/components/pwa/offline-action-handler"
import { ResponsiveHeader } from "@/components/layout/responsive-header"
import { ResponsiveFooter } from "@/components/layout/responsive-footer"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "NRSTbuild - Website Builder for Creators",
    template: "%s | NRSTbuild",
  },
  description: "Build and customize your website, manage sales, and grow your business",
  manifest: "/manifest.json",
  themeColor: "#0070f3",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NRSTbuild",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <ResponsiveHeader />
            <main className="flex-1">{children}</main>
            <ResponsiveFooter />
          </div>
          <Toaster />
          <PWARegister />
          <OfflineDetector />
          <OfflineActionHandler />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'