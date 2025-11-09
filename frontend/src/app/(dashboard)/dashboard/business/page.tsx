"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, PlusIcon, UploadIcon } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/dashboard/color-picker";
import { FileUpload } from "@/components/dashboard/file-upload";
import { VoiceToneTester } from "@/components/dashboard/voice-tone-tester";
import { EmotionBadge } from "@/components/dashboard/emotion-badge";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Business } from "@/types/business";
import { cn } from "@/lib/utils";
import { NEW_BUSINESS_ID, useBusinessStore } from "@/store/business-store";

const socialUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  },
  z.union([z.string().url({ message: "Enter a valid URL (include https://)" }), z.null()]),
);

const schema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  goals: z.string().optional(),
  voiceTone: z.string().optional(),
  brandColors: z.string().optional(),
  preferredEmotion: z.string().optional(),
  preferredStyle: z.string().optional(),
  preferredPlatforms: z.array(z.string()).default([]),
  voiceSampleText: z.string().optional(),
  logoUrl: z
    .string()
    .refine(
      (value) => value === undefined || value === "" || value.startsWith("/") || /^https?:\/\//.test(value),
      { message: "Must be a valid URL or server path" },
    )
    .optional(),
  facebookUrl: socialUrl.optional(),
  instagramUrl: socialUrl.optional(),
  linkedinUrl: socialUrl.optional(),
});

type FormValues = z.input<typeof schema>;

const instagramConnectSchema = z.object({
  instagramBusinessId: z.string().min(1, "Instagram business ID is required"),
  instagramAccessToken: z.string().min(10, "Instagram access token is required"),
  tokenExpiresAt: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        return !Number.isNaN(new Date(value).getTime());
      },
      { message: "Enter a valid expiration date" },
    ),
});

type InstagramFormValues = z.infer<typeof instagramConnectSchema>;

const emotionOptions = ["joy", "trust", "anticipation", "luxury", "calm", "festive"];
const styleOptions = ["modern", "minimalist", "vibrant", "luxury", "playful"];

const defaultValues: FormValues = {
  name: "",
  category: "",
  targetAudience: "",
  goals: "",
  voiceTone: "",
  brandColors: "#2563eb",
  preferredEmotion: "joy",
  preferredStyle: "modern",
  preferredPlatforms: [],
  voiceSampleText: "",
  logoUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
};

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

