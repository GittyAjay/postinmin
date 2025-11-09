"use client";

import { create } from "zustand";

export type UserRole = "ADMIN" | "BUSINESS_OWNER";

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  planType?: "FREE" | "PRO" | "ENTERPRISE";
}

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

