"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, ExternalLink, Edit, Trash, Copy, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface ResponsiveStoreCardProps {
  id: string
  name: string
  description?: string
  logo?: string
  url?: string
  status?: "active" | "pending" | "disabled"
  lastUpdated?: Date
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
}

export function ResponsiveStoreCard({
  id,
  name,
  description,
  logo,
  url,
  status = "active",
  lastUpdated,
  onDelete,
  onDuplicate,
}: ResponsiveStoreCardProps) {
  const router = useRouter()
  const { isMobile } = useMobile()
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = () => {
    router.push(`/dashboard/${id}`)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(id)
  }

  const handleDuplicate = () => {
    if (onDuplicate) onDuplicate(id)
  }

  const statusColors = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    disabled: "bg-gray-500",
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md",
        isLoading && "opacity-60 pointer-events-none",
      )}
    >
      <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="line-clamp-1">{name}</CardTitle>
          {!isMobile && description && <CardDescription className="line-clamp-2">{description}</CardDescription>}
        </div>
        <div className="flex items-center space-x-2">
          <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {url && (
                <DropdownMenuItem asChild>
                  <Link href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Store
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
            {logo ? (
              <Image src={logo || "/placeholder.svg"} alt={name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            {isMobile && description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
            {url && <p className="text-xs text-muted-foreground truncate">{url.replace(/^https?:\/\//, "")}</p>}
            {lastUpdated && <p className="text-xs text-muted-foreground">Updated {lastUpdated.toLocaleDateString()}</p>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <Button variant="default" size={isMobile ? "sm" : "default"} className="flex-1" onClick={handleEdit}>
          Manage Store
        </Button>
        {url && (
          <Button variant="outline" size={isMobile ? "sm" : "default"} asChild>
            <Link href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function StoreCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-2/3" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </CardFooter>
    </Card>
  )
}

