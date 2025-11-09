"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CrownIcon, InfinityIcon, Loader2, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Business } from "@/types/business";

interface PlanSummary {
  planType: "FREE" | "PRO" | "ENTERPRISE";
  quota: { ai_requests: number; image_generations?: number };
  usage: { ai_requests: number; image_generations?: number };
}

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

const fetchPlan = async () => {
  const response = await api.get(`${endpoints.plan}/me`);
  return response.data as PlanSummary;
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [pendingPlan, setPendingPlan] = useState<"PRO" | "ENTERPRISE" | null>(null);
  const { data: businesses = [] } = useQuery({
    queryKey: queryKeys.business,
    queryFn: fetchBusinesses,
    placeholderData: [],
  });
  const activeBusiness = businesses[0];

  const {
    data: plan,
    isLoading: planLoading,
  } = useQuery({
    queryKey: queryKeys.plans,
    queryFn: fetchPlan,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planType: "PRO" | "ENTERPRISE") => {
      const response = await api.post(`${endpoints.plan}/upgrade`, { planType });
      return response.data as PlanSummary;
    },
    onMutate: (planType) => {
      setPendingPlan(planType);
    },
    onSuccess: (data) => {
      toast.success(`Upgraded to ${data.planType} plan`);
      queryClient.setQueryData(queryKeys.plans, data);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to upgrade plan");
    },
    onSettled: () => {
      setPendingPlan(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans });
    },
  });

  const handleSelectPlan = (planType: PlanSummary["planType"]) => {
    if (planType === "FREE") {
      toast.info("The Free plan is already available to every workspace.");
      return;
    }
    upgradeMutation.mutate(planType);
  };

  const usage = plan?.usage ?? { ai_requests: 0, image_generations: 0 };
  const quota = plan?.quota ?? { ai_requests: 10, image_generations: 10 };

  const usagePercent = Math.min(100, Math.round((usage.ai_requests / (quota.ai_requests || 1)) * 100));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Plans & Billing</h1>
        <p className="text-sm text-slate-500">Scale your automation with the plan that fits your launch cadence.</p>
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Current usage</CardTitle>
            <CardDescription>
              You are on the{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {planLoading ? "loading…" : plan?.planType ?? "FREE"}
              </span>{" "}
              plan.
            </CardDescription>
          </div>
          <Button variant="outline" className="border-blue-200 text-blue-600" disabled={!activeBusiness || planLoading}>
            Manage billing
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {planLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-48 rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-4 w-40 rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>AI requests used</span>
                  <span>
                    {usage.ai_requests}/{quota.ai_requests}
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2 rounded-full" />
              </div>
              {quota.image_generations !== undefined ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Image renders</span>
                    <span>
                      {usage.image_generations ?? 0}/{quota.image_generations}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round(((usage.image_generations ?? 0) / (quota.image_generations || 1)) * 100))}
                    className="h-2 rounded-full bg-blue-100"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40">
                  <InfinityIcon className="h-4 w-4 text-blue-600" />
                  Unlimited image renders included with your plan.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {planLoading
          ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-3xl" />)
          : [
          {
            name: "Free",
            price: "$0",
            planType: "FREE" as const,
            description: "10 AI posts/month, basic template management.",
            features: ["Emotion-aware captions", "Calendar export", "1 brand"],
            icon: <SparklesIcon className="h-6 w-6" />,
          },
          {
            name: "Pro",
            price: "$49",
            planType: "PRO" as const,
            description: "100 AI posts, background generation, analytics dashboard.",
            features: ["DeepSeek image prompts", "Template versioning", "Priority queue"],
            icon: <CrownIcon className="h-6 w-6" />,
            highlighted: true,
          },
          {
            name: "Enterprise",
            price: "Custom",
            planType: "ENTERPRISE" as const,
            description: "Unlimited generation, team workspaces, webhook automations.",
            features: ["Dedicated success manager", "SOC2-ready controls", "Emotion heatmaps"],
            icon: <InfinityIcon className="h-6 w-6" />,
          },
        ].map((planCard) => {
            const isCurrent = plan?.planType === planCard.planType;
            const isPending = upgradeMutation.isPending && pendingPlan === planCard.planType;
            return (
              <Card
                key={planCard.name}
                className={`relative overflow-hidden border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 ${planCard.highlighted ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white" : "bg-white dark:bg-slate-900"}`}
              >
                {planCard.highlighted ? (
                  <div className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs uppercase">Recommended</div>
                ) : null}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl border px-3 py-2 ${planCard.highlighted ? "border-white/40 bg-white/10" : "border-blue-200 bg-blue-50 text-blue-600"}`}>
                      {planCard.icon}
                    </div>
                    <div>
                      <CardTitle>{planCard.name}</CardTitle>
                      <CardDescription className={planCard.highlighted ? "text-blue-100" : undefined}>{planCard.price}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={`text-sm ${planCard.highlighted ? "text-blue-100" : "text-slate-600 dark:text-slate-300"}`}>{planCard.description}</p>
                  <ul className="space-y-2 text-sm">
                    {planCard.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={planCard.highlighted ? "secondary" : "outline"}
                    className={`w-full ${planCard.highlighted ? "bg-white text-blue-600 hover:bg-blue-50" : ""}`}
                    disabled={isCurrent || upgradeMutation.isPending || planCard.planType === "FREE"}
                    onClick={() => handleSelectPlan(planCard.planType)}
                  >
                    {isCurrent ? (
                      "Current plan"
                    ) : isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Choose plan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

