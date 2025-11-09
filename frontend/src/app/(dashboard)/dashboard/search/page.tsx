"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmotionBadge } from "@/components/dashboard/emotion-badge";
import { api, endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Business, ScheduledPost } from "@/types/business";
import { Skeleton } from "@/components/ui/skeleton";

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

const searchPosts = async (businessId: string, q: string) => {
  const response = await api.get(endpoints.search, { params: { businessId, q } });
  return response.data as ScheduledPost[];
};

const useDebounce = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export default function SearchPage() {
  const { data: businesses = [] } = useQuery({ queryKey: queryKeys.business, queryFn: fetchBusinesses, placeholderData: [] });
  const activeBusiness = businesses[0];

  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);

  const { data: results = [], isFetching } = useQuery({
    queryKey: queryKeys.search(activeBusiness?.id ?? "", debounced),
    queryFn: () => searchPosts(activeBusiness!.id, debounced),
    enabled: Boolean(activeBusiness?.id && debounced.length > 1),
    placeholderData: [],
  });

  const placeholder = useMemo(
    () => (activeBusiness ? `Search ${activeBusiness.name}'s posts for “diwali luxury”` : "Select a business to search"),
    [activeBusiness],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Search posts</h1>
        <p className="text-sm text-slate-500">
          Query your generated content library by emotion, caption text, or hashtags with semantic lookup.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => setQuery("")}>
          Clear
        </Button>
      </div>

      {isFetching ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((post) => (
            <Card key={post.id} className="border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800">
              <CardHeader>
                <CardDescription>{format(new Date(post.date), "MMM d, yyyy")}</CardDescription>
                <CardTitle className="text-lg text-slate-900 dark:text-white">{post.title}</CardTitle>
                <EmotionBadge emotion={post.emotion} />
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p className="line-clamp-4">{post.caption}</p>
                <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                  {post.hashtags?.map((tag) => (
                    <span key={tag}>#{tag.replace(/^#/, "")}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {!results.length && debounced && !isFetching ? (
            <Card className="col-span-full border-dashed text-sm text-slate-500">
              <CardContent className="py-10 text-center">
                No posts matched that query. Try another emotion or keyword.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}

