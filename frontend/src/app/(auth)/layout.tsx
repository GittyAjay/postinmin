"use client";

import Link from "next/link";
import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">AI</span>
          postinmin
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-[0_20px_70px_-35px_rgba(37,99,235,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          {children}
        </div>
      </main>
    </div>
  );
}

