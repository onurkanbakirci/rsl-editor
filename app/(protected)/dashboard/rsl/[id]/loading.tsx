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

      <div className="max-w-6xl">
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
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-20" />
              </div>
              <div className="rounded-lg border bg-background h-96">
                <div className="p-4 space-y-2">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
