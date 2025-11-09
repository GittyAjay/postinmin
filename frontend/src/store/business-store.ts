"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const NEW_BUSINESS_ID = "__new_business__";

interface BusinessState {
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string | null) => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      activeBusinessId: null,
      setActiveBusinessId: (id) => set({ activeBusinessId: id }),
    }),
    { name: "business-store" },
  ),
);

