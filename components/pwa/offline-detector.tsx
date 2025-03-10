"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)

      // Hide the reconnected message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial state
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      {isOffline ? (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>Some features may not be available until you reconnect.</AlertDescription>
        </Alert>
      ) : showReconnected ? (
        <Alert variant="default" className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
          <Wifi className="h-4 w-4" />
          <AlertTitle>Back online</AlertTitle>
          <AlertDescription>You're connected to the internet again.</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

