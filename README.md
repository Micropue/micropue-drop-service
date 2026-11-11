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
- A published project lives at `dropcontent.micropue.com.cn/{username}/{custom-project-name}`.

## Status

Nuxt app, PrimeVue theme, MySQL + Redis via Docker Compose, **BITS OAuth login**, the **project creator** and **project hosting** are implemented.
Projects are served straight from MySQL on a separate content domain (`dropcontent.micropue.com.cn/{username}/{slug}/`); the main site never serves project files.

## Tech Stack

- **Framework**: Nuxt 4 + Vue 3 + TypeScript
- **UI**: PrimeVue 4 with the same black/white preset and SCSS as BITS
- **Editor**: CodeMirror 6 (HTML / CSS / JavaScript)
- **Explorer**: he-tree (`@he-tree/vue`) with a custom UI
- **Auth**: BITS OAuth 2.0 (authorization code), `jose` session JWT
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

# 4. Start the dev server (http://localhost:3678)
npm run dev
```

Check that the app can reach both services:

```bash
curl http://localhost:3678/api/health
# {"status":"ok","mysql":"ok","redis":"ok"}
```

## Ports

| Service | Port |
| --- | --- |
| Web (dev) | 3678 |
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
| Content domain | `NUXT_CONTENT_HOST`, `NUXT_PUBLIC_CONTENT_URL` |
| BITS OAuth | `BITS_OAUTH_ORIGIN`, `BITS_OAUTH_CLIENT_ID`, `BITS_OAUTH_CLIENT_SECRET`, `BITS_OAUTH_REDIRECT_URI` |
| Session | `AUTH_SECRET`, `AUTH_COOKIE_DOMAIN` |
| Deployment test App | `BITS_STAGING_CLIENT_ID`, `BITS_STAGING_CLIENT_SECRET`, `BITS_STAGING_REDIRECT_URI` |

Secrets must never be committed to the repository.

## Authentication

DROP has no password login. The only way in is BITS OAuth:

1. `/api/auth/bits` redirects to BITS with a signed `state` cookie.
2. BITS returns to `/api/auth/bits/callback`; the code is exchanged server-side.
3. `userinfo` is written to the local `accounts` table, keyed by `bits_id` (`userinfo.sub`).
4. A 7-day HttpOnly session cookie (`drop_session`, JWT) is issued.

The `accounts` table stores only the BITS projection: email, username, nickname, avatar, profile URL and login times.
Username, password and profile cannot be changed in DROP; edit them on BITS and the next login syncs them.

Registered OAuth apps:

| App | Use | Redirect URI |
| --- | --- | --- |
| MICROPUE Drop Dev | local | `http://localhost:3678/api/auth/bits/callback` |
| MICROPUE Drop Staging | deployment test | `https://drop.micropue.com.cn/api/auth/bits/callback` |
| MICROPUE Drop | production | — |

The local development app is active in `.env`. To test the deployment app, copy the `BITS_STAGING_*` values into the `BITS_OAUTH_*` variables on the server.

## Projects

The creator at `/new` matches the site navigation width (`max-width: 1300px`): the file explorer is on the left and CodeMirror 6 is on the right.

- Only `.html`, `.css` and `.js` files; at most 20 files, 512 KB each and 1 MB total per project.
- **Max 100 projects per BITS account.**
- Files can live in folders; empty folders are stored in the project's `folders` JSON column.
- Everything is stored in MySQL (`projects`, `project_files`). Nothing is written to disk.
- Visibility: `public` or `password` (scrypt hash; the plain password is never stored).
- One item is selected at a time, like VS Code. Selecting a folder highlights it but keeps the last file open in the editor.
- New file/folder is created inline in the tree: inside the selected folder, or beside the selected file.
- Drag files and folders in the explorer to move/reorder them; files cannot contain other files. Paths are rewritten and saved. `Alt+Arrow` keys also reorder.
- `Save` opens the project settings dialog the first time, then saves directly on later clicks. The settings icon next to Save reopens the dialog at any time.
- `Share` opens a QR code and the project link.
- The dashboard lists your projects 20 per page with search (name or URL), sorting (last updated / newest / name), a visibility icon, an on/off switch, `Edit` and `Delete`.
  - The switch controls whether the site is served at all — it is not visibility. Visibility (`public` / `password`) is still changed in the editor settings.
  - `Edit` reopens the project in the creator (`/new?edit=<sid>`); `Delete` asks for confirmation and removes the project with its files.
