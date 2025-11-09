export const queryKeys = {
  me: ["auth", "me"] as const,
  business: ["business"] as const,
  templates: (businessId?: string) => ["templates", businessId] as const,
  calendar: (businessId?: string) => ["calendar", businessId] as const,
  analytics: (businessId?: string, range?: string) =>
    ["analytics", businessId, range] as const,
  search: (businessId: string, query: string) => ["search", businessId, query] as const,
  plans: ["plans"] as const,
  posts: (businessId?: string) => ["posts", businessId] as const,
};

