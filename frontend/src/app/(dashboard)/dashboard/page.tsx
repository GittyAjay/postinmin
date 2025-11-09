"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WalletIcon, CalendarIcon, LayoutTemplateIcon, SparklesIcon, PlusIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format, isAfter, isBefore, parseISO } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmotionBadge } from "@/components/dashboard/emotion-badge";
import { CalendarPostCard } from "@/components/dashboard/calendar-post-card";
import { CalendarStrip } from "@/components/dashboard/calendar-strip";
import { AnalyticsCharts } from "@/components/dashboard/analytics-chart";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Business, ScheduledPost, AnalyticsSummary, Template } from "@/types/business";
import { toast } from "sonner";
import { NEW_BUSINESS_ID, useBusinessStore } from "@/store/business-store";

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

const fetchAnalytics = async (businessId?: string) => {
  if (!businessId) return undefined;
  const response = await api.get(endpoints.analytics, { params: { businessId, emotion: undefined } });
  return response.data as AnalyticsSummary;
};

const fetchPosts = async (businessId?: string) => {
  if (!businessId) return [];
  const response = await api.get(endpoints.posts, { params: { businessId } });
  return response.data as ScheduledPost[];
};

const fetchTemplates = async (businessId?: string) => {
  if (!businessId) return [];
  const response = await api.get(`${endpoints.template}/${businessId}`);
  const data = response.data as Template[];
  return data.map((template) => ({
    ...template,
    backgroundUrl: template.backgroundUrl ?? undefined,
    backgroundColor: template.backgroundColor ?? undefined,
  }));
};

