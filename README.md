# postinmin Marketing Automation Backend

Production-grade Express.js backend in TypeScript for an AI-powered marketing automation platform. The service automates content creation, calendar scheduling, template management, rendering, analytics, and monetization workflows for business owners.

## Features

- JWT authentication with role-based access (admin, business owner)
- Business onboarding with DeepSeek-powered brand voice embeddings
- Drag-and-drop template builder with background uploads and AI recommendations
- DeepSeek text and image generation for emotion-aware marketing posts
- Automated calendar generation with optional A/B variants and rendering pipeline
- BullMQ + Redis queues for scalable AI generation and rendering workloads
- Analytics aggregation, semantic search, and quota-enforced monetization plans
- Swagger API documentation, structured logging, caching, and Prisma ORM

## Tech Stack

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis + BullMQ
- DeepSeek API (text + images)
- Sharp & node-canvas rendering
- Multer file uploads (local storage, ready for cloud providers)
- Jest testing, ESLint + Prettier tooling

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- DeepSeek API keys for text and image generation

### Installation

```bash
npm install
```

### Environment Variables

Copy `docs/env.example` to `.env` and adjust values:

```bash
cp docs/env.example .env
```

DeepSeek configuration aligns with the official docs (`https://api.deepseek.com/v1/chat/completions`). Set `DEEPSEEK_CHAT_MODEL` / `DEEPSEEK_EMBED_MODEL` if you need alternative models, and keep `response_format` JSON support enabled by default.

### Database Setup

```bash
npx prisma migrate dev
npx prisma db seed
```

### Development Server

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default and exposes Swagger docs at `/api/docs`.

### Queue Workers

Workers start automatically with the HTTP server when `ENABLE_QUEUES=true` and `REDIS_URL` are configured. To run them independently:

```bash
ts-node-dev src/jobs/generateWeekly.ts
ts-node-dev src/jobs/renderWorker.ts
```
If Redis is not available locally, leave `ENABLE_QUEUES` set to `false` (default) and queues will stay disabled.

### Testing

```bash
npm test
```

## Project Structure

```
src/
  app.ts                 # Express configuration
  server.ts              # Server bootstrap + workers
  config/                # Env, Prisma, Swagger setup
  controllers/           # Route handlers
  routes/                # Express routers
  services/              # Business logic + integrations
  middlewares/           # Auth, quota, validation
  jobs/                  # BullMQ workers
  queues/                # Worker bootstrap
  utils/                 # Logger, async handler, helpers
  types/                 # Shared TypeScript types
prisma/
  schema.prisma          # Database schema
  seed.ts                # Seed data
uploads/                 # Local storage for assets
tests/                   # Jest tests
docs/                    # Environment example, API docs
```

## API Highlights

- `POST /api/auth/signup` – Register a business owner or admin
- `POST /api/business` – Create a business with voice training
- `POST /api/template/:businessId/upload` – Upload template backgrounds
- `POST /api/template/:businessId/recommend` – AI template suggestions
- `POST /api/ai/preview` – Generate marketing copy + rendered preview
- `POST /api/calendar/generate` – Build a marketing calendar with variants
- `GET /api/analytics/summary` – Retrieve engagement analytics
- `GET /api/search` – Semantic-like search over generated posts

## Rendering Pipeline

1. Generate marketing copy via DeepSeek with brand tone
2. Produce background images via DeepSeek image API
3. Recommend best-fit template based on emotion/style
4. Render final assets via Sharp/node-canvas with emotion-aware tint
5. Queue rendering/analytics jobs with BullMQ for scalability

## Monetization & Quotas

- Plans: Free (10 posts/month), Pro (100 posts + images), Enterprise (unlimited)
- Middleware-enforced quota checks for AI-heavy endpoints
- User plans stored in `UserPlan` with JSON quota tracking

## Logging & Monitoring

- Winston logger with structured console output
- Morgan HTTP logging integrated with Winston
- Ready for external log shipping (Loki/Grafana)

## Future Enhancements

- Integrate Cloudinary/S3 storage adapters
- Expand analytics with third-party insight ingestion
- Add semantic vector search with pgvector/Weaviate
- Introduce refresh tokens and OAuth providers

## License

MIT

