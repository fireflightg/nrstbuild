"use client"

import type React from "react"

import { Package, BarChart3, CreditCard, Users, LayoutDashboard, Globe, Share2, Sliders } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"

// Import the usePermissions hook
import { usePermissions } from "@/lib/hooks/usePermissions"

interface DashboardNavProps {
  children?: React.ReactNode
}

const DashboardNav = ({ children }: DashboardNavProps) => {
  const pathname = usePathname()

  // Inside your DashboardNav component, add:
  const { storeId } = useParams()
  const { can, isOwner } = usePermissions(storeId as string)

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="px-4 text-lg font-semibold tracking-tight">Dashboard</h2>
        <ul>
          <li>
            <Link
              href={`/dashboard/${storeId}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === `/dashboard/${storeId}` ? "bg-accent" : "transparent",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="space-y-1">
        <h2 className="px-4 text-lg font-semibold tracking-tight">Manage</h2>
        <ul>
          {/* Show billing only to owners */}
          {isOwner && (
            <li>
              <Link
                href={`/dashboard/${storeId}/billing`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === `/dashboard/${storeId}/billing` ? "bg-accent" : "transparent",
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing</span>
              </Link>
            </li>
          )}

          {/* Show team management only to owners */}
          {isOwner && (
            <li>
              <Link
                href={`/dashboard/${storeId}/team`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === `/dashboard/${storeId}/team` ? "bg-accent" : "transparent",
                )}
              >
                <Users className="h-4 w-4" />
                <span>Team</span>
              </Link>
            </li>
          )}

          {/* Show products to owners and editors */}
          {can("read", "product") && (
            <li>
              <Link
                href={`/dashboard/${storeId}/products`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === `/dashboard/${storeId}/products` ? "bg-accent" : "transparent",
                )}
              >
                <Package className="h-4 w-4" />
                <span>Products</span>
              </Link>
            </li>
          )}
          <li>
            <Link
              href={`/dashboard/${storeId}/analytics`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === `/dashboard/${storeId}/analytics` ? "bg-accent" : "transparent",
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </li>
          <li>
            <Link
              href={`/dashboard/${storeId}/marketing`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith(`/dashboard/${storeId}/marketing`) ? "bg-accent" : "transparent",
              )}
            >
              <Share2 className="h-4 w-4" />
              <span>Marketing</span>
            </Link>
          </li>
          <li>
            <Link
              href={`/dashboard/${storeId}/seo`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith(`/dashboard/${storeId}/seo`) ? "bg-accent" : "transparent",
              )}
            >
              <Globe className="h-4 w-4" />
              <span>SEO</span>
            </Link>
          </li>
          <li>
            <Link
              href={`/dashboard/${storeId}/integrations`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith(`/dashboard/${storeId}/integrations`) ? "bg-accent" : "transparent",
              )}
            >
              <Share2 className="h-4 w-4" />
              <span>Integrations</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="space-y-1">
        <h2 className="px-4 text-lg font-semibold tracking-tight">Settings</h2>
        <ul>
          <li>
            <Link
              href={`/dashboard/${storeId}/settings`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === `/dashboard/${storeId}/settings` ? "bg-accent" : "transparent",
              )}
            >
              <Sliders className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default DashboardNav