export default function DashboardOverviewPage() {
  const [templateUpdatingPostId, setTemplateUpdatingPostId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const router = useRouter();
  const { activeBusinessId, setActiveBusinessId } = useBusinessStore();

  const { data: businesses = [], isLoading: loadingBusiness } = useQuery({
    queryKey: queryKeys.business,
    queryFn: fetchBusinesses,
    placeholderData: [],
  });

  useEffect(() => {
    if (businesses.length === 0) {
      if (activeBusinessId !== NEW_BUSINESS_ID) {
        setActiveBusinessId(NEW_BUSINESS_ID);
      }
      return;
    }
    if (!activeBusinessId || activeBusinessId === NEW_BUSINESS_ID) {
      setActiveBusinessId(businesses[0].id);
      return;
    }
    const exists = businesses.some((item) => item.id === activeBusinessId);
    if (!exists) {
      setActiveBusinessId(businesses[0].id);
    }
  }, [businesses, activeBusinessId, setActiveBusinessId]);

  const selectedBusiness =
    activeBusinessId && activeBusinessId !== NEW_BUSINESS_ID
      ? businesses.find((item) => item.id === activeBusinessId) ?? null
      : null;

  const { data: analytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: queryKeys.analytics(selectedBusiness?.id, "30"),
    queryFn: () => fetchAnalytics(selectedBusiness?.id),
    enabled: Boolean(selectedBusiness?.id),
  });

  const {
    data: posts = [],
    isLoading: loadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: queryKeys.posts(selectedBusiness?.id),
    queryFn: () => fetchPosts(selectedBusiness?.id),
    enabled: Boolean(selectedBusiness?.id),
    placeholderData: [],
  });

  const { data: templates = [] } = useQuery({
    queryKey: queryKeys.templates(selectedBusiness?.id),
    queryFn: () => fetchTemplates(selectedBusiness?.id),
    enabled: Boolean(selectedBusiness?.id),
    placeholderData: [],
  });

  const templateMap = useMemo(() => {
    const map = new Map<string, Template>();
    templates.forEach((template) => map.set(template.id, template));
    return map;
  }, [templates]);

  const calendarGlanceStart = useMemo(() => format(new Date(), "yyyy-MM-dd"), [selectedBusiness?.id]);
  const glanceDays = 14;

  const nearestUpcomingDate = useMemo(() => {
    if (!posts.length) {
      return calendarGlanceStart;
    }
    const start = parseISO(calendarGlanceStart);
    const upcoming = posts
      .map((post) => ({ post, date: new Date(post.date) }))
      .filter(({ date }) => !isBefore(date, start))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    if (upcoming) {
      return format(upcoming.date, "yyyy-MM-dd");
    }
    return calendarGlanceStart;
  }, [calendarGlanceStart, posts]);

  useEffect(() => {
    setSelectedDate((current) => (current === nearestUpcomingDate ? current : nearestUpcomingDate));
  }, [nearestUpcomingDate]);

  useEffect(() => {
    const start = parseISO(calendarGlanceStart);
    const end = addDays(start, glanceDays - 1);
    const current = parseISO(selectedDate);
    if (isBefore(current, start) || isAfter(current, end)) {
      setSelectedDate(calendarGlanceStart);
    }
  }, [calendarGlanceStart, glanceDays, selectedDate]);

  const selectedPostMatch = useMemo(
    () =>
      posts.find((post) => format(new Date(post.date), "yyyy-MM-dd") === selectedDate) ?? null,
    [posts, selectedDate],
  );

  const placeholderSelectedPost = useMemo(() => {
    const date = parseISO(selectedDate);
    return {
      id: `placeholder-${selectedDate}`,
      businessId: selectedBusiness?.id ?? "",
      date: date.toISOString(),
      status: "PENDING" as const,
      title: `No content scheduled for ${format(date, "MMMM d")}`,
      caption: "Generate to craft personalised copy, emotion, and artwork guidance.",
      variants: [],
    } satisfies ScheduledPost;
  }, [selectedBusiness?.id, selectedDate]);

  const selectedTemplateId = useMemo(() => {
    if (!selectedPostMatch) return null;
    return selectedPostMatch.templateId ?? selectedPostMatch.variants?.[0]?.templateId ?? null;
  }, [selectedPostMatch]);

  const selectedTemplate = selectedTemplateId ? templateMap.get(selectedTemplateId) : undefined;

  const selectedPost = useMemo(() => {
    if (!selectedPostMatch) {
      return placeholderSelectedPost;
    }
    if (selectedTemplateId && selectedPostMatch.templateId !== selectedTemplateId) {
      return { ...selectedPostMatch, templateId: selectedTemplateId };
    }
    return selectedPostMatch;
  }, [placeholderSelectedPost, selectedPostMatch, selectedTemplateId]);

  const selectedIsPlaceholder = !selectedPostMatch;

  const applyTemplate = useMutation({
    mutationFn: async ({ postId, templateId }: { postId: string; templateId: string | null }) => {
      const response = await api.patch(`${endpoints.calendarTemplate}/${postId}`, { templateId });
      return response.data as ScheduledPost;
    },
    onMutate: async ({ postId }) => {
      setTemplateUpdatingPostId(postId);
    },
    onSuccess: async () => {
      toast.success("Template updated");
      await refetchPosts();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update template"),
    onSettled: (_data, _error, variables) => {
      if (!variables) return;
      setTemplateUpdatingPostId((current) => (current === variables.postId ? null : current));
    },
  });

  useEffect(() => {
    if (!selectedBusiness?.id) return;
    void refetchAnalytics();
    void refetchPosts();
  }, [selectedBusiness?.id, refetchAnalytics, refetchPosts]);

  const handleTemplateApply = (post: ScheduledPost, templateId: string | null) => {
    if (!post.id) return;
    applyTemplate.mutate({ postId: post.id, templateId });
  };

  const selectedIsTemplateUpdating =
    !selectedIsPlaceholder && applyTemplate.isPending && templateUpdatingPostId === selectedPostMatch?.id;

  const additionalPosts = useMemo(() => {
    const filtered = selectedPostMatch ? posts.filter((post) => post.id !== selectedPostMatch.id) : posts;
    return filtered.slice(0, selectedPostMatch ? 5 : 6);
  }, [posts, selectedPostMatch]);

  const handleBusinessChange = (value: string) => {
    if (value === NEW_BUSINESS_ID) {
      setActiveBusinessId(NEW_BUSINESS_ID);
      router.push("/dashboard/business");
      return;
    }
    setActiveBusinessId(value);
  };

  const selectValue =
    selectedBusiness?.id ?? (activeBusinessId === NEW_BUSINESS_ID ? NEW_BUSINESS_ID : "");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Orchestrate calendars, templates, and performance in one serene workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectValue || undefined}
            onValueChange={handleBusinessChange}
            disabled={businesses.length === 0}
          >
            <SelectTrigger className="min-w-[220px] rounded-xl border border-slate-200 bg-white text-left text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-80 min-w-[240px]">
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_BUSINESS_ID} className="text-blue-600 focus:text-blue-600">
                <span className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Create new project
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/dashboard/templates">
              <LayoutTemplateIcon className="mr-2 h-4 w-4" />
              Template builder
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active project",
            value: loadingBusiness ? <Skeleton className="h-6 w-40" /> : selectedBusiness?.name ?? "No project linked",
            icon: <WalletIcon className="h-4 w-4" />,
          },
          {
            label: "Next scheduled post",
            value:
              loadingPosts || !posts.length ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                format(new Date(posts[0].date), "MMM d")
              ),
            icon: <CalendarIcon className="h-4 w-4" />,
          },
          {
            label: "Primary emotion",
            value: loadingPosts || !posts.length ? <Skeleton className="h-6 w-24" /> : <EmotionBadge emotion={posts[0].emotion} />,
            icon: <SparklesIcon className="h-4 w-4" />,
          },
          {
            label: "Analytics sample size",
            value: loadingAnalytics ? <Skeleton className="h-6 w-20" /> : analytics?.totals?._count ?? 0,
            icon: <LayoutTemplateIcon className="h-4 w-4" />,
          },
        ].map((card) => (
          <Card key={card.label} className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{card.label}</CardDescription>
              <div className="rounded-full bg-blue-600/10 p-2 text-blue-600">{card.icon}</div>
            </CardHeader>
            <CardContent className="text-lg font-semibold text-slate-900 dark:text-white">{card.value}</CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming posts</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/calendar">Open calendar</Link>
          </Button>
        </div>
        {loadingPosts ? (
          <div className="space-y-5">
            <Skeleton className="h-48 rounded-3xl" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-48 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.3em]">
                      Calendar glance
                    </CardDescription>
                    <CardTitle className="text-base text-slate-900 dark:text-white">Pick a day to inspect content.</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="px-2 text-blue-600 hover:text-blue-700" asChild>
                    <Link href="/dashboard/calendar">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Calendar
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="-mx-1 pb-5">
                <CalendarStrip
                  startDate={calendarGlanceStart}
                  days={glanceDays}
                  posts={posts}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <CalendarPostCard
                post={selectedPost}
                template={selectedTemplate}
                templates={templates}
                onTemplateChange={handleTemplateApply}
                isTemplateUpdating={selectedIsTemplateUpdating}
                isPlaceholder={selectedIsPlaceholder}
                isSelected
              />
              {additionalPosts.map((post) => {
                const templateId = post.templateId ?? post.variants?.[0]?.templateId ?? null;
                const template = templateId ? templateMap.get(templateId) : undefined;
                const normalizedPost =
                  templateId && post.templateId !== templateId ? { ...post, templateId } : post;
                const isTemplateUpdating = applyTemplate.isPending && templateUpdatingPostId === post.id;
                const postDateKey = format(new Date(post.date), "yyyy-MM-dd");
                return (
                  <CalendarPostCard
                    key={post.id}
                    post={normalizedPost}
                    template={template}
                    templates={templates}
                    onTemplateChange={handleTemplateApply}
                    isTemplateUpdating={isTemplateUpdating}
                    isSelected={postDateKey === selectedDate}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Emotion analytics</h2>
            <p className="text-sm text-slate-500">
              Understand how each emotional tone performs across impressions and likes.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/analytics">View analytics</Link>
          </Button>
        </div>
        {loadingAnalytics ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <AnalyticsCharts data={analytics} />
        )}
      </section>
    </div>
  );
}

