import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function SeoLoading() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="store">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="store" disabled>
            Store SEO
          </TabsTrigger>
          <TabsTrigger value="sitemap" disabled>
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="robots" disabled>
            Robots.txt
          </TabsTrigger>
        </TabsList>
        <TabsContent value="store" className="mt-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

