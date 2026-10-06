# Fotokita Agent & Developer Guide

Fotokita is a modern, full-stack wedding photography and digital guestbook platform ("Tak Blur" with fotokita.com). It enables couples to host interactive live digital galleries where wedding guests upload photos/videos, leave heartfelt wishes, sign digital guestbooks, and experience real-time customizable celebration themes. The platform is architected as a multi-tenant SaaS with fine-grained administration, automated media retention policies, and private Cloudflare R2 / AWS S3 cloud storage.

---

## 1. System Architecture

Fotokita is organized as a decoupled microservices architecture with a unified React + Vite single-page application (SPA) acting as the frontend client for guests, couples (tenants), and platform superadmins.

```
                                  ┌───────────────────────────┐
                                  │    Frontend Application   │
                                  │  React 19 + Vite 8 + TS   │
                                  │      (Port 5173)          │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │ /api/weddings                │ /api/media                   │ /api/tenant /api/admin
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │     Wedding Service     │    │      Media Service      │    │     Tenant Service      │    │      Admin Service      │
    │     Hono / Bun (3001)   │    │    Hono / Bun (3000)    │    │    Hono / Bun (3004)    │    │    Hono / Bun (3002)    │
    └────────────┬────────────┘    └────────────┬────────────┘    └────────────┬────────────┘    └────────────┬────────────┘
                 │                              │                              │                              │
                 │                              │                              │                              │
                 ▼                              ▼                              ▼                              ▼
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │                                          PostgreSQL Database (Port 5433 / 5432)                                      │
    │                   Tables: weddings, media, tenant_accounts, tenant_customizations, tenant_invites, inquiries        │
    └───────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                                       ┌──────────────────────────────────┐
                                       │    Cloudflare R2 / AWS S3        │
                                       │      Private Object Store        │
                                       │   (Presigned URLs + Proxy)       │
                                       └──────────────────────────────────┘
```

---

## 2. Technology Stack Matrix

| Layer | Technologies | Key Libraries & Packages |
|---|---|---|
| **Frontend** | React 19, Vite 8, TypeScript (~6.0) | Tailwind CSS v4 (`@tailwindcss/vite`), TanStack Router v1, TanStack Query v5, Motion, Base-UI / Shadcn UI, Sonner, Lucide React, JSZip, React Easy Crop |
| **Backend Services** | Bun Runtime, Hono v4, TypeScript | Zod v4, Drizzle ORM v0.45, `postgres` driver (v3.4), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `dotenv` |
| **Database** | PostgreSQL 18 (Docker container) | Drizzle Kit v0.31 for migrations & schema syncing |
| **Storage** | Cloudflare R2 / Amazon S3 | S3-compatible private bucket with 10-min presigned download URLs & in-memory stream proxy |
| **Tooling & Linter** | Oxlint, Bun Test, Docker Compose | Native Bun watcher & compilation |

---

## 3. Network Topology & Port Mapping

| Component | Port | Base URL / Mount | Proxy Path in Vite |
|---|---|---|---|
| **Frontend SPA** | `5173` | `http://localhost:5173` | `—` |
| **Media Service** | `3000` | `http://localhost:3000` | `/api/media` &rarr; `http://localhost:3000/media` |
| **Wedding Service** | `3001` | `http://localhost:3001` | `/api/weddings` &rarr; `http://localhost:3001/weddings` |
| **Admin Service** | `3002` | `http://localhost:3002` | `/api/admin` &rarr; `http://localhost:3002/admin` |
| **Tenant Service** | `3004` | `http://localhost:3004` | `/api/tenant` &rarr; `http://localhost:3004/tenant` |
| **PostgreSQL (Host)**| `5433` | `postgres://fotokita:fotokita@localhost:5433/fotokita` | `—` |

> [!NOTE]
> In local development, the Vite dev server (`frontend/vite.config.ts`) transparently proxies all `/api/*` calls to the respective backend microservices. You do not need to deal with CORS or cross-port URLs inside frontend code.

