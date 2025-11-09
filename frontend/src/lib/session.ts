"use client";

import { api } from "./api";

const SESSION_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "postinmin_session";
const SESSION_STORAGE_KEY = "postinmin.auth.token";

const setCookie = (token: string) => {
  const expires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
  document.cookie = `${SESSION_COOKIE}=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
};

const removeCookie = () => {
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export const setSessionToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, token);
  setCookie(token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearSessionToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  removeCookie();
  delete api.defaults.headers.common.Authorization;
};

export const loadSessionToken = () => {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    api.defaults.headers.common.Authorization = `Bearer ${stored}`;
    setCookie(stored);
    return;
  }

  const cookieMatch = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (cookieMatch) {
    const token = cookieMatch.split("=")[1];
    if (token) {
      localStorage.setItem(SESSION_STORAGE_KEY, token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }
};

