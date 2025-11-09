"use client";

import { addDays, format, isSameDay, parseISO } from "date-fns";
import { ScheduledPost } from "@/types/business";
import { cn } from "@/lib/utils";

interface CalendarStripProps {
  startDate: string;
  days: number;
  posts: ScheduledPost[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export const CalendarStrip = ({ startDate, days, posts, selectedDate, onSelect }: CalendarStripProps) => {
  const start = parseISO(startDate);
  const totalDays = Math.max(1, days);

  const postDates = new Map<string, ScheduledPost>();
  posts.forEach((post) => {
    const key = format(new Date(post.date), "yyyy-MM-dd");
    postDates.set(key, post);
  });

  return (
    <div className="relative -mx-2 overflow-x-auto pb-2">
      <div className="flex min-w-full gap-3 px-2">
        {Array.from({ length: totalDays }).map((_, index) => {
          const date = addDays(start, index);
          const key = format(date, "yyyy-MM-dd");
          const hasPost = postDates.has(key);
          const post = postDates.get(key);
          const isSelected = isSameDay(parseISO(selectedDate), date);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "group flex w-24 flex-col items-center rounded-2xl border border-transparent bg-white px-3 py-2 text-sm shadow-sm transition hover:border-blue-200 hover:bg-blue-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400/60 dark:hover:bg-slate-900/70",
                isSelected
                  ? "border-blue-500 bg-blue-600 text-white shadow-blue-200/40 hover:border-blue-500 hover:bg-blue-600 dark:border-blue-500 dark:bg-blue-600"
                  : "",
              )}
            >
              <span className={cn("text-xs uppercase tracking-wide", isSelected ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                {format(date, "EEE")}
              </span>
              <span className={cn("text-lg font-semibold", isSelected ? "text-white" : "text-slate-800 dark:text-slate-100")}>
                {format(date, "d")}
              </span>
              <span className={cn("text-[11px] leading-tight", isSelected ? "text-blue-100/90" : "text-slate-400 dark:text-slate-500")}>
                {format(date, "MMM")}
              </span>
              <span
                className={cn(
                  "mt-2 h-2 w-2 rounded-full transition",
                  hasPost
                    ? isSelected
                      ? "bg-white"
                      : "bg-blue-500 group-hover:bg-blue-600"
                    : "bg-slate-200 group-hover:bg-slate-300 dark:bg-slate-700 dark:group-hover:bg-slate-600",
                )}
              />
              {post?.emotion ? (
                <span className={cn("mt-1 text-[10px] uppercase tracking-wider", isSelected ? "text-blue-100" : "text-slate-400 dark:text-slate-500")}>
                  {post.emotion}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};