---

## 4. Service Catalog & Domain Boundaries

### 4.1 Wedding Service (`services/wedding-service` - Port 3001)
Responsible for wedding identity, registry, and public slug lookup.
- **Key Responsibilities**:
  - Wedding CRUD operations
  - Slug validation & reservation (e.g. `fotokita.com/ali-dan-siti`)
  - Real-time slug availability check (`GET /weddings/check-slug?slug=...`)
- **Key Routes**:
  - `GET /weddings` - List all weddings
  - `GET /weddings/check-slug?slug=:slug` - Real-time slug availability validation
  - `GET /weddings/slug/:slug` - Lookup wedding by slug
  - `GET /weddings/:id` - Lookup wedding by UUID
  - `POST /weddings` - Register new wedding
  - `PATCH /weddings/:id` - Update wedding details
  - `DELETE /weddings/:id` - Remove wedding record

### 4.2 Media Service (`services/media-service` - Port 3000)
Owns media assets, cloud storage interaction, guest uploads, and media security.
- **Key Responsibilities**:
  - Direct multipart uploads from wedding guests
  - Cloudflare R2 / AWS S3 key management (`weddings/{weddingId}/{uuid}.{ext}`)
  - Generating time-limited presigned URLs (10-minute TTL)
  - Guest wishes, guest names, and digital canvas signature data persistence
  - Protected deletion via guest secret code (`x-secret-code` or payload `code`)
  - Cross-origin canvas image proxy (`GET /media/proxy-image?url=...`) for HTML5 canvas export/photobooth
  - Batch wedding media purge (`DELETE /media/wedding/:weddingId`) for lifecycle cleanup
- **Key Routes**:
  - `GET /media?weddingId=:weddingId` - List media metadata for a wedding
  - `GET /media/:id` - Retrieve single media metadata
  - `GET /media/:id/url` - Generate fresh presigned download URL
  - `GET /media/proxy-image?url=:url` - Stream external image with CORS headers for canvas manipulation
  - `POST /media` - Upload image/video (multipart form: `weddingId`, `file`, `wishes`, `fromName`, `signature`, `secretCode`)
  - `DELETE /media/:id` - Delete media (authorized via secret code or admin)
  - `DELETE /media/wedding/:weddingId` - Cascade delete all S3 objects and DB rows for a wedding

### 4.3 Tenant Service (`services/tenant-service` - Port 3004)
Powers the client Sub-Admin portal for couples to manage their wedding presence.
- **Key Responsibilities**:
  - Tenant account authentication & session management (JWT)
  - Wedding page visual customizations (color palettes, font presets, partner name positioning, ampersand sizing, ambient orb styles, fireworks animation toggles, custom taglines)
  - Plan subscription tracking (`1day`, `1week`, `custom`)
  - **Automated Retention Worker**: Periodic background cron running every 1 hour to purge media files from R2/Postgres once plan expiration date passes (unless `preserveMedia` is enabled), archiving the tenant account
- **Key Routes**:
  - `POST /tenant/auth/login` - Sub-admin login
  - `POST /tenant/auth/register` - Tenant onboarding with invite token
  - `GET /tenant/auth/me` - Validate session & retrieve account details
  - `GET /tenant/customization/:weddingId` - Get visual customizer settings
  - `PUT /tenant/customization/:weddingId` - Update visual customizer settings & layout
  - `GET /tenant/maintenance/status` - Inspection of retention cleanup status
  - `POST /tenant/maintenance/trigger-cleanup` - Manual trigger for expired media cleanup

### 4.4 Admin Service (`services/admin-service` - Port 3002)
Superadmin portal for platform owners to monitor operational metrics, onboard couples, and handle sales inquiries.
- **Key Responsibilities**:
  - Superadmin credential authentication (JWT)
  - Cross-service health check dashboard (aggregating statuses from Wedding, Media, and Admin services)
  - Tenant invite link generator (with receipt proof attachment and tier selection)
  - Customer inquiry CRM (capturing plan interest and conversion status)
