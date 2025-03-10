"use client"

import { useEffect, useState } from "react"
import { MoveRight, Users, Mail, Ticket } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { marketingService } from "@/lib/services/marketingService"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MarketingOverview({ storeId }: { storeId: string }) {
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [campaignCount, setCampaignCount] = useState(0)
  const [couponCount, setCouponCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        const [subscribers, campaigns, coupons] = await Promise.all([
          marketingService.getSubscribers(storeId),
          marketingService.getEmailCampaigns(storeId),
          marketingService.getCoupons(storeId, "active"),
        ])

        setSubscriberCount(subscribers.filter((s) => s.status === "subscribed").length)
        setCampaignCount(campaigns.length)
        setCouponCount(coupons.length)
      } catch (error) {
        console.error("Error fetching marketing overview:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [storeId])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : subscriberCount}
          </div>
          <p className="text-xs text-muted-foreground">People receiving your emails</p>
        </CardContent>
        <CardFooter>
          <Link href={`/dashboard/${storeId}/marketing/subscribers`} className="w-full">
            <Button variant="outline" className="w-full">
              <span>Manage Subscribers</span>
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : campaignCount}
          </div>
          <p className="text-xs text-muted-foreground">Total campaigns created</p>
        </CardContent>
        <CardFooter>
          <Link href={`/dashboard/${storeId}/marketing/campaigns`} className="w-full">
            <Button variant="outline" className="w-full">
              <span>View Campaigns</span>
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : couponCount}
          </div>
          <p className="text-xs text-muted-foreground">Currently available discount codes</p>
        </CardContent>
        <CardFooter>
          <Link href={`/dashboard/${storeId}/marketing/coupons`} className="w-full">
            <Button variant="outline" className="w-full">
              <span>Manage Coupons</span>
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

