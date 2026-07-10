#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Pull latest"
git pull origin main

echo "==> Install dependencies"
npm install

echo "==> Generate Prisma client"
npm run db:generate

echo "==> Build apps"
npm run build

echo "==> Run migrations"
npm run db:migrate

echo "==> Restart PM2"
pm2 restart deploy/pm2/ecosystem.config.js || pm2 start deploy/pm2/ecosystem.config.js

echo "==> Deploy complete"