- **Key Routes**:
  - `POST /admin/auth/login` - Superadmin login
  - `GET /admin/dashboard/stats` - Platform statistics (total weddings, total photos, service statuses)
  - `GET /admin/invites` - List generated onboarding tokens
  - `POST /admin/invites` - Create single-use tenant invite token
  - `GET /admin/inquiries` - List incoming customer inquiries
  - `PATCH /admin/inquiries/:id` - Update inquiry status (`pending`, `contacted`, `converted`)

### 4.5 Frontend Application (`frontend/` - Port 5173)
Type-safe single page application utilizing TanStack Router and Query.
- **Key Pages & Routes**:
  - `/` - Landing page with pricing, showcase, and CTAs
  - `/demo` - Interactive live preview demo gallery
  - `/$slug` & `/w/$slug` - Public wedding gallery (guest uploads, wishes wall, signature modal, lightbox)
  - `/subadmin` / `/portal` - Sub-admin portal for couples (manage photos, bulk ZIP download, customize visual theme, copy share links)
  - `/login` & `/register` - Tenant authentication & onboarding
  - `/admin` & `/adminfotokita` - Superadmin control centre

---

## 5. Database Schema & Data Models

PostgreSQL database running via Docker Compose (`fotokita-postgres`), port `5433` (externally) / `5432` (internally). Each service uses Drizzle ORM to interface with its domain tables:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│            weddings             │       │              media              │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: uuid (PK)                   │       │ id: uuid (PK)                   │
│ name: text                      │       │ wedding_id: uuid (FK logic)     │
│ slug: text (UNIQUE)             │       │ storage_key: text               │
│ date: timestamp                 │       │ filename: text                  │
│ created_at: timestamp           │       │ mime_type: text                 │
└─────────────────────────────────┘       │ size: integer                   │
                                          │ wishes: text (nullable)         │
┌─────────────────────────────────┐       │ from_name: text (nullable)      │
│         tenant_accounts         │       │ signature: text (nullable)      │
├─────────────────────────────────┤       │ secret_code: text (nullable)    │
│ id: uuid (PK)                   │       │ created_at: timestamp           │
│ username: text (UNIQUE)         │       └─────────────────────────────────┘
│ email: text (UNIQUE)            │
│ password: text (hashed)         │       ┌─────────────────────────────────┐
│ wedding_id: text                │       │      tenant_customizations      │
│ wedding_slug: text              │       ├─────────────────────────────────┤
│ wedding_name: text              │       │ id: uuid (PK)                   │
│ plan_tier: text                 │       │ wedding_id: text (UNIQUE)       │
│ plan_expires_at: timestamp      │       │ partner1, partner2: text        │
│ media_expires_at: timestamp     │       │ wedding_date: text              │
│ preserve_media: boolean         │       │ eyebrow, tagline: text          │
│ status: text                    │       │ theme_palette, orb_style: text  │
│ media_cleaned_up: boolean       │       │ fireworks_enabled: boolean      │
│ created_at, updated_at          │       │ font_preset, partner_font: text │
└─────────────────────────────────┘       │ text_positions: text (JSON)     │
                                          │ updated_at: timestamp           │
┌─────────────────────────────────┐       └─────────────────────────────────┘
│         tenant_invites          │
├─────────────────────────────────┤       ┌─────────────────────────────────┐
│ id: uuid (PK)                   │       │       customer_inquiries        │
│ token: text (UNIQUE)            │       ├─────────────────────────────────┤
│ tier: text                      │       │ id: uuid (PK)                   │
│ client_name, client_phone: text │       │ username: text (UNIQUE)         │
│ receipt_data, receipt_mime: text│       │ phone: text (UNIQUE)            │
│ expires_at: timestamp           │       │ plan_id, plan_name: text        │
│ is_used: boolean                │       │ price, status: text             │
│ registration_details: jsonb     │       │ notes: text                     │
│ created_at: timestamp           │       │ created_at: timestamp           │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

---

