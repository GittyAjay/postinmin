"use client";

import { useState } from "react";
import { Loader2, SparklesIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, endpoints } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  sample: z.string().min(40, { message: "Provide at least 40 characters to analyse tone." }),
});

interface VoiceToneTesterProps {
  initialSample?: string;
}

export const VoiceToneTester = ({ initialSample = "" }: VoiceToneTesterProps) => {
  const [value, setValue] = useState(initialSample);

  const { mutate, isPending, data } = useMutation({
    mutationFn: async () => {
      const payload = schema.parse({ sample: value });
      const response = await api.post(`${endpoints.business}/voice-test`, { text: payload.sample });
      return response.data as { summary: string; keywords: string[] };
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to analyse voice sample");
    },
  });

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
        <SparklesIcon className="h-4 w-4" />
        DeepSeek Voice Tester
      </div>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Paste a sample paragraph that represents your brand tone..."
        rows={4}
      />
      <Button
        type="button"
        disabled={isPending || value.length < 40}
        onClick={() => mutate()}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Test brand voice
      </Button>
      {data ? (
        <div className="space-y-2 rounded-xl border border-blue-200 bg-white p-3 text-sm dark:border-blue-700 dark:bg-blue-950/50">
          <p className="font-medium text-slate-800 dark:text-slate-100">{data.summary}</p>
          <div className="flex flex-wrap gap-1 text-xs uppercase text-blue-500">
            {data.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-blue-50 px-2 py-0.5 dark:bg-blue-900/60">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

