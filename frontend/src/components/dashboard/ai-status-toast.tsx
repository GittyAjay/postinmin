"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const showAIGenerationToast = (message = "DeepSeek is crafting your next content drop.") => {
  const id = toast.loading(
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
        <Loader2 className="h-5 w-5 animate-spin" />
      </span>
      <div>
        <p className="font-medium text-slate-900">Generating</p>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>,
  );

  return {
    dismiss: (successMessage?: string) => {
      if (successMessage) {
        toast.success(successMessage, { id });
      } else {
        toast.dismiss(id);
      }
    },
    error: (errorMessage: string) => toast.error(errorMessage, { id }),
  };
};