## 6. API Conventions & Standards

### 6.1 Success Responses
Always format successful responses as:
```json
{
  "data": { ... }
}
```
Or for collections:
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 6.2 Error Responses
Always follow the uniform application error contract:
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable summary",
    "details": {
      "fieldErrors": {
        "slug": ["Slug is already in use"]
      }
    }
  }
}
```

### 6.3 Standard Error Codes
Use descriptive, application-level error codes across all services:
- `VALIDATION_ERROR` (400) - Payload failed Zod validation
- `UNAUTHORIZED` (401) - Missing or invalid JWT token / credentials
- `FORBIDDEN` (403) - Action not permitted for current role or secret code
- `NOT_FOUND` (404) - Resource not found (or `WEDDING_NOT_FOUND`, `MEDIA_NOT_FOUND`)
- `SLUG_ALREADY_EXISTS` (409) - URL slug collision
- `FILE_TOO_LARGE` (400) - Upload exceeded configured byte limit
- `INVALID_FILE_TYPE` (400) - Uploaded MIME type not permitted
- `S3_UPLOAD_FAILED` (500) - Object store put failure
- `DATABASE_ERROR` (500) - PostgreSQL query failure
- `INTERNAL_SERVER_ERROR` (500) - Uncaught exception

---

## 7. Storage Architecture & S3/R2 Guidelines

### 7.1 Key Naming Convention
All storage keys must adhere to the structured hierarchy:
```
weddings/{weddingId}/{uuid}.{extension}
```
Example:
```
weddings/550e8400-e29b-41d4-a716-446655440000/d745a9ca-6f3a-44b4-8bb1-56a4433f6542.jpg
```

### 7.2 Storage Security Rules
1. **Never expose storage credentials**: Neither AWS Access Keys nor Cloudflare R2 tokens should ever reach client code or logs.
2. **Short-lived presigned URLs**: Presigned GET URLs must have a maximum expiration of 10 minutes (`60 * 10` seconds).
3. **No orphan objects**: If an S3 upload succeeds but the subsequent database record insert fails, the service **must catch the error, immediately delete the uploaded S3 object, and then return an error response**.
4. **Isolate SDK calls**: All S3/R2 operations (put, get presigned, delete, batch delete) must reside exclusively in `src/lib/s3.ts`. Do not import `@aws-sdk` in route handlers.

---

## 8. Development Setup & Execution Commands

### 8.1 Prerequisites
- [Bun](https://bun.sh) runtime installed
- [Docker](https://www.docker.com) & Docker Compose installed

### 8.2 Starting the Environment
1. **Start Database**:
   ```bash
   docker compose up -d postgres
   ```
2. **Run All Backend Services** (separate terminal tabs or supervisor):
   ```bash
   # Wedding Service (3001)
   cd services/wedding-service && bun run dev

   # Media Service (3000)
   cd services/media-service && bun run dev

   # Admin Service (3002)
   cd services/admin-service && bun run dev

   # Tenant Service (3004)
   cd services/tenant-service && bun run dev
   ```
3. **Run Frontend** (Port 5173):
   ```bash
   cd frontend && bun run dev
   ```

### 8.3 Database Migrations (Drizzle)
Each service maintains its own Drizzle schema:
```bash
# Within any service directory (e.g. services/wedding-service):
bunx drizzle-kit generate
bunx drizzle-kit migrate
# Or for quick dev sync:
bunx drizzle-kit push
```

---

## 9. Environment Variables Reference

Each service contains a `.env.example`. Required configuration variables include:

### `services/wedding-service/.env`
```env
PORT=3001
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
```

### `services/media-service/.env`
```env
PORT=3000
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
# Cloudflare R2 / AWS S3
R2_REGION=auto
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<YOUR_R2_ACCESS_KEY>
R2_SECRET_ACCESS_KEY=<YOUR_R2_SECRET_KEY>
R2_BUCKET_NAME=fotokita
```

### `services/tenant-service/.env`
```env
PORT=3004
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
JWT_SECRET=super-secret-tenant-key-fotokita-change-in-production
WEDDING_SERVICE_URL=http://localhost:3001
MEDIA_SERVICE_URL=http://localhost:3000
ADMIN_SERVICE_URL=http://localhost:3002
```

### `services/admin-service/.env`
```env
PORT=3002
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
JWT_SECRET=super-secret-admin-key-fotokita-change-in-production
WEDDING_SERVICE_URL=http://localhost:3001
MEDIA_SERVICE_URL=http://localhost:3000
```

### `frontend/.env` (Optional in Dev due to Vite proxy)
```env
VITE_WEDDING_API_URL=/api/weddings
VITE_MEDIA_API_URL=/api/media
VITE_TENANT_API_URL=/api/tenant
VITE_ADMIN_API_URL=/api/admin
```

---

## 10. Agent Engineering Rules & Best Practices

Whenever you make changes to Fotokita, you must adhere strictly to these engineering tenets:

### Rule 1: Thin Route Handlers, Fat Services
- Route files (`src/routes/*`) must **only**:
  1. Extract and validate parameters/payload using Zod schemas.
  2. Call the dedicated service function (`src/services/*`).
  3. Return the response using the standard `success()` or `error()` helper.
- **Never write complex SQL/Drizzle queries or AWS SDK calls directly inside route handlers.**

### Rule 2: Strict Service Decoupling
- Never directly query another service's database tables from a different service.
- When `tenant-service` cleans up media, it makes an HTTP request to `media-service` (`DELETE /media/wedding/:weddingId`).
- Keep microservice boundaries clean and API-driven.

### Rule 3: Validate at Boundaries
- Validate query parameters, URL params, and multipart request bodies using Zod.
- Sanitize filenames to prevent path traversal or special character corruption before generating S3 storage keys.
- Check MIME types and enforce max file sizes (default: 50MB for images, 150MB for videos).

### Rule 4: Frontend API Layer Encapsulation
- Never invoke raw `fetch()` directly inside React UI components.
- Centralize all HTTP calls in `frontend/src/api/*` (`wedding.ts`, `media.ts`, `tenant.ts`, `admin.ts`).
- Consume API calls in UI components using TanStack Query hooks (`frontend/src/hooks/queries/*`) or custom mutations with error handling.

### Rule 5: Strict TypeScript & Zero Implicit Any
- Always ensure changes pass TypeScript checking without type suppresses (`as any` or `@ts-ignore` are strongly discouraged).
- Run typecheck verification before concluding tasks:
  ```bash
  bunx tsc --noEmit
  ```

### Rule 6: Sensitive Data Protection
- Never commit `.env` files.
- Never write credentials, database passwords, secret codes, or full presigned URLs into log files.

---

## 11. Current Project Status & Immediate Priorities

### What Is Completed & Stable
- Full Wedding CRUD and real-time slug verification
- Media upload with wishes, digital canvas signatures, and deletion codes
- Cloudflare R2 / S3 storage integration with presigned URLs & proxy endpoint
- Multi-tenant Sub-Admin authentication and live customization engine
- Automated media retention worker with scheduled background cleanup
- Superadmin dashboard with invite generator and customer inquiry tracking
- Modern responsive frontend with landing page, photobooth canvas, demo gallery, wedding gallery, and tenant portal

### Active Roadmap & Immediate Priorities
1. **Direct Browser-to-R2 Uploads**: Transition from uploading through `media-service` to requesting a presigned PUT URL and uploading directly from browser to R2 for high scalability.
2. **Thumbnail Generation**: Automated background generation of lightweight WebP thumbnails for gallery grids to decrease page weight and optimize bandwidth.
3. **Automated Integration & E2E Testing**: Add automated Bun test suites covering upload flows, retention cleanup, and slug validation.
4. **Production Deployment & Dockerization**: Multi-stage Dockerfiles and production compose setup for deploying all services behind a reverse proxy (e.g. Caddy / Traefik / Nginx) with SSL.