"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format, isAfter, isBefore, parseISO } from "date-fns";
import { Loader2, PlusIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarGrid } from "@/components/dashboard/calendar-grid";
import { CalendarStrip } from "@/components/dashboard/calendar-strip";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Business, ScheduledPost, Template } from "@/types/business";
import { showAIGenerationToast } from "@/components/dashboard/ai-status-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NEW_BUSINESS_ID, useBusinessStore } from "@/store/business-store";

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
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

export default function CalendarPage() {
  const [days, setDays] = useState(30);
  const [startDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedDate, setSelectedDate] = useState(startDate);
  const [templateUpdatingPostId, setTemplateUpdatingPostId] = useState<string | null>(null);

  const router = useRouter();
  const { activeBusinessId, setActiveBusinessId } = useBusinessStore();

  const { data: businesses = [] } = useQuery({
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

  const { data: posts = [], isLoading: isLoadingPosts, refetch } = useQuery({
    queryKey: queryKeys.calendar(selectedBusiness?.id),
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

  const generate = useMutation({
    mutationFn: async () => {
      if (!selectedBusiness?.id) throw new Error("No business selected");
      await api.post(endpoints.calendar, {
        businessId: selectedBusiness.id,
        startDate: format(new Date(), "yyyy-MM-dd"),
        days,
        variants: 1,
      });
    },
    onSuccess: () => {
      toast.success("Calendar refreshed");
      void refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to generate calendar");
    },
  });

  const handleGenerate = async () => {
    if (!selectedBusiness?.id) {
      toast.error("Select a business before generating a calendar.");
      return;
    }
    const toastHandle = showAIGenerationToast("Producing a fresh calendar infused with your brand voice.");
    try {
      await generate.mutateAsync();
      toastHandle.dismiss("Calendar generated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toastHandle.error(message);
    }
  };

  const applyTemplate = useMutation({
    mutationFn: async ({ postId, templateId }: { postId: string; templateId: string | null }) => {
      const response = await api.patch(`${endpoints.calendarTemplate}/${postId}`, { templateId });
      return response.data as ScheduledPost;
    },
    onMutate: async ({ postId }) => {
      setTemplateUpdatingPostId(postId);
    },
    onSuccess: () => {
      toast.success("Template updated");
      void refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update template"),
    onSettled: (_data, _error, variables) => {
      if (!variables) return;
      setTemplateUpdatingPostId((current) => (current === variables.postId ? null : current));
    },
  });

  const handleTemplateApply = (post: ScheduledPost, templateId: string | null) => {
    if (!post.id) return;
    applyTemplate.mutate({ postId: post.id, templateId });
  };

  useEffect(() => {
    const start = parseISO(startDate);
    const end = addDays(start, days - 1);
    const current = parseISO(selectedDate);
    if (isBefore(current, start) || isAfter(current, end)) {
      setSelectedDate(startDate);
    }
  }, [days, selectedDate, startDate]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">AI calendar</h1>
        <p className="text-sm text-slate-500">
          Review and refine the {days}-day plan generated by DeepSeek. Each card blends emotion, copy, and template guidance.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Generation controls</CardTitle>
              <CardDescription>
                Select how many days of content to produce and let the emotion engine orchestrate the plan.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={selectValue || undefined}
                onValueChange={handleBusinessChange}
                disabled={businesses.length === 0}
              >
                <SelectTrigger className="min-w-[220px] rounded-xl border border-slate-200 bg-white text-left text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <SelectValue placeholder="Select a business" />
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
                      Create new business
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveBusinessId(NEW_BUSINESS_ID);
                  router.push("/dashboard/business");
                }}
              >
                Manage businesses
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {[7, 14, 30, 45].map((value) => (
                <option key={value} value={value}>
                  {value} days
                </option>
              ))}
            </select>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleGenerate}
              disabled={!selectedBusiness || generate.isPending}
            >
              {generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCwIcon className="mr-2 h-4 w-4" />}
              Generate calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Emotion icons appear alongside each generated post. Hover the previews to open the render modal or swap templates.
        </CardContent>
      </Card>

      {selectedBusiness ? (
        <>
          <div>
            {isLoadingPosts ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: Math.min(days, 10) }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-20 rounded-2xl" />
                ))}
              </div>
            ) : (
              <CalendarStrip startDate={startDate} days={days} posts={posts} selectedDate={selectedDate} onSelect={setSelectedDate} />
            )}
          </div>

          {isLoadingPosts ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-3xl" />
              ))}
            </div>
          ) : (
            <CalendarGrid
              startDate={startDate}
              posts={posts}
              days={days}
              templates={templates}
              onTemplateChange={handleTemplateApply}
              templateChangeLoadingId={applyTemplate.isPending ? templateUpdatingPostId : null}
              selectedDate={selectedDate}
            />
          )}
        </>
      ) : (
        <Card className="border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <CardHeader>
            <CardTitle className="text-base">Create a business to view its calendar</CardTitle>
            <CardDescription>
              Add at least one business profile so AI generation can plan posts and apply the right templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                setActiveBusinessId(NEW_BUSINESS_ID);
                router.push("/dashboard/business");
              }}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create business
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

