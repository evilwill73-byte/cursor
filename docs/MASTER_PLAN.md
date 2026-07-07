# SoCalMedic Multi-App Video Platform — Master Plan

**Document version:** 1.0  
**Status:** Planning — awaiting approval before any code is written  
**Last updated:** July 7, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Architecture Overview](#3-architecture-overview)
4. [Locked Technical Decisions](#4-locked-technical-decisions)
5. [Repository Structure](#5-repository-structure)
6. [Multi-Tenancy Model (app_id)](#6-multi-tenancy-model-app_id)
7. [User Model — Separate Users Per App](#7-user-model--separate-users-per-app)
8. [Admin System — Option B (Per-App Admin)](#8-admin-system--option-b-per-app-admin)
9. [Technology Stack](#9-technology-stack)
10. [Database Schema](#10-database-schema)
11. [API Design](#11-api-design)
12. [SDK for Client Developers](#12-sdk-for-client-developers)
13. [Video Pipeline](#13-video-pipeline)
14. [Cloudflare R2 Storage Layout](#14-cloudflare-r2-storage-layout)
15. [Ubuntu Server Setup](#15-ubuntu-server-setup)
16. [Deployment & DevOps](#16-deployment--devops)
17. [App 1 — SoCalMedic Client (Mobile + Website)](#17-app-1--socalmedic-client-mobile--website)
18. [React Native Structure (Android + iOS)](#18-react-native-structure-android--ios)
19. [Website Structure (Next.js)](#19-website-structure-nextjs)
20. [Onboarding Additional Apps (App 2+)](#20-onboarding-additional-apps-app-2)
21. [Security Plan](#21-security-plan)
22. [Data Isolation Test Checklist](#22-data-isolation-test-checklist)
23. [Build Phases (Full Roadmap)](#23-build-phases-full-roadmap)
24. [Domain & URL Plan](#24-domain--url-plan)
25. [Cost Estimate](#25-cost-estimate)
26. [Pre-Build Decisions (Confirm Before Start)](#26-pre-build-decisions-confirm-before-start)
27. [Approval Checklist](#27-approval-checklist)
28. [Glossary](#28-glossary)

---

## 1. Executive Summary

You are building a **multi-tenant video streaming platform** (similar to Kuku TV, Story TV) where:

- **One backend** serves **many client applications** (mobile apps and websites).
- Each app is identified by an **`app_id`** flag on every piece of data.
- **Users are separate per app** — the same email on two apps creates two independent accounts.
- **You own the platform** (API, database, storage, transcoding, admin CMS) hosted on **your Ubuntu server**.
- **App 1 (SoCalMedic)** includes a **React Native mobile app** (Android + iOS) and a **Next.js website** in one client repo.
- **Other developers** can build App 2, App 3, etc. using your **public API** and **TypeScript SDK** without access to your database or server.
- **Option B admin** is included: a **super admin (you)** manages the platform; each app gets its **own admin login** scoped to that app only.

**Nothing is built until you reply "approved" on this document.**

---

## 2. Product Vision

### What you are building

| Layer | Description |
|-------|-------------|
| **Platform** | Shared backend API, admin CMS, video pipeline, database, CDN |
| **App 1 (SoCalMedic)** | React Native mobile + Next.js website — first product you ship |
| **App 2+ (future)** | Built by you or partner developers — same API, different `app_id` and branding |
| **Admin** | One admin panel; super admin sees all; app admins see only their app |

### Business model options (future)

- Free + ad-supported content
- Subscription / premium episodes (IAP)
- Per-app pricing (each `app_id` has its own plans)

### Content types supported

| Type | Aspect | Length | UX |
|------|--------|--------|-----|
| **Short video** | 9:16 vertical | 30 sec – 3 min | TikTok / Reels style swipe feed |
| **Long video** | 16:9 horizontal | 20+ min episodes | Traditional player with seasons/series |

Both types live in the same `videos` table with a `type` field (`short` | `long`).

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         YOUR UBUNTU SERVER                                  │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────┐   ┌─────────────────┐  │
│  │  Nginx   │──▶│  Next.js API     │──▶│PostgreSQL│   │  Redis          │  │
│  │  SSL     │   │  (port 3000)     │   │          │   │  cache + queue  │  │
│  └──────────┘   └────────┬─────────┘   └──────────┘   └────────┬────────┘  │
│                          │                                        │           │
│  ┌──────────┐   ┌────────▼─────────┐                   ┌─────────▼────────┐  │
│  │  Nginx   │──▶│  Next.js Admin   │                   │ FFmpeg Worker    │  │
│  │  admin   │   │  CMS (port 3001) │                   │ (PM2 / BullMQ)   │  │
│  └──────────┘   └──────────────────┘                   └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
         ▲                    ▲                                    │
         │                    │                                    ▼
    HTTPS API            HTTPS Admin                    ┌──────────────────┐
         │                    │                         │  Cloudflare R2   │
         │                    │                         │  + CDN           │
┌────────┴────────┐  ┌────────┴────────┐               └────────┬─────────┘
│ React Native    │  │ Next.js Website │                        │
│ (Android + iOS) │  │ (SoCalMedic)    │                        ▼
│ socalmedic-     │  │ socalmedic-     │               Video HLS playback
│ client/mobile   │  │ client/web      │
└─────────────────┘  └─────────────────┘
         ▲
         │  (future)
┌────────┴────────┐
│ App 2 Mobile +  │  ← Other developer, same API, different app_id
│ Web (partner)   │
└─────────────────┘
```

### Request flow (mobile / web client)

```
1. Client sends HTTPS request
2. Headers: X-App-Id, X-Api-Key, Authorization (JWT after login)
3. Nginx terminates SSL → forwards to Next.js API
4. API middleware validates app_id + API key
5. API queries PostgreSQL always filtered by app_id
6. Video playback: client loads HLS URL from Cloudflare CDN (R2 origin)
```

---

## 4. Locked Technical Decisions

These decisions are **confirmed** and should not change without a deliberate replan:

| # | Area | Decision |
|---|------|----------|
| 1 | Platform model | One shared backend → many client apps |
| 2 | App identification | `app_id` on every content and user record |
| 3 | Users | **Separate per app** — unique on `(email, app_id)` |
| 4 | API framework | **Next.js + TypeScript** (App Router, Route Handlers) |
| 5 | API hosting | **Your Ubuntu server** (self-hosted, not Vercel) |
| 6 | Database | **PostgreSQL 16** |
| 7 | Cache / job queue | **Redis** + **BullMQ** |
| 8 | Video storage | **Cloudflare R2** |
| 9 | Video delivery | **Cloudflare CDN** (custom domain on R2) |
| 10 | Transcoding | **FFmpeg** on Ubuntu worker |
| 11 | ORM | **Prisma** |
| 12 | Mobile App 1 | **React Native CLI** — shared screens, separate `android/` + `ios/` |
| 13 | Website App 1 | **Next.js + TypeScript** |
| 14 | Client SDK | **`@socalmedic/sdk`** TypeScript package |
| 15 | Admin model | **Option B** — super admin + per-app admin |
| 16 | Process manager | **PM2** |
| 17 | Reverse proxy | **Nginx** + **Let's Encrypt (Certbot)** |
| 18 | Client repo App 1 | **`socalmedic-client`** — monorepo with `apps/mobile` + `apps/web` |
| 19 | Platform repo | **`socalmedic-platform`** — API, admin, worker, database |
| 20 | Build apps | One by one; other devs use API only for their app |

---

## 5. Repository Structure

### Repo 1: `socalmedic-platform` (you own — backend)

```
socalmedic-platform/
├── apps/
│   ├── api/                            # Next.js — public API + admin API routes
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── v1/                 # Public endpoints (mobile + web)
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── videos/
│   │   │   │   │   ├── series/
│   │   │   │   │   ├── categories/
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── shorts/
│   │   │   │   │   ├── users/
│   │   │   │   │   └── search/
│   │   │   │   └── admin/v1/           # Admin-only endpoints (CMS)
│   │   │   │       ├── apps/
│   │   │   │       ├── admin-users/
│   │   │   │       ├── api-keys/
│   │   │   │       ├── videos/
│   │   │   │       ├── series/
│   │   │   │       ├── categories/
│   │   │   │       ├── home/
│   │   │   │       ├── users/
│   │   │   │       ├── subscriptions/
│   │   │   │       └── analytics/
│   │   │   └── health/
│   │   └── lib/
│   │       ├── middleware/
│   │       │   ├── app-context.ts      # X-App-Id + API key validation
│   │       │   ├── user-auth.ts        # JWT for end users
│   │       │   ├── admin-auth.ts       # JWT for admin users + RBAC
│   │       │   └── rate-limit.ts
│   │       ├── services/
│   │       └── utils/
│   │
│   └── admin/                          # Next.js — Admin CMS UI
│       ├── app/
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── videos/
│       │   ├── series/
│       │   ├── categories/
│       │   ├── home-layout/
│       │   ├── users/
│       │   ├── subscriptions/
│       │   ├── app-settings/
│       │   ├── analytics/
│       │   └── platform/               # Super admin only
│       │       ├── apps/
│       │       ├── api-keys/
│       │       └── admin-users/
│       └── components/
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/index.ts
│   ├── types/                          # Shared TypeScript interfaces
│   │   └── src/
│   │       ├── app.ts
│   │       ├── video.ts
│   │       ├── user.ts
│   │       └── api.ts
│   └── sdk/                            # @socalmedic/sdk — published to npm or git
│       └── src/
│           ├── client.ts
│           ├── auth.ts
│           ├── videos.ts
│           ├── series.ts
│           ├── shorts.ts
│           ├── home.ts
│           └── users.ts
│
├── workers/
│   └── transcoder/
│       ├── src/
│       │   ├── worker.ts               # BullMQ consumer
│       │   ├── ffmpeg.ts               # HLS transcoding
│       │   └── r2.ts                   # Upload segments to R2
│       └── package.json
│
├── deploy/
│   ├── nginx/
│   │   ├── api.conf                    # api.yourdomain.com
│   │   └── admin.conf                  # admin.yourdomain.com
│   ├── pm2/
│   │   └── ecosystem.config.js         # api + admin + worker processes
│   ├── docker-compose.yml              # PostgreSQL + Redis (local/dev)
│   └── scripts/
│       ├── setup-ubuntu.sh             # First-time server setup
│       └── deploy.sh                   # git pull + build + migrate + restart
│
├── docs/
│   ├── MASTER_PLAN.md                  # This file
│   └── api/
│       └── openapi.yaml                # Public API spec for client developers
│
├── .env.example
├── turbo.json
└── package.json
```

### Repo 2: `socalmedic-client` (App 1 — mobile + website)

```
socalmedic-client/
├── apps/
│   ├── mobile/                         # React Native (Android + iOS)
│   │   ├── src/
│   │   │   ├── screens/                # SAME screens for Android + iOS
│   │   │   │   ├── SplashScreen.tsx
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── CategoriesScreen.tsx
│   │   │   │   ├── CategoryDetailScreen.tsx
│   │   │   │   ├── SeriesDetailScreen.tsx
│   │   │   │   ├── VideoPlayerScreen.tsx
│   │   │   │   ├── ShortsFeedScreen.tsx
│   │   │   │   ├── SearchScreen.tsx
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   └── FavoritesScreen.tsx
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   └── AppNavigator.tsx
│   │   │   ├── services/
│   │   │   │   └── api.ts              # @socalmedic/sdk instance
│   │   │   ├── hooks/
│   │   │   └── config/
│   │   │       └── app.config.ts
│   │   ├── android/                    # ANDROID ONLY — Android Studio
│   │   │   ├── app/
│   │   │   │   ├── build.gradle
│   │   │   │   └── src/main/
│   │   │   │       ├── AndroidManifest.xml
│   │   │   │       └── res/            # icons, strings
│   │   │   └── gradle/
│   │   ├── ios/                        # iOS ONLY — Xcode
│   │   │   ├── SoCalMedic/
│   │   │   │   └── Info.plist
│   │   │   ├── SoCalMedic.xcodeproj/
│   │   │   └── Podfile
│   │   ├── App.tsx
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── web/                            # Next.js website
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx                    # Home
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   ├── categories/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [slug]/page.tsx
│       │   │   ├── series/[id]/page.tsx
│       │   │   ├── watch/[id]/page.tsx         # HLS video player
│       │   │   ├── shorts/page.tsx
│       │   │   ├── search/page.tsx
│       │   │   ├── profile/page.tsx
│       │   │   └── favorites/page.tsx
│       │   ├── components/
│       │   │   ├── VideoPlayer.tsx             # hls.js player
│       │   │   ├── ShortsPlayer.tsx
│       │   │   ├── ContentRow.tsx
│       │   │   └── Header.tsx
│       │   └── lib/
│       │       └── api.ts                      # SDK instance (server + client)
│       ├── public/
│       │   ├── favicon.ico
│       │   └── logo.png
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                         # Shared between mobile + web
│       ├── constants/
│       │   └── index.ts                # APP_ID, video types, route names
│       ├── theme/
│       │   ├── colors.ts
│       │   ├── fonts.ts
│       │   └── spacing.ts
│       ├── types/
│       │   └── index.ts
│       └── hooks/                        # Portable hooks where possible
│           ├── useAuth.ts
│           └── useVideos.ts
│
├── .env.example
├── turbo.json
└── package.json
```

### Repo 3: `storytv-client` (App 2 — future, partner developer)

Same structure as `socalmedic-client`. Partner clones the template, changes:

- `APP_ID` → `storytv`
- App name, logo, colors in `packages/shared/theme/`
- `android/` package name and `ios/` bundle ID
- `.env` API key (issued by you)

**No changes to `socalmedic-platform` backend code required.**

---

## 6. Multi-Tenancy Model (app_id)

### Core rule

> Every table that holds app-specific data **must** have an `app_id` column.  
> Every API query **must** filter by `app_id` from the authenticated request context.  
> Never trust `app_id` from the request body alone.

### How clients identify themselves

```http
GET /api/v1/videos?type=short&page=1
Host: api.yourdomain.com
X-App-Id: socalmedic
X-Api-Key: sk_live_xxxxxxxxxxxx
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

### App registry table

```sql
apps (
  id            UUID PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,     -- 'socalmedic', 'storytv'
  name          TEXT NOT NULL,            -- 'SoCalMedic'
  bundle_id     TEXT,                     -- 'com.socalmedic.app'
  web_domain    TEXT,                     -- 'www.socalmedic.com'
  theme_json    JSONB,                    -- colors, logo URL, fonts
  features_json JSONB,                    -- { shorts: true, subscriptions: true }
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

### API key table

```sql
api_keys (
  id            UUID PRIMARY KEY,
  app_id        UUID REFERENCES apps(id),
  key_hash      TEXT NOT NULL,            -- bcrypt hash of sk_live_xxx
  key_prefix    TEXT NOT NULL,            -- 'sk_live_abcd' (display only)
  name          TEXT,                     -- 'production', 'sandbox'
  scopes        TEXT[],                   -- ['read:content', 'write:analytics']
  rate_limit    INT DEFAULT 1000,         -- requests per hour
  is_active     BOOLEAN DEFAULT true,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

### Middleware logic (pseudocode)

```typescript
// Every public API request
async function appContextMiddleware(req) {
  const appSlug = req.headers['x-app-id'];
  const apiKey  = req.headers['x-api-key'];

  if (!appSlug || !apiKey) throw 400;

  const app = await db.apps.findUnique({ where: { slug: appSlug, is_active: true } });
  if (!app) throw 404;

  const keyValid = await validateApiKey(apiKey, app.id);
  if (!keyValid) throw 401;

  req.appContext = { appId: app.id, appSlug: app.slug };
}

// Every DB query
db.videos.findMany({ where: { app_id: req.appContext.appId } });
```

---

## 7. User Model — Separate Users Per App

### Rule

The same person using two different apps must register **twice** — once per app.  
`user@gmail.com` on SoCalMedic and `user@gmail.com` on StoryTV are **two separate database rows**.

### Schema

```sql
users (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL REFERENCES apps(id),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, app_id)                  -- separate users per app
)
```

### JWT payload (end user)

```json
{
  "sub": "user_uuid",
  "app_id": "socalmedic",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Cross-app login prevention

- JWT `app_id` must match `X-App-Id` header on every authenticated request.
- Mismatch → `401 Unauthorized`.
- Mobile and web for the **same app** share the same user account (same `app_id`).

---

## 8. Admin System — Option B (Per-App Admin)

### Overview

One admin application at `admin.yourdomain.com`. Two roles:

| Role | Who | Access |
|------|-----|--------|
| `super_admin` | You (platform owner) | All apps, all data, platform settings |
| `app_admin` | You or partner per app | Only their `app_id` data |

### Admin user schema

```sql
admin_users (
  id            UUID PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL,            -- 'super_admin' | 'app_admin'
  app_id        UUID REFERENCES apps(id), -- NULL for super_admin, REQUIRED for app_admin
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
)

-- Optional: one person managing multiple apps
admin_user_apps (
  admin_user_id UUID REFERENCES admin_users(id),
  app_id        UUID REFERENCES apps(id),
  PRIMARY KEY (admin_user_id, app_id)
)
```

### Admin JWT payload

```json
{
  "sub": "admin_uuid",
  "role": "app_admin",
  "app_id": "socalmedic",
  "email": "admin@socalmedic.com"
}
```

### Permission matrix

| Action | super_admin | app_admin |
|--------|:-----------:|:---------:|
| Create / disable apps | ✅ | ❌ |
| Generate / revoke API keys | ✅ | ❌ |
| Create app admin accounts | ✅ | ❌ |
| Upload & publish videos | ✅ all apps | ✅ own app |
| Manage series & categories | ✅ all apps | ✅ own app |
| Edit home banners & rows | ✅ all apps | ✅ own app |
| View & disable end users | ✅ all apps | ✅ own app users |
| Manage subscription plans | ✅ all apps | ✅ own app |
| Edit app theme / branding | ✅ all apps | ✅ own app |
| View analytics | ✅ all apps | ✅ own app |
| Access server / DB / R2 | ✅ (you) | ❌ |
| See other apps' content | ✅ | ❌ |

### Admin UI behavior

- **Super admin** sees an **app switcher** dropdown in the header to manage any app.
- **App admin** has no switcher — all screens auto-scoped to their `app_id`.
- Attempting to access another app's data via URL manipulation → `403 Forbidden`.

### Admin audit log (recommended)

```sql
admin_audit_log (
  id            UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id),
  action        TEXT,                     -- 'video.publish', 'user.disable', 'app.create'
  app_id        UUID,
  target_id     UUID,
  metadata_json JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

---

## 9. Technology Stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| API | Next.js (App Router) | 15+ |
| Language | TypeScript | 5.x |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.x |
| Job queue | BullMQ | Latest |
| Object storage | Cloudflare R2 | S3-compatible API |
| CDN | Cloudflare | Custom domain on R2 bucket |
| Transcoding | FFmpeg | 6.x on Ubuntu |
| Mobile | React Native CLI | 0.76+ |
| Mobile video player | react-native-video | HLS support |
| Web framework | Next.js | 15+ App Router |
| Web video player | hls.js | Browser HLS |
| Admin UI | Next.js + shadcn/ui | Same monorepo as API |
| Auth (users) | JWT | access 15 min + refresh 30 days |
| Auth (admin) | JWT | separate secret, 8 hour session |
| Process manager | PM2 | Auto-restart, cluster mode |
| Reverse proxy | Nginx | 1.24+ |
| SSL | Certbot / Let's Encrypt | Auto-renew |
| Monorepo tool | Turborepo | Both repos |
| Push notifications | Firebase FCM | Phase 5 |
| Subscriptions | RevenueCat or native IAP | Phase 5 |
| Search | Typesense | Phase 5 (optional) |
| Error tracking | Sentry | Recommended |
| CI/CD | GitHub Actions | Test + deploy trigger |

---

## 10. Database Schema

### Complete table list

```
── Platform ──────────────────────────────────
apps
api_keys
admin_users
admin_user_apps          (optional)
admin_audit_log

── Content (all have app_id) ────────────────
series
videos
categories
video_categories
home_rows
banners

── Users (all have app_id) ───────────────────
users
watch_history
favorites
user_sessions            (refresh tokens)

── Monetization (all have app_id) ─────────────
subscription_plans
subscriptions
payment_events

── Infrastructure ────────────────────────────
transcode_jobs
```

### Core content tables

```sql
series (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL REFERENCES apps(id),
  title         TEXT NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  type          TEXT NOT NULL,            -- 'long' | 'short'
  is_premium    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX idx_series_app ON series(app_id);

videos (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL REFERENCES apps(id),
  series_id     UUID REFERENCES series(id),
  episode_number INT,
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL,            -- 'long' | 'short'
  duration_sec  INT,
  thumbnail_url TEXT,
  hls_path      TEXT,                     -- R2 path to master.m3u8
  status        TEXT DEFAULT 'draft',     -- draft|processing|published|failed
  is_premium    BOOLEAN DEFAULT false,
  view_count    BIGINT DEFAULT 0,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX idx_videos_app ON videos(app_id);
CREATE INDEX idx_videos_app_type ON videos(app_id, type);
CREATE INDEX idx_videos_app_status ON videos(app_id, status);

categories (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL REFERENCES apps(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  cover_url     TEXT,
  sort_order    INT DEFAULT 0,
  UNIQUE (app_id, slug)
)

home_rows (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL REFERENCES apps(id),
  title         TEXT NOT NULL,
  type          TEXT NOT NULL,            -- 'series'|'videos'|'category'|'continue'
  config_json   JSONB,                    -- { series_ids: [], category_id: '' }
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true
)

banners (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL REFERENCES apps(id),
  image_url     TEXT NOT NULL,
  link_type     TEXT,                     -- 'video'|'series'|'url'
  link_id       TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true
)
```

### User engagement tables

```sql
watch_history (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id),
  video_id      UUID NOT NULL REFERENCES videos(id),
  progress_sec  INT DEFAULT 0,
  completed     BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (app_id, user_id, video_id)
)

favorites (
  id            UUID PRIMARY KEY,
  app_id        UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id),
  video_id      UUID NOT NULL REFERENCES videos(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (app_id, user_id, video_id)
)

user_sessions (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  refresh_token_hash TEXT NOT NULL,
  app_id        UUID NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

### Transcode jobs

```sql
transcode_jobs (
  id            UUID PRIMARY KEY,
  video_id      UUID NOT NULL REFERENCES videos(id),
  app_id        UUID NOT NULL,
  status        TEXT DEFAULT 'queued',   -- queued|processing|done|failed
  input_path    TEXT,                     -- R2 raw path
  output_path   TEXT,                     -- R2 HLS path
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

---

## 11. API Design

### Base URLs

```
Public API:   https://api.yourdomain.com/api/v1
Admin API:    https://api.yourdomain.com/api/admin/v1
Health:       https://api.yourdomain.com/api/health
```

### Public API endpoints

#### App config
```
GET  /app/config
     Returns theme, features, app name for the requesting app_id
```

#### Auth
```
POST /auth/register          { email, password, name }
POST /auth/login             { email, password }
POST /auth/refresh           { refresh_token }
POST /auth/logout            (requires JWT)
GET  /auth/me                (requires JWT)
```

#### Videos
```
GET  /videos                 ?type=short|long&page=1&limit=20&category_id=
GET  /videos/:id
GET  /videos/trending        ?type=short|long&limit=10
```

#### Series
```
GET  /series                 ?page=1&limit=20
GET  /series/:id
GET  /series/:id/episodes    ?page=1
```

#### Categories
```
GET  /categories
GET  /categories/:slug/videos ?page=1
```

#### Home
```
GET  /home                   Returns { banners: [], rows: [] }
```

#### Shorts feed
```
GET  /shorts/feed            ?page=1&limit=10
POST /shorts/:id/view        Increment view count
```

#### User
```
GET    /user/profile
PATCH  /user/profile         { name, avatar_url }
GET    /user/watch-history   ?page=1
POST   /user/watch-history   { video_id, progress_sec, completed }
GET    /user/continue-watching
GET    /user/favorites       ?page=1
POST   /user/favorites       { video_id }
DELETE /user/favorites/:video_id
```

#### Search (Phase 5)
```
GET  /search                 ?q=query&page=1
```

#### Subscriptions (Phase 5)
```
GET  /subscriptions/plans
GET  /subscriptions/status
POST /subscriptions/verify   { platform: 'apple'|'google', receipt: '...' }
```

### Admin API endpoints

#### Auth
```
POST /admin/v1/auth/login    { email, password }
POST /admin/v1/auth/logout
GET  /admin/v1/auth/me
```

#### Platform (super_admin only)
```
GET    /admin/v1/apps
POST   /admin/v1/apps                    { slug, name, bundle_id, theme_json }
PATCH  /admin/v1/apps/:id
GET    /admin/v1/api-keys                ?app_id=
POST   /admin/v1/api-keys                { app_id, name, scopes }
DELETE /admin/v1/api-keys/:id
GET    /admin/v1/admin-users
POST   /admin/v1/admin-users             { email, password, role, app_id }
PATCH  /admin/v1/admin-users/:id
```

#### Content (super_admin + app_admin — scoped by app_id)
```
GET    /admin/v1/videos                  ?status=&type=&page=
POST   /admin/v1/videos/upload-url       { filename, content_type } → presigned R2 URL
POST   /admin/v1/videos                  { title, series_id, type, ... }
PATCH  /admin/v1/videos/:id
DELETE /admin/v1/videos/:id
POST   /admin/v1/videos/:id/publish

GET    /admin/v1/series
POST   /admin/v1/series
PATCH  /admin/v1/series/:id
DELETE /admin/v1/series/:id

GET    /admin/v1/categories
POST   /admin/v1/categories
PATCH  /admin/v1/categories/:id
DELETE /admin/v1/categories/:id

GET    /admin/v1/home
PUT    /admin/v1/home/banners
PUT    /admin/v1/home/rows

GET    /admin/v1/users                   ?page=&search=
PATCH  /admin/v1/users/:id               { is_active: false }

GET    /admin/v1/analytics               ?from=&to=
```

### Standard response format

```json
// Success
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 }
}

// Error
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

### HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / missing headers |
| 401 | Invalid API key or JWT |
| 403 | Valid auth but wrong app_id / insufficient role |
| 404 | Resource not found (or wrong app_id) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## 12. SDK for Client Developers

### Package: `@socalmedic/sdk`

Published via npm (private) or git dependency. Used by mobile, web, and partner apps.

### Installation

```bash
npm install @socalmedic/sdk
```

### Usage

```typescript
import { SoCalMedicClient } from '@socalmedic/sdk';

const client = new SoCalMedicClient({
  baseUrl: 'https://api.yourdomain.com',
  appId: 'socalmedic',
  apiKey: process.env.SOCALMEDIC_API_KEY,
});

// Set user token after login
client.setAccessToken('eyJhbGciOi...');

// Examples
const home     = await client.home.get();
const videos   = await client.videos.list({ type: 'short', page: 1 });
const feed     = await client.shorts.getFeed({ page: 1 });
const history  = await client.users.getWatchHistory();
await client.users.saveProgress({ videoId: '...', progressSec: 120 });
```

### What you give partner developers (App 2+)

1. `app_id` slug (e.g. `storytv`)
2. API key — sandbox + production
3. API base URL
4. `@socalmedic/sdk` install instructions
5. `socalmedic-client` repo as a template (clone + rebrand)
6. OpenAPI spec (`docs/api/openapi.yaml`)
7. Support contact

### What partners never receive

- Database credentials
- R2 access keys
- Server SSH access
- Super admin login

---

## 13. Video Pipeline

### Upload and transcode flow

```
1. Admin CMS → POST /admin/v1/videos/upload-url
   ← { upload_url, video_id, r2_path }

2. Admin CMS → PUT upload_url (direct to R2, raw MP4)

3. Admin CMS → POST /admin/v1/videos { video_id, title, type, series_id, ... }
   → video.status = 'draft'

4. Admin CMS → POST /admin/v1/videos/:id/publish
   → video.status = 'processing'
   → Job added to Redis queue

5. FFmpeg Worker picks up job:
   a. Download raw MP4 from R2
   b. Transcode to HLS:
      - 360p (shorts/mobile)
      - 720p (standard)
      - 1080p (long form, optional)
   c. Generate thumbnail (frame at 5 sec)
   d. Upload HLS segments + master.m3u8 to R2
   e. Upload thumbnail to R2
   f. Update video: status = 'published', hls_path, thumbnail_url

6. Client apps → GET /api/v1/videos/:id
   ← { hls_url: 'https://cdn.yourdomain.com/socalmedic/videos/{id}/hls/master.m3u8' }
```

### FFmpeg HLS output structure

```
/{app_id}/videos/{video_id}/hls/
  master.m3u8
  360p/
    index.m3u8
    seg000.ts
    seg001.ts
  720p/
    index.m3u8
    seg000.ts
```

### Transcode job statuses

```
draft → processing → published
                   → failed (admin can retry)
```

---

## 14. Cloudflare R2 Storage Layout

```
socalmedic-videos/                      (R2 bucket)
├── socalmedic/                         (app_id folder)
│   ├── videos/
│   │   └── {video_id}/
│   │       ├── raw/
│   │       │   └── source.mp4
│   │       └── hls/
│   │           ├── master.m3u8
│   │           ├── 360p/...
│   │           └── 720p/...
│   ├── thumbnails/
│   │   └── {video_id}.jpg
│   └── assets/
│       ├── logo.png
│       └── banner-default.jpg
│
└── storytv/                            (App 2 — completely separate folder)
    └── (same structure)
```

### CDN URL pattern

```
https://cdn.yourdomain.com/{app_id}/videos/{video_id}/hls/master.m3u8
https://cdn.yourdomain.com/{app_id}/thumbnails/{video_id}.jpg
```

### R2 environment variables (Ubuntu server only)

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=socalmedic-videos
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

---

## 15. Ubuntu Server Setup

### Minimum server specs

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 80 GB SSD | 160 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Network | 1 Gbps | 1 Gbps |

> Video files are stored in R2, not on the server disk.  
> Server disk is used for OS, PostgreSQL, Redis, and temporary transcode files.

### Software to install

```bash
# System
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx
sudo apt install -y ffmpeg postgresql-16 redis-server
sudo apt install -y git curl build-essential

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Services running on server

| Service | Port | Managed by |
|---------|------|------------|
| Nginx | 80, 443 | systemd |
| Next.js API | 3000 | PM2 |
| Next.js Admin | 3001 | PM2 |
| FFmpeg Worker | — | PM2 |
| PostgreSQL | 5432 | systemd (localhost only) |
| Redis | 6379 | systemd (localhost only) |
| Next.js Web (optional) | 3002 | PM2 |

### Nginx config summary

```nginx
# api.yourdomain.com → localhost:3000
# admin.yourdomain.com → localhost:3001
# www.socalmedic.com → localhost:3002 (if web hosted here)
```

### PM2 processes

```javascript
// deploy/pm2/ecosystem.config.js
module.exports = {
  apps: [
    { name: 'api',      script: 'apps/api/server.js',      instances: 2, exec_mode: 'cluster' },
    { name: 'admin',    script: 'apps/admin/server.js',    instances: 1 },
    { name: 'worker',   script: 'workers/transcoder/dist/worker.js', instances: 1 },
    { name: 'web',      script: 'apps/web/server.js',      instances: 1 }, // optional
  ]
};
```

---

## 16. Deployment & DevOps

### First-time server setup

```bash
# On Ubuntu server
git clone https://github.com/yourorg/socalmedic-platform.git
cd socalmedic-platform
cp .env.example .env
# Edit .env with production values
npm install
npm run build
npx prisma migrate deploy
npx prisma db seed          # Creates super admin + first app
pm2 start deploy/pm2/ecosystem.config.js
pm2 save
pm2 startup
```

### Every deployment

```bash
# deploy/scripts/deploy.sh
git pull origin main
npm install
npm run build
npx prisma migrate deploy
pm2 restart all
```

### Environment variables (production `.env`)

```env
# Database
DATABASE_URL=postgresql://socalmedic:STRONG_PASSWORD@localhost:5432/socalmedic

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=long-random-string-change-this
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
ADMIN_JWT_SECRET=separate-long-random-string
ADMIN_JWT_EXPIRES_IN=8h

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=socalmedic-videos
R2_PUBLIC_URL=https://cdn.yourdomain.com

# API
NODE_ENV=production
API_PORT=3000
ADMIN_PORT=3001
```

### Git branching strategy

```
main          → production (deploys to Ubuntu server)
develop       → integration branch
feature/*     → feature branches
cursor/*      → cloud agent branches
```

### CI/CD (GitHub Actions — recommended)

```
on push to main:
  1. Run TypeScript type check
  2. Run Prisma validate
  3. SSH to Ubuntu server → run deploy.sh
```

---

## 17. App 1 — SoCalMedic Client (Mobile + Website)

### App 1 identity

| Field | Value |
|-------|-------|
| app_id slug | `socalmedic` |
| App name | SoCalMedic |
| Android package | `com.socalmedic.app` |
| iOS bundle ID | `com.socalmedic.app` |
| Website | `www.socalmedic.com` |

### Features for App 1 MVP

| Feature | Mobile | Web |
|---------|:------:|:---:|
| Home screen (banners + rows) | ✅ | ✅ |
| Categories browse | ✅ | ✅ |
| Series detail + episode list | ✅ | ✅ |
| Long video player (HLS) | ✅ | ✅ |
| Short video vertical feed | ✅ | ✅ |
| Search | ✅ | ✅ |
| Register / Login | ✅ | ✅ |
| Profile | ✅ | ✅ |
| Favorites | ✅ | ✅ |
| Continue watching | ✅ | ✅ |
| Push notifications | Phase 5 | ❌ |
| Subscriptions / paywall | Phase 5 | Phase 5 |

### Same user on mobile and web

Because both clients use `app_id = socalmedic`:
- User registers on mobile → can log in on website with same email/password.
- Watch history syncs across mobile and web automatically.

---

## 18. React Native Structure (Android + iOS)

### Rule: one codebase, two native folders

```
apps/mobile/
  src/screens/     ← ALL UI code here (shared Android + iOS)
  android/         ← Android Studio config ONLY
  ios/             ← Xcode config ONLY
```

### Android folder responsibilities (`android/`)

| File | Purpose |
|------|---------|
| `app/build.gradle` | `applicationId "com.socalmedic.app"`, version, dependencies |
| `app/src/main/AndroidManifest.xml` | Permissions (INTERNET), app name |
| `app/src/main/res/` | App icon (mipmap), strings |
| `gradle.properties` | Build settings |
| `app/socalmedic.keystore` | Release signing (never commit to git) |

### iOS folder responsibilities (`ios/`)

| File | Purpose |
|------|---------|
| `SoCalMedic/Info.plist` | Bundle display name, permissions, ATS |
| `SoCalMedic.xcodeproj/` | Xcode project, bundle ID `com.socalmedic.app` |
| `Podfile` | CocoaPods dependencies |
| `SoCalMedic/Images.xcassets/` | App icon, launch image |

### Platform-specific code (only when needed)

```typescript
// src/utils/platform.ts
import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
```

### Environment config

```typescript
// apps/mobile/src/config/app.config.ts
export const AppConfig = {
  APP_ID: 'socalmedic',
  API_URL: 'https://api.yourdomain.com',
  API_KEY: process.env.SOCALMEDIC_API_KEY,
  APP_NAME: 'SoCalMedic',
};
```

### Key React Native dependencies

```json
{
  "react-native-video": "^6.x",
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "@socalmedic/sdk": "workspace:*",
  "react-native-safe-area-context": "^4.x",
  "react-native-screens": "^3.x",
  "react-native-gesture-handler": "^2.x",
  "@react-native-async-storage/async-storage": "^1.x"
}
```

### Build commands

```bash
# Android (Android Studio or CLI)
cd apps/mobile
npx react-native run-android
cd android && ./gradlew assembleRelease   # APK/AAB for Play Store

# iOS (Xcode required — macOS only)
cd apps/mobile
npx react-native run-ios
# Or open ios/SoCalMedic.xcodeproj in Xcode → Archive → TestFlight
```

---

## 19. Website Structure (Next.js)

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Banners + content rows |
| `/login` | Login | Email + password |
| `/register` | Register | Create account |
| `/categories` | Categories | All categories grid |
| `/categories/[slug]` | Category detail | Videos in category |
| `/series/[id]` | Series detail | Episode list |
| `/watch/[id]` | Video player | HLS player, full page |
| `/shorts` | Shorts feed | Vertical scroll/grid |
| `/search` | Search | Query input + results |
| `/profile` | Profile | User info + settings |
| `/favorites` | Favorites | Saved videos |

### Website environment

```env
# apps/web/.env.local
NEXT_PUBLIC_APP_ID=socalmedic
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
SOCALMEDIC_API_KEY=sk_live_xxxxx        # server-side only (not NEXT_PUBLIC_)
```

### Video player (web)

```typescript
// hls.js for HLS playback in browser
import Hls from 'hls.js';

// Use CDN URL from API response
const hlsUrl = video.hls_url;
// 'https://cdn.yourdomain.com/socalmedic/videos/{id}/hls/master.m3u8'
```

### Website deployment options

| Option | Where | Notes |
|--------|-------|-------|
| A — Same Ubuntu server | Nginx → port 3002 | Simplest, one server |
| B — Cloudflare Pages | Cloudflare | Free, fast CDN for static |
| C — Vercel | Vercel | Easy Next.js deploy (frontend only) |

> Website only calls your API — it never touches the database directly.  
> Option A keeps everything on your server. Option B/C also work fine.

---

## 20. Onboarding Additional Apps (App 2+)

### Step-by-step when adding a new app

```
STEP 1 — You (super admin):
  → Login to admin.yourdomain.com
  → Platform → Apps → Create new app
     slug: storytv, name: StoryTV, bundle_id: com.storytv.app
  → Platform → API Keys → Generate key for storytv
  → Platform → Admin Users → Create app_admin
     email: admin@storytv.com, role: app_admin, app_id: storytv

STEP 2 — You send partner developer:
  → app_id: storytv
  → API key (sandbox + production)
  → API URL: https://api.yourdomain.com
  → SDK install: npm install @socalmedic/sdk
  → Template repo: socalmedic-client (clone + rebrand)
  → Admin login credentials

STEP 3 — Partner developer:
  → Clones socalmedic-client → renames to storytv-client
  → Changes APP_ID=storytv in .env
  → Changes android/ package name + ios/ bundle ID
  → Updates packages/shared/theme/ (colors, logo)
  → Builds screens using @socalmedic/sdk (no backend code)
  → Logs into admin.storytv or admin.yourdomain.com
  → Uploads their own content

STEP 4 — You verify:
  → Run data isolation checklist (Section 22)
  → App 2 content not visible in App 1
  → App 2 users cannot login to App 1
```

### What changes per new app

| Item | Changes |
|------|---------|
| `socalmedic-platform` backend | **Nothing** — only new row in `apps` table |
| `socalmedic-client` template | Clone → rebrand |
| Android `applicationId` | `com.storytv.app` |
| iOS bundle ID | `com.storytv.app` |
| `.env` APP_ID | `storytv` |
| API key | New key issued by you |
| Admin account | New `app_admin` row |
| R2 folder | `/storytv/` (auto-created on first upload) |

---

## 21. Security Plan

### API security

- [ ] All traffic HTTPS only (Nginx + Certbot)
- [ ] API keys stored as bcrypt hashes in DB
- [ ] Rate limiting per `app_id` + IP via Redis (e.g. 1000 req/hour)
- [ ] JWT access token: 15 min expiry
- [ ] JWT refresh token: 30 days, stored hashed in `user_sessions`
- [ ] User JWT `app_id` must match `X-App-Id` header
- [ ] Admin JWT separate secret from user JWT
- [ ] App admin cannot access other `app_id` (server-side, not UI only)
- [ ] Input validation on all endpoints (zod schemas)
- [ ] CORS allowlist per registered app domain

### Infrastructure security

- [ ] PostgreSQL listens on localhost only (not public)
- [ ] Redis listens on localhost only
- [ ] Ubuntu firewall (UFW): only ports 22, 80, 443 open
- [ ] SSH key authentication only (disable password SSH)
- [ ] R2 credentials only on server (never in client apps)
- [ ] API key in mobile app: obfuscate or use build-time injection (not in git)
- [ ] Presigned R2 upload URLs expire in 15 minutes
- [ ] Admin panel optionally IP-restricted for super admin

### Content security

- [ ] HLS URLs served via CDN (no direct R2 bucket access)
- [ ] Optional: signed CDN URLs for premium content (Phase 5)
- [ ] Video access check: verify user subscription before returning `hls_url` for premium content

---

## 22. Data Isolation Test Checklist

Run before launching each new app:

- [ ] `GET /videos` with App A key → only App A videos returned
- [ ] `GET /videos` with App B key → only App B videos returned
- [ ] User registered on App A → cannot login on App B (same email)
- [ ] User JWT from App A → rejected on App B requests
- [ ] App A watch history → not visible to App B users
- [ ] App A favorites → not visible to App B users
- [ ] App A home banners → not shown to App B clients
- [ ] App A admin → cannot see App B videos in CMS
- [ ] App A admin → cannot access `/admin/v1/apps` (super admin only)
- [ ] Wrong API key → 401 on all endpoints
- [ ] Missing `X-App-Id` header → 400
- [ ] CDN path `/socalmedic/` not accessible via `/storytv/` URL guessing
- [ ] Search results (Phase 5) → no cross-app results

---

## 23. Build Phases (Full Roadmap)

### Phase 0 — Server & Platform Foundation

**Goal:** Ubuntu server running, empty API responding, database ready.

| # | Task |
|---|------|
| 0.1 | Provision Ubuntu VPS, install Nginx, Node 20, PM2, PostgreSQL, Redis, FFmpeg |
| 0.2 | Configure Nginx + SSL (Certbot) for `api.yourdomain.com` |
| 0.3 | Create `socalmedic-platform` monorepo (Turborepo) |
| 0.4 | Prisma schema — all tables with `app_id` |
| 0.5 | Seed: create super admin account + `socalmedic` app + API key |
| 0.6 | App context middleware (`X-App-Id` + API key) |
| 0.7 | `GET /api/health` endpoint |
| 0.8 | Configure Cloudflare R2 bucket + CDN domain |
| 0.9 | PM2 ecosystem file + deploy script |

**Exit criteria:** `https://api.yourdomain.com/api/health` returns `{ status: "ok" }`.

---

### Phase 1 — Admin CMS + Content Pipeline

**Goal:** Upload a video in admin → it transcodes → appears in public API.

| # | Task |
|---|------|
| 1.1 | Admin auth (login, JWT with role + app_id) |
| 1.2 | RBAC middleware on `/api/admin/v1/*` |
| 1.3 | Super admin screens: Apps, API Keys, Admin Users |
| 1.4 | App admin screens: scoped to their `app_id` only |
| 1.5 | Presigned R2 upload endpoint |
| 1.6 | Video CRUD (create, edit, publish, delete) |
| 1.7 | Series CRUD + episode ordering |
| 1.8 | Categories CRUD |
| 1.9 | FFmpeg transcoder worker (BullMQ) |
| 1.10 | Public API: `GET /videos`, `GET /series`, `GET /categories` |
| 1.11 | Nginx + SSL for `admin.yourdomain.com` |

**Exit criteria:** App admin uploads MP4 → transcodes → `GET /api/v1/videos` returns it.

---

### Phase 2 — User Auth + Engagement

**Goal:** Users can register, login, track watch history on mobile and web.

| # | Task |
|---|------|
| 2.1 | `POST /auth/register`, `login`, `refresh`, `logout` |
| 2.2 | JWT with `app_id` in payload |
| 2.3 | `GET/POST /user/watch-history` |
| 2.4 | `GET/POST/DELETE /user/favorites` |
| 2.5 | `GET /user/continue-watching` |
| 2.6 | Home API: `GET /home` (banners + rows) |
| 2.7 | Admin: home layout editor (banners + rows) |
| 2.8 | Admin: view/disable end users |
| 2.9 | `@socalmedic/sdk` v1 published |

**Exit criteria:** Isolation tests pass. SDK works in a test script.

---

### Phase 3 — SoCalMedic Client (Mobile + Website)

**Goal:** App 1 live on Android, iOS, and web.

| # | Task |
|---|------|
| 3.1 | Create `socalmedic-client` monorepo |
| 3.2 | React Native CLI init — `android/` + `ios/` + `src/screens/` |
| 3.3 | Next.js web init — `apps/web/` |
| 3.4 | `packages/shared` — theme, constants, types |
| 3.5 | Integrate `@socalmedic/sdk` in mobile + web |
| 3.6 | Auth screens (login, register) — mobile + web |
| 3.7 | Home screen — mobile + web |
| 3.8 | Categories + series detail — mobile + web |
| 3.9 | Long video player (HLS) — mobile + web |
| 3.10 | Shorts vertical feed — mobile + web |
| 3.11 | Search — mobile + web |
| 3.12 | Profile + favorites + continue watching — mobile + web |
| 3.13 | Android release build (Play Store internal testing) |
| 3.14 | iOS Xcode archive (TestFlight) |
| 3.15 | Website deployed (Ubuntu or Cloudflare Pages) |

**Exit criteria:** App 1 on Play Store internal track + TestFlight + live website.

---

### Phase 4 — Onboard App 2 (Partner Developer)

**Goal:** Second app live without any backend code changes.

| # | Task |
|---|------|
| 4.1 | Publish OpenAPI spec + SDK docs |
| 4.2 | Create `storytv` app in admin |
| 4.3 | Issue API key + create app admin account for partner |
| 4.4 | Partner clones `socalmedic-client` → `storytv-client` |
| 4.5 | Partner rebrands + builds mobile + web |
| 4.6 | Run full isolation checklist |
| 4.7 | StoryTV live on app stores |

**Exit criteria:** App 2 content isolated. Partner manages their own content via admin.

---

### Phase 5 — Growth Features

| # | Task |
|---|------|
| 5.1 | Search (Typesense, index per `app_id`) |
| 5.2 | Push notifications (FCM per app) |
| 5.3 | Subscription plans per `app_id` |
| 5.4 | Apple IAP + Google Play webhooks |
| 5.5 | Premium content gating (`is_premium` flag) |
| 5.6 | Analytics dashboard per app in admin |
| 5.7 | Shorts recommendation algorithm v2 |
| 5.8 | Webhook events for client apps (`video.published`) |

---

## 24. Domain & URL Plan

| URL | Service | Phase |
|-----|---------|-------|
| `api.yourdomain.com` | Public + Admin API | Phase 0 |
| `admin.yourdomain.com` | Admin CMS UI | Phase 1 |
| `cdn.yourdomain.com` | Cloudflare R2 CDN | Phase 0 |
| `www.socalmedic.com` | App 1 website | Phase 3 |
| `socalmedic.com` | Redirect → www | Phase 3 |
| `api.sandbox.yourdomain.com` | Sandbox API (optional) | Phase 4 |

---

## 25. Cost Estimate

### Monthly running costs (starting)

| Service | Estimated cost |
|---------|---------------|
| Ubuntu VPS (Hetzner CX31 or DO 4vCPU/8GB) | $20 – $40 |
| Cloudflare R2 (100 GB storage + egress) | $5 – $20 |
| Domain name | ~$1 – $2 |
| Cloudflare CDN | Free (on R2) |
| **Total** | **~$30 – $65 / month** |

### One-time costs

| Item | Cost |
|------|------|
| Apple Developer Program | $99 / year |
| Google Play Developer | $25 one-time |
| Ubuntu server setup | Free (your time) |

### Scaling costs (when growing)

| Trigger | Action | Added cost |
|---------|--------|------------|
| Transcoding slow | Separate worker VPS | +$20 – $40/month |
| DB performance | Managed PostgreSQL (Neon/Supabase) | +$25/month |
| 1 TB+ video storage | R2 storage scales | ~$15/TB/month |
| High traffic CDN | Cloudflare R2 egress | $0.36/GB |

---

## 26. Pre-Build Decisions (Confirm Before Start)

These are the last open questions. Recommended defaults are shown in **bold**.

| # | Question | Options | Recommended |
|---|----------|---------|-------------|
| 1 | Website hosting | A) Same Ubuntu server B) Cloudflare Pages C) Vercel | **A — Same Ubuntu** (simplest) |
| 2 | Transcoder location | A) Same Ubuntu VPS B) Separate worker VPS | **A — Same server** to start |
| 3 | First app content focus | A) Short dramas only B) Long + short together | **A — Short dramas** (Kuku TV style) |
| 4 | Repo hosting | A) GitHub B) GitLab C) Self-hosted | **A — GitHub** |
| 5 | SDK distribution | A) Private npm B) Git submodule C) Monorepo workspace | **A — Private npm** |
| 6 | Sandbox environment | A) Yes (separate DB + API key) B) No (production only) | **A — Yes** for partner devs |
| 7 | Your platform domain | e.g. `socalmedic.com`, `yourplatform.com` | **You decide** |

---

## 27. Approval Checklist

Reply **"approved"** to start building. Confirm or override the recommended defaults in Section 26.

### Architecture
- [ ] One backend (`socalmedic-platform`) on Ubuntu server
- [ ] Many client apps via `app_id` + API key
- [ ] Separate users per app
- [ ] Option B admin (super admin + per-app admin)

### App 1 (SoCalMedic)
- [ ] React Native mobile — shared screens, `android/` + `ios/` separate
- [ ] Next.js website in same `socalmedic-client` repo
- [ ] Both use `@socalmedic/sdk`

### Infrastructure
- [ ] Ubuntu self-hosted (API + admin + worker)
- [ ] Cloudflare R2 + CDN for video
- [ ] PostgreSQL + Redis on Ubuntu

### Build order
- [ ] Phase 0 → 1 → 2 → 3 → 4 → 5 (in order, no skipping)

---

## 28. Glossary

| Term | Definition |
|------|------------|
| `app_id` | Unique slug identifying a client app (e.g. `socalmedic`). Present on every data row. |
| `super_admin` | Platform owner (you). Full access to all apps and platform settings. |
| `app_admin` | Admin user scoped to one `app_id`. Manages content and users for their app only. |
| `HLS` | HTTP Live Streaming — adaptive video format used for playback |
| `R2` | Cloudflare R2 — S3-compatible object storage for video files |
| `BullMQ` | Redis-based job queue used to process transcode jobs |
| `SDK` | `@socalmedic/sdk` — TypeScript client library for all app developers |
| `Presigned URL` | Temporary R2 upload URL that expires (used for admin video upload) |
| `JWT` | JSON Web Token — used for user and admin authentication |
| `RBAC` | Role-Based Access Control — super_admin vs app_admin permissions |
| `CDN` | Content Delivery Network — Cloudflare caches and serves video fast globally |
| `MVP` | Minimum Viable Product — Phase 0 through Phase 3 |

---

*End of Master Plan — Version 1.0*  
*No code will be written until this document is approved.*
