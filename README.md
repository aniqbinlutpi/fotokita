<div align="center">

# Fotokita

**lagu~ foto kita "Tak Blur" with fotokita.com**

*A modern, full-stack wedding photography and interactive digital guestbook platform.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-fbf0df?logo=bun&logoColor=black)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare_R2-F38020?logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Workflow](#-workflow)
- [Features & Functions](#-features--functions)
  - [For Wedding Guests](#1-for-wedding-guests-live-digital-guestbook)
  - [For Couples & Hosts (Sub-Admin Portal)](#2-for-couples--hosts-sub-admin-portal)
  - [For Platform Superadmins](#3-for-platform-superadmins)
  - [Automated Retention & Storage Engine](#4-automated-retention--cloud-storage)
- [Tech Stack](#-tech-stack)
- [System Architecture & Ports](#-system-architecture--ports)
- [Getting Started & Installation](#-getting-started--installation)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start PostgreSQL with Docker](#2-start-postgresql-with-docker)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run Database Migrations](#5-run-database-migrations)
  - [6. Start All Services](#6-start-all-services)
- [Route & Page Navigation](#-route--page-navigation)
- [API Services Reference](#-api-services-reference)
- [Pricing](#-pricing)
- [License](#-license)

---

## 🌟 Overview

**Fotokita** is an end-to-end wedding photography and digital guestbook solution. It enables wedding couples to host real-time, interactive celebration galleries where guests can upload high-resolution photos and videos directly from their smartphones, sign a digital canvas guestbook, and leave heartfelt wishes—all without requiring guests to install an app or register an account.

Built with a decoupled microservice architecture powered by **Bun**, **Hono**, and **React 19**, Fotokita includes multi-tenant administration, dynamic visual page customization, automated cloud retention policies, and private **Cloudflare R2 / AWS S3** storage.

---

## 🔄 Workflow

```
   1. Onboarding & Setup        2. Live Wedding Celebration          3. Post-Event & Memories
 ┌───────────────────────┐     ┌────────────────────────────┐     ┌────────────────────────────┐
 │ • Superadmin Invite   │     │ • Guests scan table QR code│     │ • Couple reviews all media │
 │ • Couple registers    │ ──► │ • Upload photos & videos   │ ──► │ • 1-Click bulk ZIP export  │
 │ • Customizes theme,   │     │ • Digital canvas signature │     │ • Auto-retention lifecycle │
 │   fonts & live canvas │     │ • Heartfelt wishes wall    │     │   cleans up expired plans  │
 └───────────────────────┘     └────────────────────────────┘     └────────────────────────────┘
```

<div align="center">
  <img width="1280" height="600" alt="Fotokita Suggested Workflow" src="https://github.com/user-attachments/assets/c1e29a95-27dc-480b-9b75-1ea2ec778f77" />
</div>

---

## ✨ Features & Functions

### 1. For Wedding Guests (Live Digital Guestbook)
- **Instant Photo & Video Uploads**: Guests snap photos or upload media from their camera roll instantly via a responsive mobile-first UI.
- **Wishes & Greetings Wall**: Attach personalised blessings and names to every upload, visible on the live celebration stream.
- **Digital Canvas Signature Pad**: Guests can sign or draw directly on screen with a touch-friendly HTML5 signature canvas.
- **Photobooth Canvas & Photo Framing**: Crop, rotate, and style photos using interactive frame overlays powered by React Easy Crop.
- **Protected Guest Deletion**: Each upload is protected by an optional 4-digit guest secret code, allowing guests to remove their own photos without requiring login accounts.
- **Interactive Lightbox**: Fullscreen media viewer supporting zoom, media details, signatures, and quick downloads.

### 2. For Couples & Hosts (Sub-Admin Portal)
- **Live Visual Customizer**:
  - Select curated color palettes (Rose, Emerald, Obsidian, Champagne, Ocean, etc.).
  - Typography options: customizable partner names, ampersand sizing, and font pairings.
  - Interactive background effects: animated ambient light orbs, floating particles, and toggleable celebration fireworks.
  - Configurable headlines, taglines, and event dates.
- **Media Management & Moderation**: View all guest uploads in a centralized gallery with quick deletion controls.
- **Bulk ZIP Export**: Download all high-resolution photos and videos in a single ZIP file (`JSZip`) for archival.
- **Shareable Links & QR Codes**: Instant custom slug URLs (`fotokita.com/ali-dan-siti` or `/w/ali-dan-siti`) and downloadable QR codes for reception tables and invitations.

### 3. For Platform Superadmins
- **Health Check Dashboard**: Real-time operational monitoring aggregating statuses across Wedding, Media, Tenant, and Admin services.
- **Tenant Invite Generator**: Generate secure, single-use registration tokens with tier selection (`1day`, `1week`, `custom`) and receipt proof attachment.
- **Customer Inquiry CRM**: Lead management pipeline tracking prospective client inquiries, plan preferences, contact details, and conversion statuses.

### 4. Automated Retention & Cloud Storage
- **Private S3 / Cloudflare R2 Storage**: Secure key isolation (`weddings/{weddingId}/{uuid}.{ext}`) with time-limited (10-minute) presigned download URLs.
- **CORS Image Proxy**: Built-in streaming proxy endpoint (`/api/proxy-image`) for cross-origin HTML5 canvas export and photobooth rendering.
- **Scheduled Retention Worker**: An automated background cron runs every hour to clean up expired media files from storage and database tables once the plan validity expires (unless media preservation is explicitly enabled).

---

## 🛠 Tech Stack

| Layer | Technologies | Highlights |
|---|---|---|
| **Frontend Client** | React 19, Vite 8, TypeScript (~6.0) | TanStack Router v1, TanStack Query v5, Tailwind CSS v4, Motion, Base-UI / Shadcn UI, Sonner, Lucide React, JSZip, React Easy Crop |
| **Backend Microservices** | Bun Runtime, Hono v4, TypeScript | Zod v4 validation, Drizzle ORM v0.45, `postgres` driver (v3.4), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| **Database** | PostgreSQL 18 (Docker container) | Drizzle Kit v0.31 for schema generation, push, and migrations |
| **Cloud Object Storage** | Cloudflare R2 / AWS S3 | S3-compatible private bucket with presigned URLs & stream proxy |
| **Code Quality & Linter** | Oxlint, Bun Watcher, Docker Compose | Fast linting, sub-second hot reload, containerized database |

---

## 🌐 System Architecture & Ports

The platform uses a microservices topology where Vite proxies API requests transparently during local development:

```
                                  ┌───────────────────────────┐
                                  │    Frontend Application   │
                                  │  React 19 + Vite (5173)   │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │ /api/weddings                │ /api/media                   │ /api/tenant & /api/admin
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │     Wedding Service     │    │      Media Service      │    │     Tenant Service      │    │      Admin Service      │
    │    Hono / Bun (3001)    │    │    Hono / Bun (3000)    │    │    Hono / Bun (3004)    │    │    Hono / Bun (3002)    │
    └────────────┬────────────┘    └────────────┬────────────┘    └────────────┬────────────┘    └────────────┬────────────┘
                 │                              │                              │                              │
                 ▼                              ▼                              ▼                              ▼
    ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │                                     PostgreSQL 18 Database (Port 5433 Host / 5432)                                   │
    └───────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                                       ┌──────────────────────────────────┐
                                       │    Cloudflare R2 / AWS S3        │
                                       │      Private Object Bucket       │
                                       └──────────────────────────────────┘
```

| Service | Port | Base Local URL | Vite Proxy Prefix |
|---|---|---|---|
| **Frontend SPA** | `5173` | `http://localhost:5173` | — |
| **Media Service** | `3000` | `http://localhost:3000` | `/api/media` &rarr; `http://localhost:3000/media` |
| **Wedding Service** | `3001` | `http://localhost:3001` | `/api/weddings` &rarr; `http://localhost:3001/weddings` |
| **Admin Service** | `3002` | `http://localhost:3002` | `/api/admin` &rarr; `http://localhost:3002/admin` |
| **Tenant Service** | `3004` | `http://localhost:3004` | `/api/tenant` &rarr; `http://localhost:3004/tenant` |
| **PostgreSQL** | `5433` (Host) / `5432` | `postgres://fotokita:fotokita@localhost:5433/fotokita` | — |

---

## 🚀 Getting Started & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **[Bun](https://bun.sh)** (v1.2+ recommended)
- **[Docker](https://www.docker.com/)** and **Docker Compose**
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/waniq/fotokita.git
cd fotokita
```

### 2. Start PostgreSQL with Docker

Start the PostgreSQL 18 container in detached mode:

```bash
docker compose up -d postgres
```

> [!NOTE]
> The database runs externally on port `5433` (mapped to `5432` internally) to avoid collisions with any existing local PostgreSQL instances.

### 3. Configure Environment Variables

Create `.env` files in each service directory based on their corresponding `.env.example`:

#### **`services/wedding-service/.env`**
```env
PORT=3001
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
```

#### **`services/media-service/.env`**
```env
PORT=3000
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita

# Cloudflare R2 / AWS S3 Credentials
R2_REGION=auto
R2_ENDPOINT=https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=fotokita
```

#### **`services/tenant-service/.env`**
```env
PORT=3004
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
JWT_SECRET=super-secret-tenant-key-fotokita-change-in-production
WEDDING_SERVICE_URL=http://localhost:3001
MEDIA_SERVICE_URL=http://localhost:3000
ADMIN_SERVICE_URL=http://localhost:3002
```

#### **`services/admin-service/.env`**
```env
PORT=3002
DATABASE_URL=postgres://fotokita:fotokita@localhost:5433/fotokita
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
JWT_SECRET=super-secret-admin-key-fotokita-change-in-production
WEDDING_SERVICE_URL=http://localhost:3001
MEDIA_SERVICE_URL=http://localhost:3000
```

### 4. Install Dependencies

Install packages across the frontend and all backend microservices:

```bash
# Frontend
cd frontend && bun install

# Backend Services
cd ../services/wedding-service && bun install
cd ../media-service && bun install
cd ../tenant-service && bun install
cd ../admin-service && bun install
cd ../..
```

### 5. Run Database Migrations

Push the Drizzle schemas to PostgreSQL:

```bash
cd services/wedding-service && bunx drizzle-kit push
cd ../media-service && bunx drizzle-kit push
cd ../tenant-service && bunx drizzle-kit push
cd ../admin-service && bunx drizzle-kit push
cd ../..
```

### 6. Start All Services

Open separate terminal windows (or tabs) and launch each service:

```bash
# Terminal 1: Wedding Service (Port 3001)
cd services/wedding-service && bun run dev

# Terminal 2: Media Service (Port 3000)
cd services/media-service && bun run dev

# Terminal 3: Tenant Service (Port 3004)
cd services/tenant-service && bun run dev

# Terminal 4: Admin Service (Port 3002)
cd services/admin-service && bun run dev

# Terminal 5: Frontend SPA (Port 5173)
cd frontend && bun run dev
```

The application is now available at **`http://localhost:5173`**.

---

## 🧭 Route & Page Navigation

| Path | Purpose | Description |
|---|---|---|
| `/` | **Landing Page** | Platform showcase, feature highlight, interactive FAQ, pricing, and contact inquiries |
| `/demo` | **Interactive Demo** | Live preview of the guest gallery experience with sample wedding photos and wishes |
| `/:slug` or `/w/:slug` | **Live Wedding Gallery** | Public guestbook page for a specific wedding (e.g. `/ali-dan-siti`) |
| `/subadmin` or `/portal` | **Couple Sub-Admin** | Theme customizer, photo gallery management, and bulk ZIP download |
| `/login` | **Tenant Login** | Sub-admin authentication for wedding couples |
| `/register?token=...` | **Tenant Registration** | Onboarding page activated by superadmin invite token |
| `/admin` or `/adminfotokita` | **Platform Superadmin** | Cross-service health dashboard, invite generator, and sales CRM |

---

## 📡 API Services Reference

### Wedding Service (`:3001`)
- `GET /weddings` — List all registered weddings
- `GET /weddings/check-slug?slug=:slug` — Real-time slug availability check
- `GET /weddings/slug/:slug` — Fetch wedding details by unique slug
- `GET /weddings/:id` — Fetch wedding by UUID
- `POST /weddings` — Create a new wedding registry
- `PATCH /weddings/:id` — Update wedding information
- `DELETE /weddings/:id` — Remove wedding registry

### Media Service (`:3000`)
- `GET /media?weddingId=:id` — List media metadata for a wedding
- `GET /media/:id` — Get single media details
- `GET /media/:id/url` — Generate a short-lived (10-minute) presigned download URL
- `GET /media/proxy-image?url=:url` — Stream image with CORS headers for canvas manipulation
- `POST /media` — Multipart upload (`file`, `weddingId`, `wishes`, `fromName`, `signature`, `secretCode`)
- `DELETE /media/:id` — Delete photo/video (requires guest secret code or admin authorization)
- `DELETE /media/wedding/:weddingId` — Cascade delete all cloud storage objects and DB records

### Tenant Service (`:3004`)
- `POST /tenant/auth/login` — Sub-admin login (returns JWT)
- `POST /tenant/auth/register` — Couple registration with invite token
- `GET /tenant/auth/me` — Retrieve active tenant profile
- `GET /tenant/customization/:weddingId` — Get visual customization settings
- `PUT /tenant/customization/:weddingId` — Save visual customization settings
- `GET /tenant/maintenance/status` — Inspect media retention worker status
- `POST /tenant/maintenance/trigger-cleanup` — Trigger manual retention cleanup

### Admin Service (`:3002`)
- `POST /admin/auth/login` — Superadmin login (returns JWT)
- `GET /admin/dashboard/stats` — Platform metrics & microservice health statuses
- `GET /admin/invites` — List onboarding tokens
- `POST /admin/invites` — Create single-use invite token with plan tier & payment receipt
- `GET /admin/inquiries` — List customer inquiry leads
- `PATCH /admin/inquiries/:id` — Update inquiry status (`pending`, `contacted`, `converted`)

---

## 💳 Pricing

<div align="center">
  <img width="1218" height="1390" alt="Fotokita Pricing Plans" src="https://github.com/user-attachments/assets/79d0ccf7-a6d1-44b3-b874-d996738c713c" />
</div>

Fotokita offers flexible packages to fit celebrations of every scale:
- **1-Day Event Tier**: Ideal for single-day receptions with live photo streams and standard retention.
- **1-Week Celebration Tier**: Extended retention allowing guests to upload pre-wedding and post-wedding memories.
- **Custom / Enterprise Tier**: Tailored limits, extended cloud storage preservation, and dedicated support.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).

Copyright (c) 2026 waniq.
