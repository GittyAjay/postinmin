"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUpIcon } from "lucide-react";
import { format, subDays } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsCharts } from "@/components/dashboard/analytics-chart";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsSummary, Business } from "@/types/business";
import { EmotionBadge } from "@/components/dashboard/emotion-badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

const fetchAnalytics = async (businessId?: string, range = 30) => {
  if (!businessId) return undefined;
  const response = await api.get(endpoints.analytics, {
    params: {
      businessId,
      from: format(subDays(new Date(), range), "yyyy-MM-dd"),
    },
  });
  return response.data as AnalyticsSummary;
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const { data: businesses = [] } = useQuery({
    queryKey: queryKeys.business,
    queryFn: fetchBusinesses,
    placeholderData: [],
  });
  const activeBusiness = businesses[0];

  const { data: analytics, isLoading } = useQuery({
    queryKey: queryKeys.analytics(activeBusiness?.id, String(range)),
    queryFn: () => fetchAnalytics(activeBusiness?.id, range),
    enabled: Boolean(activeBusiness?.id),
  });

  const heroStats = useMemo(() => {
    if (!analytics) return null;
    const impressions = analytics.totals._sum.impressions ?? 0;
    const likes = analytics.totals._sum.likes ?? 0;
    const edits = analytics.totals._sum.edits ?? 0;
    return [
      { label: "Impressions", value: impressions.toLocaleString(), trend: "+18.4%" },
      { label: "Likes", value: likes.toLocaleString(), trend: "+6.1%" },
      { label: "Edits requested", value: edits.toLocaleString(), trend: "-3.4%" },
    ];
  }, [analytics]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Emotion analytics</h1>
        <p className="text-sm text-slate-500">
          Measure how each emotional tone performs and uncover which templates spark action.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[7, 30, 90].map((value) => (
          <Button
            key={value}
            variant={range === value ? "default" : "outline"}
            className={range === value ? "bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200"}
            onClick={() => setRange(value as 7 | 30 | 90)}
          >
            Last {value} days
          </Button>
        ))}
      </div>

      {isLoading || !analytics ? (
        <Skeleton className="h-60 rounded-3xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {heroStats?.map((stat) => (
            <Card key={stat.label} className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <div className="rounded-full bg-blue-600/10 p-2 text-blue-600">
                  <TrendingUpIcon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</div>
                <p className="text-xs text-blue-600">{stat.trend} vs previous period</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Performance insights</CardTitle>
            <CardDescription>Visualize engagement by emotion and post timeline.</CardDescription>
          </div>
          <Button variant="outline" className="border-blue-200 text-blue-600" onClick={() => setRange(30)}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh insights
          </Button>
        </CardHeader>
        <CardContent>{analytics ? <AnalyticsCharts data={analytics} /> : <Skeleton className="h-64 rounded-2xl" />}</CardContent>
      </Card>

      {analytics?.perPost.length ? (
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Top performing posts</CardTitle>
            <CardDescription>Emotions and templates that produced the strongest uplift.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {analytics.perPost.slice(0, 6).map((post) => (
              <div
                key={post.postId}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex items-center gap-3">
                  <EmotionBadge emotion={post.postId.split("_")[0]} />
                  <span className="text-slate-600 dark:text-slate-300">{post.postId}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Impressions: {post._sum.impressions ?? 0}</span>
                  <span>Likes: {post._sum.likes ?? 0}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

