import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function IntegrationsLoading() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="social-media">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="social-media" disabled>
            Social Media Widgets
          </TabsTrigger>
          <TabsTrigger value="tracking" disabled>
            Tracking & Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="social-media" className="mt-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
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

