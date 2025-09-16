import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/shared/icons"
import Link from "next/link"

export default function RSLReviewLoading() {
  return (
    <>
      <DashboardHeader
        heading="RSL Review"
        text="Loading RSL document..."
      >
        <div className="flex gap-2">
          <Link href="/dashboard/rsl">
            <Button variant="outline">
              <Icons.arrowLeft className="mr-2 size-4" />
              Back
            </Button>
          </Link>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </DashboardHeader>

      <div className="flex">
        <div className="w-3/5 min-w-0 flex-1 pr-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  <Skeleton className="h-7 w-48" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-80" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                  <div className="h-96 rounded-lg border bg-background">
                    <div className="space-y-2 p-4">
                      {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Loading */}
        <div 
          className="sticky top-0 h-screen w-2/5 overflow-y-auto p-6 bg-muted/30 dark:bg-muted/20"
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
