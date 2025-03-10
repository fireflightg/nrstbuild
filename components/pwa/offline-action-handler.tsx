"use client"

import { useEffect, useState } from "react"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { getPendingChanges, clearPendingChange } from "@/lib/utils/offline-storage"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Cloud, CloudOff } from "lucide-react"

export function OfflineActionHandler() {
  const { isOnline, wasOffline } = useOnlineStatus()
  const { toast } = useToast()
  const [pendingChanges, setPendingChanges] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [showSyncAlert, setShowSyncAlert] = useState(false)

  // Check for pending changes when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      checkPendingChanges()
    }
  }, [isOnline, wasOffline])

  // Check for pending changes
  const checkPendingChanges = async () => {
    try {
      const changes = await getPendingChanges()

      if (changes.length > 0) {
        setPendingChanges(changes)
        setShowSyncAlert(true)
      }
    } catch (error) {
      console.error("Error checking pending changes:", error)
    }
  }

  // Sync pending changes
  const syncChanges = async () => {
    if (pendingChanges.length === 0 || !isOnline) return

    setIsSyncing(true)
    setSyncProgress(0)

    try {
      let processed = 0

      for (const change of pendingChanges) {
        try {
          // Process the change based on its type and action
          switch (change.type) {
            case "product":
              // Handle product changes
              await handleProductChange(change)
              break
            case "page":
              // Handle page changes
              await handlePageChange(change)
              break
            case "settings":
              // Handle settings changes
              await handleSettingsChange(change)
              break
            default:
              console.warn(`Unknown change type: ${change.type}`)
          }

          // Clear the processed change
          await clearPendingChange(change.id)

          // Update progress
          processed++
          setSyncProgress(Math.round((processed / pendingChanges.length) * 100))
        } catch (error) {
          console.error(`Error processing change ${change.id}:`, error)
          // Continue with other changes
        }
      }

      // Refresh pending changes
      const remainingChanges = await getPendingChanges()
      setPendingChanges(remainingChanges)

      if (remainingChanges.length === 0) {
        toast({
          title: "Sync complete",
          description: "All changes have been synchronized",
        })
        setShowSyncAlert(false)
      } else {
        toast({
          title: "Sync incomplete",
          description: `${remainingChanges.length} changes could not be synchronized`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error syncing changes:", error)
      toast({
        title: "Sync failed",
        description: "An error occurred while synchronizing changes",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle different types of changes
  const handleProductChange = async (change: any) => {
    // Implementation would depend on your API
    console.log("Handling product change:", change)
    // Example: await productService.syncChange(change)
  }

  const handlePageChange = async (change: any) => {
    // Implementation would depend on your API
    console.log("Handling page change:", change)
    // Example: await pageService.syncChange(change)
  }

  const handleSettingsChange = async (change: any) => {
    // Implementation would depend on your API
    console.log("Handling settings change:", change)
    // Example: await settingsService.syncChange(change)
  }

  if (!showSyncAlert) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-background border shadow-lg">
        {isOnline ? <Cloud className="h-4 w-4 text-blue-500" /> : <CloudOff className="h-4 w-4 text-red-500" />}
        <AlertTitle>{isOnline ? "Changes ready to sync" : "You're offline"}</AlertTitle>
        <AlertDescription className="space-y-2">
          {isOnline ? (
            <>
              <p>You have {pendingChanges.length} changes made while offline.</p>
              {isSyncing && <Progress value={syncProgress} className="h-2 mt-2" />}
              <div className="flex justify-end space-x-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setShowSyncAlert(false)} disabled={isSyncing}>
                  Dismiss
                </Button>
                <Button size="sm" onClick={syncChanges} disabled={isSyncing}>
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </>
          ) : (
            <p>Changes will be synchronized when you're back online.</p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}