export default function BusinessPage() {
  const queryClient = useQueryClient();
  const [isFormCollapsed, setFormCollapsed] = useState(false);

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: queryKeys.business,
    queryFn: fetchBusinesses,
    placeholderData: [],
  });

  const { activeBusinessId, setActiveBusinessId } = useBusinessStore();

  useEffect(() => {
    if (businesses.length === 0) {
      if (activeBusinessId !== NEW_BUSINESS_ID) {
        setActiveBusinessId(NEW_BUSINESS_ID);
      }
      return;
    }
    if (!activeBusinessId) {
      setActiveBusinessId(businesses[0].id);
      return;
    }
    if (activeBusinessId === NEW_BUSINESS_ID) {
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
  const isCreatingNew = activeBusinessId === NEW_BUSINESS_ID || !selectedBusiness;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const instagramForm = useForm<InstagramFormValues>({
    resolver: zodResolver(instagramConnectSchema),
    defaultValues: {
      instagramBusinessId: selectedBusiness?.instagramBusinessId ?? "",
      instagramAccessToken: "",
      tokenExpiresAt: selectedBusiness?.instagramTokenExpiresAt
        ? selectedBusiness.instagramTokenExpiresAt.slice(0, 10)
        : "",
    },
  });

  useEffect(() => {
    if (selectedBusiness) {
      form.reset({
        name: selectedBusiness.name,
        category: selectedBusiness.category ?? "",
        targetAudience: selectedBusiness.targetAudience ?? "",
        goals: selectedBusiness.goals ?? "",
        voiceTone: selectedBusiness.voiceTone ?? "",
        brandColors: selectedBusiness.brandColors ?? "#2563eb",
        preferredEmotion: selectedBusiness.preferredEmotion ?? "joy",
        preferredStyle: selectedBusiness.preferredStyle ?? "modern",
        preferredPlatforms: selectedBusiness.preferredPlatforms ?? [],
        voiceSampleText: selectedBusiness.voiceSampleText ?? "",
        logoUrl: selectedBusiness.logoUrl ?? "",
        facebookUrl: selectedBusiness.facebookUrl ?? "",
        instagramUrl: selectedBusiness.instagramUrl ?? "",
        linkedinUrl: selectedBusiness.linkedinUrl ?? "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [selectedBusiness, form]);

  useEffect(() => {
    instagramForm.reset({
      instagramBusinessId: selectedBusiness?.instagramBusinessId ?? "",
      instagramAccessToken: "",
      tokenExpiresAt: selectedBusiness?.instagramTokenExpiresAt
        ? selectedBusiness.instagramTokenExpiresAt.slice(0, 10)
        : "",
    });
  }, [selectedBusiness, instagramForm]);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await api.post(endpoints.business, values);
      return response.data as Business;
    },
    onSuccess: (newBusiness) => {
      toast.success("Business profile created");
      queryClient.setQueryData<Business[]>(queryKeys.business, (prev = []) => [newBusiness, ...prev]);
      setActiveBusinessId(newBusiness.id);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create business"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ businessId, values }: { businessId: string; values: FormValues }) => {
      const response = await api.put(`${endpoints.business}/${businessId}`, values);
      return response.data as Business;
    },
    onSuccess: (updatedBusiness, { values }) => {
      toast.success("Business profile updated");
      queryClient.setQueryData<Business[]>(queryKeys.business, (prev = []) =>
        prev.map((item) => (item.id === updatedBusiness.id ? updatedBusiness : item)),
      );
      form.reset({
        ...values,
        logoUrl: updatedBusiness.logoUrl ?? values.logoUrl ?? "",
        facebookUrl: updatedBusiness.facebookUrl ?? values.facebookUrl ?? "",
        instagramUrl: updatedBusiness.instagramUrl ?? values.instagramUrl ?? "",
        linkedinUrl: updatedBusiness.linkedinUrl ?? values.linkedinUrl ?? "",
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update business"),
  });

  const connectInstagramMutation = useMutation({
    mutationFn: async ({ businessId, values }: { businessId: string; values: InstagramFormValues }) => {
      const payload: Record<string, string> = {
        instagramBusinessId: values.instagramBusinessId.trim(),
        instagramAccessToken: values.instagramAccessToken.trim(),
      };
      if (values.tokenExpiresAt) {
        payload.tokenExpiresAt = new Date(values.tokenExpiresAt).toISOString();
      }
      const response = await api.post(endpoints.businessInstagram(businessId), payload);
      return response.data as Business;
    },
    onSuccess: (updatedBusiness) => {
      toast.success("Instagram connection updated");
      queryClient.setQueryData<Business[]>(queryKeys.business, (prev = []) =>
        prev.map((item) => (item.id === updatedBusiness.id ? updatedBusiness : item)),
      );
      instagramForm.reset({
        instagramBusinessId: updatedBusiness.instagramBusinessId ?? "",
        instagramAccessToken: "",
        tokenExpiresAt: updatedBusiness.instagramTokenExpiresAt
          ? updatedBusiness.instagramTokenExpiresAt.slice(0, 10)
          : "",
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to connect Instagram"),
  });

  const disconnectInstagramMutation = useMutation({
    mutationFn: async (businessId: string) => {
      const response = await api.delete(endpoints.businessInstagram(businessId));
      return response.data as Business;
    },
    onSuccess: (updatedBusiness) => {
      toast.success("Instagram disconnected");
      queryClient.setQueryData<Business[]>(queryKeys.business, (prev = []) =>
        prev.map((item) => (item.id === updatedBusiness.id ? updatedBusiness : item)),
      );
      instagramForm.reset({
        instagramBusinessId: "",
        instagramAccessToken: "",
        tokenExpiresAt: "",
      });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to disconnect Instagram"),
  });

  const instagramConnected = selectedBusiness?.instagramConnected ?? false;
  const lastInstagramPublish = selectedBusiness?.instagramLastPublishedAt
    ? new Date(selectedBusiness.instagramLastPublishedAt)
    : null;
  const instagramTokenExpiry = selectedBusiness?.instagramTokenExpiresAt
    ? new Date(selectedBusiness.instagramTokenExpiresAt)
    : null;
  const instagramTokenExpiryLabel =
    instagramTokenExpiry && !Number.isNaN(instagramTokenExpiry.getTime())
      ? instagramTokenExpiry.toLocaleDateString()
      : "Unknown";
  const lastInstagramPublishLabel =
    lastInstagramPublish && !Number.isNaN(lastInstagramPublish.getTime())
      ? lastInstagramPublish.toLocaleString()
      : "Never";

  const ensureBusiness = async () => {
    if (selectedBusiness) return selectedBusiness;
    const values = form.getValues();
    if (!values.name) {
      toast.error("Add your business name before uploading a logo.");
      throw new Error("Business name is required");
    }
    return createMutation.mutateAsync(values);
  };

  const handleUploadLogo = async (file: File) => {
    const activeBusiness = await ensureBusiness();
    const data = new FormData();
    data.append("logo", file);
    try {
      const response = await api.post(`${endpoints.business}/${activeBusiness.id}/logo`, data);
      const { url } = response.data as { url: string };
      form.setValue("logoUrl", url);
      queryClient.setQueryData<Business[]>(queryKeys.business, (prev = []) =>
        prev.map((item) => (item.id === activeBusiness.id ? { ...item, logoUrl: url } : item)),
      );
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo");
      throw error;
    }
  };

  const handleSelectBusiness = (businessId: string) => {
    setActiveBusinessId(businessId);
  };

  const handleCreateNewBusiness = () => {
    setActiveBusinessId(NEW_BUSINESS_ID);
    form.reset(defaultValues);
  };

  const onSubmit = (values: FormValues) => {
    if (selectedBusiness) {
      updateMutation.mutate({ businessId: selectedBusiness.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Business identity</h1>
        <p className="text-sm text-slate-500">
          Define the tone, emotion, and assets that power every generated post.
        </p>
      </div>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Your projects</CardTitle>
            <CardDescription>Switch between businesses to manage brand voices, templates, and calendars.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateNewBusiness}
            className="border-dashed"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New business
          </Button>
        </CardHeader>
        <CardContent>
          {businesses.length ? (
            <div className="grid gap-3">
              {businesses.map((item) => {
                const isActive = activeBusinessId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectBusiness(item.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                      isActive
                        ? "border-blue-500/80 bg-blue-500/10 shadow-sm dark:border-blue-500/50"
                        : "border-slate-200 bg-white hover:border-blue-400/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-500/60 dark:hover:bg-slate-900/60",
                    )}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category ? item.category : "No category set"}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.preferredEmotion ? <EmotionBadge emotion={item.preferredEmotion} /> : null}
                        {item.preferredStyle ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.preferredStyle}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                        Active
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Create your first business to start generating project-specific assets and calendars.
              </p>
              <Button onClick={handleCreateNewBusiness} className="bg-blue-600 text-white hover:bg-blue-700">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create business
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{isCreatingNew ? "Create a business profile" : `Edit ${selectedBusiness?.name ?? "business"}`}</CardTitle>
            <CardDescription>
              These details flow into every DeepSeek prompt and calendar entry for the selected project.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setFormCollapsed((previous) => !previous)}
            aria-expanded={!isFormCollapsed}
            aria-label={isFormCollapsed ? "Expand business form" : "Collapse business form"}
          >
            {isFormCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {isFormCollapsed ? (
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            {selectedBusiness ? (
              <div className="space-y-2">
                <p className="font-medium text-slate-700 dark:text-slate-200">Active summary</p>
                <p>{selectedBusiness.name}</p>
                <p>{selectedBusiness.category ?? "No category set"}</p>
                {selectedBusiness.preferredEmotion || selectedBusiness.preferredStyle ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedBusiness.preferredEmotion ? <EmotionBadge emotion={selectedBusiness.preferredEmotion} /> : null}
                    {selectedBusiness.preferredStyle ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {selectedBusiness.preferredStyle}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <p>Select a business or create a new one to start configuring brand settings.</p>
            )}
          </CardContent>
        ) : (
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business name</FormLabel>
                      <FormControl>
                        <Input placeholder="postinmin & Co" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Interior design studio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target audience</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Modern homeowners, first-time buyers, design enthusiasts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary goals</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Drive awareness, launch seasonal promos, grow Instagram community" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tone & emotion</h3>
                  <FormField
                    control={form.control}
                    name="voiceTone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voice tone</FormLabel>
                        <FormControl>
                          <Input placeholder="Warm, inspiring, data-backed" {...field} />
                        </FormControl>
                        <FormDescription>Short phrases that describe the vibe of your brand voice.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredEmotion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred emotion</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an emotion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {emotionOptions.map((emotion) => (
                              <SelectItem key={emotion} value={emotion}>
                                <div className="flex items-center gap-2">
                                  <EmotionBadge emotion={emotion} />
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visual style</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {styleOptions.map((style) => (
                              <SelectItem key={style} value={style}>
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brandColors"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker value={field.value} onChange={field.onChange} label="Primary brand color" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand logo</FormLabel>
                        <FormControl>
                          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                            <FileUpload label="Upload PNG / SVG logo" onUpload={handleUploadLogo} />
                            {field.value ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                                  <img src={field.value} alt="Current brand logo" className="max-h-28 w-full object-contain" />
                                </div>
                                <p className="text-xs text-slate-500">Logo preview</p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No logo uploaded yet</p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="voiceSampleText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voice sample</FormLabel>
                        <FormControl>
                          <VoiceToneTester initialSample={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Social touchpoints</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add public handles so share actions point to the right destinations. Leave blank if you don’t publish there.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook page</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.facebook.com/your-page" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram profile</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.instagram.com/your-handle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn page</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.linkedin.com/company/your-company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isLoading || updateMutation.isPending || createMutation.isPending}
                >
                  {updateMutation.isPending || createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    (isCreatingNew ? <PlusIcon className="mr-2 h-4 w-4" /> : <UploadIcon className="mr-2 h-4 w-4" />)
                  )}
                  {isCreatingNew ? "Create business" : "Save changes"}
                </Button>
              </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>
      {!isCreatingNew && selectedBusiness ? (
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Instagram publishing</CardTitle>
            <CardDescription>
              Connect your Instagram professional account to publish calendar posts with a single click.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                Status:{" "}
                <span
                  className={
                    instagramConnected ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {instagramConnected ? "Connected" : "Not connected"}
                </span>
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <p>
                  Instagram business ID:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {selectedBusiness.instagramBusinessId ?? "Not set"}
                  </span>
                </p>
                <p>
                  Token expires:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{instagramTokenExpiryLabel}</span>
                </p>
                <p>
                  Last published:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{lastInstagramPublishLabel}</span>
                </p>
              </div>
            </div>
            <Form {...instagramForm}>
              <form
                onSubmit={instagramForm.handleSubmit((values) =>
                  connectInstagramMutation.mutate({ businessId: selectedBusiness.id, values }),
                )}
                className="space-y-4"
              >
                <FormField
                  control={instagramForm.control}
                  name="instagramBusinessId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram business account ID</FormLabel>
                      <FormControl>
                        <Input placeholder="1784..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={instagramForm.control}
                  name="instagramAccessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long-lived access token</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="EAAG..." autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>
                        Token must include the <span className="font-medium">instagram_business_content_publish</span>{" "}
                        permission.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={instagramForm.control}
                  name="tokenExpiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token expiration (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  {instagramConnected ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => disconnectInstagramMutation.mutate(selectedBusiness.id)}
                      disabled={disconnectInstagramMutation.isPending || connectInstagramMutation.isPending}
                    >
                      {disconnectInstagramMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Disconnect
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={connectInstagramMutation.isPending || disconnectInstagramMutation.isPending}
                  >
                    {connectInstagramMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save credentials
                  </Button>
                </div>
              </form>
            </Form>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We store the ID and token securely to call Meta’s Graph API on your behalf. Refresh tokens every 60 days to
              keep publishing enabled.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

