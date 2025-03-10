"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function PWARegister() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered: ", registration)
          })
          .catch((error) => {
            console.log("Service Worker registration failed: ", error)
          })
      })
    }

    // Handle PWA install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Update UI to notify the user they can add to home screen
      setIsInstallable(true)
    })

    window.addEventListener("appinstalled", () => {
      // Hide the app-provided install promotion
      setIsInstallable(false)
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      // Log install to analytics
      console.log("PWA was installed")
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {})
      window.removeEventListener("appinstalled", () => {})
    }
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      // Hide the install button
      setIsInstallable(false)
    })
  }

  if (!isInstallable) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-8 sm:right-8">
      <Button onClick={handleInstallClick} className="shadow-lg">
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>
    </div>
  )
}

