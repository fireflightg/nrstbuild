import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function InvitationLoading() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="h-7 w-1/3 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-1/2 bg-muted/70 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4">
          <div className="h-5 w-1/4 bg-muted-foreground/20 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between py-1">
                <div className="h-4 w-1/4 bg-muted-foreground/20 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-muted-foreground/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="h-4 w-full bg-muted/70 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted/70 rounded animate-pulse" />

        <div className="flex justify-between pt-4">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

