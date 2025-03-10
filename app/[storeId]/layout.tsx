import type React from "react"
import { Suspense } from "react"
import { TrackingScripts } from "@/components/tracking/tracking-scripts"

interface StoreLayoutProps {
  children: React.ReactNode
  params: {
    storeId: string
  }
}

export default function StoreLayout({ children, params }: StoreLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <TrackingScripts storeId={params.storeId} />
      </Suspense>
      {children}
    </>
  )
}

