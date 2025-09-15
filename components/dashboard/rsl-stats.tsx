"use client";

import { useEffect, useState } from "react";
import { TrendingUp, FileText, Calendar, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaChartStacked } from "@/components/charts/area-chart-stacked";
import { RadialTextChart } from "@/components/charts/radial-text-chart";

interface RslData {
  id: string;
  websiteUrl: string;
  createdAt: string;
}

interface RslStatsData {
  total: number;
  thisMonth: number;
  thisWeek: number;
  chartData: Array<{
    month: string;
    total: number;
    cumulative: number;
  }>;
  recentRsls: RslData[];
}

export function RslStats() {
  const [stats, setStats] = useState<RslStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRslStats() {
      try {
        const response = await fetch("/api/rsl/stats");
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch RSL stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRslStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-1" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RSLs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time RSL documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Created this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Created this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Licensed websites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <RslRadialChart total={stats.total} />
        <RslTrendChart data={stats.chartData} />
      </div>
    </div>
  );
}

function RslRadialChart({ total }: { total: number }) {
  // Use the actual RadialTextChart with dynamic data
  const chartData = [{ browser: "rsl", visitors: total, fill: "var(--color-rsl)" }];
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Total RSLs</CardTitle>
        <CardDescription>All time created documents</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground">{total}</div>
            <div className="text-sm text-muted-foreground">RSL Documents</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RslTrendChart({ data }: { data: Array<{ month: string; total: number; cumulative: number }> }) {
  // Transform data for AreaChartStacked format
  const chartData = data.map(item => ({
    month: item.month,
    desktop: item.total,
    mobile: Math.max(0, item.cumulative - item.total), // Previous months
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>RSL Creation Trend</CardTitle>
        <CardDescription>
          Monthly RSL creation over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[200px] w-full">
          {/* Simple bar chart visualization */}
          <div className="flex items-end justify-between h-full gap-2">
            {data.map((item, index) => {
              const maxValue = Math.max(...data.map(d => d.total));
              const height = maxValue > 0 ? (item.total / maxValue) * 100 : 10;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-primary/20 rounded-t w-full transition-all hover:bg-primary/30 min-h-[10px]"
                    style={{ height: `${Math.max(10, height)}%` }}
                    title={`${item.month}: ${item.total} RSLs`}
                  />
                  <div className="text-xs text-muted-foreground mt-2">{item.month}</div>
                  <div className="text-xs font-medium">{item.total}</div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
