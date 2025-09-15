"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { constructMetadata } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/shared/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// RSL data structure from API
interface RSL {
  id: string;
  websiteUrl: string;
  createdAt: string;
  updatedAt: string;
}

function RSLCard({ rsl }: { rsl: RSL }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWebsiteName = (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Icons.file className="size-5 text-muted-foreground" />
              {getWebsiteName(rsl.websiteUrl)}
            </CardTitle>
            <CardDescription className="mt-1">
              {rsl.websiteUrl}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Icons.arrowUpRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Icons.ellipsis className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icons.clock className="size-4" />
            <span>Created {formatDate(rsl.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.clock className="size-4" />
            <span>Updated {formatDate(rsl.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RSLPage() {
  const [rsls, setRsls] = useState<RSL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRSLs() {
      try {
        const response = await fetch('/api/rsl');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setRsls(result.data || []);
          } else {
            setError('Failed to load RSL data');
          }
        } else {
          setError('Failed to connect to server');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchRSLs();
  }, []);

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="RSL"
          text="Create and manage your RSL configurations."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader
          heading="RSL"
          text="Create and manage your RSL configurations."
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Icons.warning className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading RSLs</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <Icons.arrowRight className="mr-2 size-4" />
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        heading="RSL"
        text="Create and manage your RSL configurations."
      >
        <Link href="/dashboard/rsl/create">
          <Button>
            <Icons.add className="mr-2 size-4" />
            {rsls.length > 0 ? "Create New RSL" : "Create First RSL"}
          </Button>
        </Link>
      </DashboardHeader>
      
      {rsls.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {rsls.map((rsl) => (
            <RSLCard key={rsl.id} rsl={rsl} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <div className="w-full max-w-[400px] mb-6">
            <Image
              src="/images/no-agents.webp"
              alt="No RSLs found"
              width={400}
              height={300}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="text-center space-y-4 max-w-[500px]">
            <h3 className="text-2xl font-bold">No RSLs yet..</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Create your first RSL to start automating support, generating leads, and answering customer questions.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/rsl/create">
                <Button size="lg" className="bg-black text-white hover:bg-black/90">
                  <Icons.add className="mr-2 size-4" />
                  New RSL
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
