"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOutIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, endpoints } from "@/lib/api";
import { clearSessionToken } from "@/lib/session";
import { useAuthStore } from "@/store/auth-store";
import { useBusinessStore } from "@/store/business-store";
import { queryKeys } from "@/lib/query-keys";
import { Business } from "@/types/business";

const fetchBusinesses = async () => {
  const response = await api.get(endpoints.business);
  return response.data as Business[];
};

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveBusinessId = useBusinessStore((state) => state.setActiveBusinessId);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { data: businesses = [] } = useQuery({ queryKey: queryKeys.business, queryFn: fetchBusinesses, placeholderData: [] });

  const cleanupAfterLogout = () => {
    clearSessionToken();
    queryClient.clear();
    setActiveBusinessId(null);
    setUser(null);
    toast.dismiss("session-expired");
  };

  const logout = useMutation({
    mutationFn: async () => {
      await api.post(endpoints.auth.logout);
    },
    onSuccess: () => {
      cleanupAfterLogout();
      router.replace("/login");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to logout");
      cleanupAfterLogout();
      router.replace("/login");
    },
    onSettled: () => setConfirmOpen(false),
  });

  const initials = (user?.name ?? user?.email ?? "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      {logout.isPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg dark:bg-slate-900">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Signing you out…</span>
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500">Manage session security, active businesses, and account actions.</p>
      </div>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12 border border-slate-200">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user?.name ?? user?.email}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/50">
            <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
            <span>
              Logged in as a <span className="font-medium">{user?.role?.toLowerCase().replace("_", " ")}</span>.
            </span>
          </div>
          <p>You currently manage {businesses.length} business{businesses.length === 1 ? "" : "es"} in this workspace.</p>
          <Button variant="outline" className="border-blue-200 text-blue-600" asChild>
            <a href="/dashboard/plan">Update plan & quotas</a>
          </Button>
          <Dialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={logout.isPending}
              className="w-full sm:w-auto"
            >
              {logout.isPending ? <LogOutIcon className="mr-2 h-4 w-4 animate-spin" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
              Logout
            </Button>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Sign out?</DialogTitle>
                <DialogDescription>
                  You will need to sign back in to access your businesses and calendar. Any unsaved changes will be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)} className="w-full sm:w-auto">
                  Stay logged in
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full sm:w-auto"
                >
                  {logout.isPending ? <LogOutIcon className="mr-2 h-4 w-4 animate-spin" /> : "Log out"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

