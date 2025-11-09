import axios, { AxiosError } from "axios";

let lastUnauthorizedDispatch = 0;

const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api/proxy";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

export const endpoints = {
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
    logout: "/auth/logout",
  },
  business: "/business",
  template: "/template",
  calendar: "/calendar/generate",
  calendarTemplate: "/calendar/template",
  render: "/render",
  analytics: "/analytics/summary",
  plan: "/plan",
  search: "/search",
  posts: "/posts",
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isAuthAttempt =
        typeof requestUrl === "string" &&
        [endpoints.auth.login, endpoints.auth.signup].some((endpoint) => requestUrl.includes(endpoint));

      if (!isAuthAttempt && typeof window !== "undefined") {
        const now = Date.now();
        if (now - lastUnauthorizedDispatch > 1000) {
          lastUnauthorizedDispatch = now;
          window.dispatchEvent(new CustomEvent("session-expired"));
        }
      }
      console.warn("[API] Unauthorized response received");
    }
    return Promise.reject(error);
  },
);

export type ApiError = AxiosError<{ message?: string }>;

