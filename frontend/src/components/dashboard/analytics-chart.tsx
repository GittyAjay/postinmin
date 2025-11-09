"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsSummary } from "@/types/business";
import { getEmotionColor } from "@/lib/emotions";

interface AnalyticsChartProps {
  data: AnalyticsSummary | undefined;
}

export const AnalyticsCharts = ({ data }: AnalyticsChartProps) => {
  const emoData =
    data?.perPost.map((item) => ({
      emotion: item.postId.split("_")[0] ?? "unknown",
      impressions: item._sum.impressions ?? 0,
      likes: item._sum.likes ?? 0,
    })) ?? [];

  const impressionsData =
    data?.perPost.map((item) => ({
      postId: item.postId,
      impressions: item._sum.impressions ?? 0,
    })) ?? [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Engagement by Emotion</CardTitle>
          <CardDescription>Compare impressions and likes for emotional tones.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={emoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="emotion" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="likes" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Posts vs Impressions</CardTitle>
          <CardDescription>Track impression volume across recent generated posts.</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={impressionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="postId" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="impressions" stroke={getEmotionColor("trust")} strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

