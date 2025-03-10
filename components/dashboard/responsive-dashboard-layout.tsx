"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header?: React.ReactNode
}

export function ResponsiveDashboardLayout({ children, sidebar, header }: ResponsiveDashboardLayoutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Check if mobile on mount and on resize
  useEffect(() => {
    setIsMounted(true)

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      {header}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="hidden w-64 flex-shrink-0 border-r lg:block">
            <ScrollArea className="h-full py-6">{sidebar}</ScrollArea>
          </aside>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute left-4 top-4 z-40 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <ScrollArea className="h-full py-6">{sidebar}</ScrollArea>
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

