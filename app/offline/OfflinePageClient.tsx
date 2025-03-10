"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, WifiOff } from "lucide-react"

export default function OfflinePageClient() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">You're Offline</h1>
          <p className="text-sm text-muted-foreground">
            It looks like you're not connected to the internet. Some features may not be available.
          </p>
        </div>
        <div className="grid gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    </div>
  )
}

