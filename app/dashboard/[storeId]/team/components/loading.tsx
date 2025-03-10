export function LoadingTeamMembers() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="h-7 w-1/4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-2/4 bg-muted/70 rounded animate-pulse" />
        </div>
        <div className="p-6 border-t">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="h-7 w-1/4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-2/4 bg-muted/70 rounded animate-pulse" />
        </div>
        <div className="p-6 border-t">
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-1/3 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

