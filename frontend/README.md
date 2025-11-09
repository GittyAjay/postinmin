## postinmin – Frontend

Emotion-aware marketing dashboard built with **Next.js 15**, **Tailwind CSS v4**, **shadcn/ui**, and **TanStack Query**. The app connects to the existing postinmin backend to orchestrate brand onboarding, template design, AI calendar generation, analytics, and billing.

### ✨ Tech Highlights
- App Router with route groups (`(marketing)`, `(auth)`, `(dashboard)`)
- Tailwind v4 + shadcn/ui component system
- React Query + Axios client (cookie-based auth)
- Zustand for lightweight session state
- Framer Motion micro animations
- Konva canvas template editor & drag-drop upload
- Chart.js (via react-chartjs-2) analytics widgets
- Sonner toasts for AI feedback

### 📦 Project Structure
```
src/
  app/
    (auth)/login, signup
    (dashboard)/dashboard/...    # Overview, Business, Templates, Calendar, Analytics, Plan, Search, Settings, Post detail
    globals.css                  # Tailwind v4 theme tokens
  components/
    dashboard/                   # Feature components (EmotionBadge, TemplateCard, etc.)
    layout/                      # Dashboard shell + theme toggle
    providers/                   # Theme + React Query providers
    template/                    # Template canvas editor
    ui/                          # shadcn/ui primitives
  lib/                           # Axios client, query keys, emotion palette
  store/                         # Zustand auth store
  types/                         # API response types
```

### 🚀 Getting Started
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Copy env example and configure:
   ```bash
   cp docs/env.example .env.local
   ```
  Required variables:
  - `NEXT_PUBLIC_API_URL` – frontend proxy base (defaults to `/api/proxy`)
  - `NEXT_PUBLIC_SESSION_COOKIE` – name of the auth cookie set by the backend (default `postinmin_session`)
  - `BACKEND_API_URL` – actual backend REST endpoint (e.g. `http://localhost:4000/api`)
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and log in with backend credentials.

### 🔐 Authentication & Middleware
- HTTP-only cookie based auth, proxied from backend JWT session.
- `middleware.ts` guards dashboard routes and redirects to `/login` if the session cookie is missing.

### 🧠 Key Integrations
- `/dashboard` overview hits business, posts, and analytics endpoints.
- `/dashboard/templates` uploads assets, edits placeholders via Konva canvas, and persists layouts.
- `/dashboard/calendar` triggers `/calendar/generate` and renders 30-day cards.
- `/dashboard/analytics` visualizes `/analytics/summary` data with Chart.js.
- `/dashboard/post/[id]` displays AI copy, background prompt, and render state.
- `/dashboard/search` performs semantic lookups through `/search`.

### 🧪 Tooling
- ESLint 9 + TypeScript 5
- shadcn CLI (`components.json`) tracks UI components
- React Query Devtools enabled in development

### 🛠 Useful Scripts
```bash
npm run dev      # start development server
npm run build    # production build
npm run start    # start production server
npm run lint     # lint codebase
```

### 📄 Notes
- Tailwind CSS v4 uses `@import "tailwindcss";` in `globals.css`; no root `tailwind.config` is required.
- Toast notifications rely on the `sonner` Toaster configured in `AppProviders`.
- The template editor uses `react-konva` + `use-image`; ensure browsers allow cross-origin image downloads for local files.
- All client requests are proxied through `src/app/api/proxy/[...path]/route.ts` to remove CORS issues. Configure `BACKEND_API_URL` for the upstream host.

Enjoy your calm, emotionally intelligent marketing cockpit. 🎛️💡