- On screens ≤900px the explorer becomes a drawer.
- The explorer uses [he-tree](https://hetree.phphe.com/) (`@he-tree/vue`) with a custom Vue UI; file/folder icons come from [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) (MIT).

## Hosting

Projects are served by Nitro straight from MySQL — nothing is written to disk — and only on the content domain.

- URL: `https://dropcontent.micropue.com.cn/{username}/{slug}/`. The same path on `drop.micropue.com.cn` returns 404, so user JavaScript never runs on the app origin.
- The content root (`https://dropcontent.micropue.com.cn/`) is a blank page that only points back to the main site; app pages and APIs are never served there.
- The URL without the trailing slash is redirected (308) so relative `assets/...` links keep working.
- `/` returns `index.html`; any other request is an exact file lookup (`/pages/about.html`, `/assets/style.css`), so traversal paths simply 404.
- Content types: `.html` → `text/html`, `.css` → `text/css`, `.js` → `text/javascript`. Unknown extensions are not servable.
- Visibility is enforced on every request: `password` shows a password form and stores a signed `drop_unlock_*` cookie for 12h. The owner bypasses it.
- The dashboard switch (`enabled`) disables the site entirely: every request returns 404 while off.
- On the content domain, app pages and `/api/*` are 404; only project files and `/api/unlock/*` are reachable.
- Password attempts are limited to 10 per 10 minutes per project + IP in Redis.
- Password pages are `no-store` and `X-Robots-Tag: noindex`; `sitemap.xml` lists only public, enabled projects on the content domain.
- The dashboard path text links to the live site and is not a link when the project is disabled.

Set the content host in `.env`:

```bash
NUXT_CONTENT_HOST=dropcontent.micropue.com.cn
NUXT_PUBLIC_CONTENT_URL=https://dropcontent.micropue.com.cn
# 生产让内容域也能识别所有者（HttpOnly，仅服务端可读）
AUTH_COOKIE_DOMAIN=.micropue.com.cn
```

Local development: use `dropcontent.localhost` (Chrome/Safari resolve `*.localhost` to loopback, no hosts file needed):

```bash
NUXT_CONTENT_HOST=dropcontent.localhost
NUXT_PUBLIC_CONTENT_URL=http://dropcontent.localhost:3678
AUTH_COOKIE_DOMAIN=
```

Then visit `http://dropcontent.localhost:3678/micropue/personal-site/`. With `AUTH_COOKIE_DOMAIN` empty the owner session stays on the main host, so owner bypass on password projects only works on the content domain in production.

### Reverse proxy

Both hostnames point at the same Nuxt process; routing is done by the `Host` header, so do **not** add a `/content` prefix or rewrite the path.

```nginx
# /etc/nginx/conf.d/drop.conf
upstream drop_app {
    server 127.0.0.1:3000;
    keepalive 16;
}

server {
    listen 443 ssl;
    http2 on;
    # 证书必须同时包含两个域名（SAN）
    server_name drop.micropue.com.cn dropcontent.micropue.com.cn;

    ssl_certificate     /etc/letsencrypt/live/drop.micropue.com.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drop.micropue.com.cn/privkey.pem;

    location / {
        proxy_pass http://drop_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;                 # 关键：内容域靠它区分
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name drop.micropue.com.cn dropcontent.micropue.com.cn;
    return 301 https://$host$request_uri;
}
```

Caddy equivalent:

```caddy
drop.micropue.com.cn, dropcontent.micropue.com.cn {
    reverse_proxy 127.0.0.1:3000
}
```

`proxy_set_header Host $host` (Caddy does this automatically) is what keeps `/{username}/{slug}` working on both domains without a path prefix.

Seed demo projects for a local account (reruns replace the same slugs):

```bash
node --env-file-if-exists=.env scripts/seed-demo.mjs micropue
```

## Build & Deployment

Production is deployed by `.github/workflows/build-upload.yml` on every push to `main`: it builds the app and uploads `.output/*` to `/sdb/drop.micropue.com.cn` on the server.

```bash
# Production build (outputs to .output/)
npm run build

# Run the production server (loads .env; the built output alone does not)
npm run start

# Or preview the build locally
npm run preview
```

`npm run start` loads `.env` and optional `.env.production`. To run MySQL/Redis in containers alongside the app, point `MYSQL_HOST` / `REDIS_HOST` at the compose service names (`mysql` / `redis`) instead of `127.0.0.1`.

## Project Structure

```
app/
  assets/css/    main.scss (BITS theme tokens, fonts, base styles)
  components/    BrandLogo.vue, TechText.vue, DotField.vue, UserAvatar.vue, CodeEditor.client.vue, FileTypeIcon.vue
  composables/   useAuthUser.ts
  layouts/       default.vue (header)
  pages/         index.vue, account.vue, dashboard.vue, new.vue, sign.vue
public/          favicon.ico, robots.txt, file-icons/ (Material Icon Theme, MIT)
server/
  api/auth/      bits.get.ts, bits/callback.get.ts, me.get.ts, logout.post.ts
  api/projects/  index.get.ts, index.post.ts, [sid].get.ts, [sid].put.ts, [sid].patch.ts, [sid].delete.ts
  api/unlock/    [sid].post.ts (password unlock)
  api/           health.get.ts, github/star.get.ts
  plugins/       db-init.ts (accounts / projects / project_files tables)
  middleware/    content.ts (content-domain routing)
  routes/        sitemap.xml.ts
  utils/         auth.ts, db.ts, projects.ts, site.ts, redis.ts
docker-compose.yml
nuxt.config.ts
.env.example
.github/workflows/  build-upload.yml (build + scp to /sdb/drop.micropue.com.cn)
scripts/            seed-demo.mjs
```

## License

[Apache License 2.0](./LICENCE)
