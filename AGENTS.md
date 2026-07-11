# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **SoCalMedic** multi-app video platform: a Turborepo/npm-workspaces monorepo.
The runnable product is the **API** (`apps/api`, Next.js 15, port 3000); `apps/admin` (port 3001)
is a placeholder UI, `workers/transcoder` is a DB-polling stub. Standard scripts live in the root
`package.json` (`dev`, `dev:admin`, `build`, `db:generate|push|seed|studio`) and the README covers
the general dev flow. Notes below are the non-obvious gotchas discovered during setup.

### Environment variables are NOT auto-loaded from the root `.env`
Nothing in the code uses `dotenv`. Next.js and Prisma only auto-load `.env` from their own
directories (`apps/api`, `packages/database`), not the repo root. Before running **any** DB command,
the API, or the worker, export the root env into the shell first:

```bash
cp .env.example .env   # only if .env is missing
set -a && . ./.env && set +a
```

Child processes (`npm run dev`, `prisma`, `tsx`) then inherit `DATABASE_URL`, JWT secrets, etc.
Without this, `prisma db push` fails with `Environment variable not found: DATABASE_URL`.

### PostgreSQL must be started manually
Postgres 16 is installed but there is no systemd/auto-start in this VM. Start it each session:

```bash
sudo pg_ctlcluster 16 main start   # serves localhost:5432
```

The `socalmedic` role/db and password auth match the default `DATABASE_URL`
(`postgresql://socalmedic:socalmedic@localhost:5432/socalmedic`). Docker is NOT installed, so
`deploy/docker-compose.yml` is not used here — use the local cluster instead. If the DB is empty,
run `npm run db:push` then `npm run db:seed` (seed prints an API key once — grab it).

### `next build` breaks with `NODE_ENV=development`
The root `.env` sets `NODE_ENV=development`. If you `source .env` and then run `npm run build`,
the API build fails while prerendering the error page (`<Html> should not be imported...`). Build
with production env instead, e.g. `cd apps/api && NODE_ENV=production npx next build`. Development
(`npm run dev`) is unaffected — the env-source step above is correct for dev/DB commands.

### Lint and the transcoder build are not configured
`npm run lint` (`next lint`) is interactive because the repo has no ESLint config/dependency, so it
cannot run non-interactively. `workers/transcoder` has a `tsc` build script but no `tsconfig.json`,
so the root `npm run build` fails on that stub; build `apps/api` / `apps/admin` individually instead.
The worker runs fine in dev via `tsx` (`npm run dev` inside `workers/transcoder`).

### Public API auth
All `/api/v1/*` routes require `X-App-Id: socalmedic` and `X-Api-Key: <seed key>` headers.
Health check `GET /api/health` needs no headers. Seed admin logins are in the README.
