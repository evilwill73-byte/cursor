# Social Media Video Platform

Multi-app video streaming platform (Kuku TV / Story TV style).

**Local path (Windows):** `D:\social-media`  
**Clone this repo into that folder to match your setup.**

## What's built (this commit)

| Phase | Status | Items |
|-------|--------|-------|
| **Phase 0** | ✅ Started | Monorepo, Prisma schema, health API, app middleware, deploy configs |
| **Phase 1** | 🟡 Partial | Admin API auth, video CRUD, upload-url, publish job, transcoder stub |
| **Phase 2** | 🟡 Partial | User register/login, watch history, favorites, home API |
| **Phase 3** | ❌ Not started | React Native mobile + Next.js website (`socalmedic-client`) |
| **Phase 4+** | ❌ Not started | Partner onboarding, search, payments |

Full plan: [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md)

## Project structure

```
D:\social-media\                 (this repo)
├── apps/
│   ├── api/                     # Next.js public + admin API
│   └── admin/                   # Admin CMS UI (stub)
├── packages/
│   ├── database/                # Prisma + PostgreSQL
│   ├── types/
│   └── sdk/                     # Client SDK for mobile/web
├── workers/transcoder/          # FFmpeg worker (stub)
├── deploy/                      # Docker, Nginx, PM2, deploy script
└── docs/MASTER_PLAN.md
```

## Quick start (development)

### 1. Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis) **or** local PostgreSQL/Redis on Ubuntu

### 2. Install

```bash
cd D:\social-media
copy .env.example .env
npm install
```

### 3. Start database (Docker)

```bash
docker compose -f deploy/docker-compose.yml up -d
```

### 4. Database setup

```bash
npm run db:push
npm run db:seed
```

Save the **API key** printed by seed (shown once).

### 5. Run API

```bash
npm run dev
```

Open: http://localhost:3000/api/health

### 6. Test with headers

```bash
curl http://localhost:3000/api/v1/app/config ^
  -H "X-App-Id: socalmedic" ^
  -H "X-Api-Key: YOUR_API_KEY_FROM_SEED"
```

## Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Super admin | admin@platform.local | Admin123! |
| App admin (SoCalMedic) | admin@socalmedic.local | AppAdmin123! |

## Ubuntu production

See `deploy/` folder:

- `deploy/docker-compose.yml` — PostgreSQL + Redis
- `deploy/nginx/` — reverse proxy configs
- `deploy/pm2/ecosystem.config.js` — process manager
- `deploy/scripts/deploy.sh` — deploy script

## Remaining work

1. **Phase 1 finish:** Admin CMS UI screens, FFmpeg transcoding in worker, series/categories admin
2. **Phase 3:** Create `socalmedic-client` repo — React Native (`android/` + `ios/`) + Next.js web
3. **Phase 5:** Search, push notifications, subscriptions

## API base URL

- Dev: `http://localhost:3000`
- Prod: `https://api.yourdomain.com`

Required headers on all public routes:

```
X-App-Id: socalmedic
X-Api-Key: sk_live_...
```
