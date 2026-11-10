# DROP

Free static site hosting — publish HTML, CSS and JS projects at `drop.micropue.com.cn/{username}/{project}`.

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PrimeVue](https://img.shields.io/badge/PrimeVue-4-10B981)
![Sass](https://img.shields.io/badge/Sass-SCSS-CC6699?logo=sass&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-8-DC382D?logo=redis&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)

## About

DROP is a companion service to [BITS](https://bits.micropue.com.cn). It hosts static websites for free:

- Sign in with **BITS OAuth** — account details come from BITS and cannot be edited here.
- A project contains multiple HTML / CSS / JS files.
- Everything is stored in the **database**; files are never written to disk.
- A published project lives at `drop.micropue.com.cn/{username}/{custom-project-name}`.

## Status

This repository is currently a **scaffold**: Nuxt app, PrimeVue theme, MySQL + Redis via Docker Compose.
OAuth, projects, file storage and publishing are not implemented yet.

## Tech Stack

- **Framework**: Nuxt 4 + Vue 3 + TypeScript
- **UI**: PrimeVue 4 with the same black/white preset and SCSS as BITS
- **Database**: MySQL 8.4 (`mysql2`)
- **Cache**: Redis 8 (`ioredis`)
- **Local services**: Docker Compose

## Requirements

- Node.js 22.19+ (Nuxt 4.5 requirement; developed on 22)
- Docker (for MySQL and Redis)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start MySQL + Redis
docker compose up -d

# 4. Start the dev server (http://localhost:3501)
npm run dev
```

Check that the app can reach both services:

```bash
curl http://localhost:3501/api/health
# {"status":"ok","mysql":"ok","redis":"ok"}
```

## Ports

| Service | Port |
| --- | --- |
| Web (dev) | 3501 |
| MySQL | 3312 |
| Redis | 6480 |

These differ from BITS (3500 / 3311 / 6479) so both projects can run side by side.

## Environment Variables

All dynamic configuration lives in `.env` (see `.env.example`):

| Group | Variables |
| --- | --- |
| MySQL | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` |
| Redis | `REDIS_HOST`, `REDIS_PORT` |
| Site | `NUXT_PUBLIC_SITE_URL` |

Secrets must never be committed to the repository.

## Build & Deployment

```bash
# Production build (outputs to .output/)
npm run build

# Run the production server
node .output/server/index.mjs

# Or preview the build locally
npm run preview
```

The Nitro server reads the same `.env` variables. To run MySQL/Redis in containers alongside the app, point `MYSQL_HOST` / `REDIS_HOST` at the compose service names (`mysql` / `redis`) instead of `127.0.0.1`.

## Project Structure

```
app/
  assets/css/    main.scss (BITS theme tokens, fonts, base styles)
  components/    BrandLogo.vue
  layouts/       default.vue (header + footer)
  pages/         index.vue, sign.vue
server/
  api/           health.get.ts
  utils/         db.ts, redis.ts
docker-compose.yml
nuxt.config.ts
.env.example
```

## License

[Apache License 2.0](./LICENCE)
