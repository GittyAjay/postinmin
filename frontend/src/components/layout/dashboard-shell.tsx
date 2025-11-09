"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LineChart,
  Loader2,
  LogOutIcon,
  MenuIcon,
  Palette,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, endpoints } from "@/lib/api";
import { clearSessionToken } from "@/lib/session";
import { useAuthStore } from "@/store/auth-store";
import { useBusinessStore } from "@/store/business-store";
import { ThemeToggle } from "./theme-toggle";
import { useMobileSidebar } from "./use-mobile-sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/business", label: "Business", icon: Building2 },
  { href: "/dashboard/templates", label: "Templates", icon: Palette },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
  { href: "/dashboard/plan", label: "Plans", icon: CreditCard },
  { href: "/dashboard/search", label: "Search", icon: SearchIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export const DashboardShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveBusinessId = useBusinessStore((state) => state.setActiveBusinessId);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const initials = useMemo(
    () =>
      (user?.name ?? user?.email ?? "User")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user],
  );

  const { isOpen, open, close } = useMobileSidebar();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSessionExpired = () => {
      queryClient.clear();
      setUser(null);
      setActiveBusinessId(null);
      toast.dismiss("session-expired");
      toast.error("Your session expired. Please log in again.", { id: "session-expired" });
      router.replace("/login");
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [queryClient, router, setActiveBusinessId, setUser]);

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
  });

  const sidebar = (
    <div
      className={cn(
        "flex h-full flex-col gap-6 bg-slate-50 py-8 transition-[padding] duration-300 dark:bg-slate-900/40",
        isSidebarCollapsed ? "px-3" : "px-6",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          isSidebarCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className={cn("flex items-center gap-3", isSidebarCollapsed ? "justify-center" : "")}>
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 text-xl font-semibold transition-opacity",
              isSidebarCollapsed ? "justify-center" : "",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">AI</span>
            {!isSidebarCollapsed && (
              <div className="leading-none">
                <div>postinmin</div>
                <div className="text-xs font-normal text-slate-500 dark:text-slate-400">AI Studio</div>
              </div>
            )}
          </Link>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border-slate-300 text-slate-600 transition-transform hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
              isSidebarCollapsed ? "rotate-180" : "",
            )}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 text-sm">
        {navItems.map((item) => {
          const isRoot = item.href === "/dashboard";
          const isActive = isRoot
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                isSidebarCollapsed && "justify-center",
                isActive
                  ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {!isSidebarCollapsed && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="font-medium text-slate-700 dark:text-slate-200">Need more automation?</p>
          <p className="text-slate-500 dark:text-slate-400">
            Upgrade to Pro for 100 posts/month and advanced rendering queues.
          </p>
          <Button size="sm" variant="outline" asChild className="w-full border-blue-200 text-blue-600">
            <Link href="/dashboard/plan">View Plans</Link>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {logout.isPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg dark:bg-slate-900">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Signing you out…</span>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
        <div
        className={cn(
          "hidden shrink-0 border-r border-slate-200 transition-[width] duration-300 dark:border-slate-800 lg:block",
          isSidebarCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <ScrollArea className="h-full">{sidebar}</ScrollArea>
        </div>
      </div>
      <Sheet open={isOpen} onOpenChange={(openState) => (openState ? open() : close())}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-50 lg:hidden">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <ScrollArea className="h-full">{sidebar}</ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="hidden flex-col leading-tight lg:flex">
            <span className="text-sm text-slate-500">Welcome back</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user?.name ?? user?.email ?? "Creator"}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-slate-200 p-0">
                  <Avatar className="h-9 w-9 border border-transparent">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Account
                    <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-600">
                      {user?.planType ?? "FREE"}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name ?? "Creator"}</div>
                  {user?.email ? <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div> : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault();
                    router.push("/dashboard/settings");
                  }}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  disabled={logout.isPending}
                  onSelect={(event) => {
                    event.preventDefault();
                    if (!logout.isPending) {
                      logout.mutate();
                    }
                  }}
                >
                  {logout.isPending ? <LogOutIcon className="mr-2 h-4 w-4 animate-spin" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
      </div>
    </>
  );
};

