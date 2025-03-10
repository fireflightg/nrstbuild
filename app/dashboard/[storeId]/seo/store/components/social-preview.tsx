"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, Facebook, Twitter } from "lucide-react"

interface SocialPreviewProps {
  title: string
  description: string
  image?: string
  url?: string
}

export function SocialPreview({ title, description, image, url = "yourdomain.com" }: SocialPreviewProps) {
  const [activeTab, setActiveTab] = useState("facebook")
  const placeholderImage = "/placeholder.svg?height=630&width=1200"

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Social Media Preview</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="facebook">
            <Facebook className="mr-2 h-4 w-4" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="twitter">
            <Twitter className="mr-2 h-4 w-4" />
            Twitter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facebook">
          <Card>
            <CardContent className="p-0 overflow-hidden">
              <div className="border rounded-t-md overflow-hidden">
                <div className="aspect-[1.91/1] bg-muted relative">
                  {image ? (
                    <img
                      src={image || "/placeholder.svg"}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImage
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No image provided</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-[#f2f3f5]">
                  <div className="text-xs uppercase text-[#606770] truncate">{url}</div>
                  <div className="text-[#1d2129] font-medium text-base line-clamp-1">{title}</div>
                  <div className="text-[#606770] text-sm line-clamp-2">{description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twitter">
          <Card>
            <CardContent className="p-0 overflow-hidden">
              <div className="border rounded-md overflow-hidden">
                <div className="aspect-[2/1] bg-muted relative">
                  {image ? (
                    <img
                      src={image || "/placeholder.svg"}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImage
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No image provided</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white">
                  <div className="text-[#0f1419] font-bold text-base line-clamp-1">{title}</div>
                  <div className="text-[#536471] text-sm line-clamp-2">{description}</div>
                  <div className="text-xs text-[#536471] mt-1 flex items-center">
                    <Globe className="h-3 w-3 mr-1" />
                    <span>{url}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

