# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookTalk is a pnpm monorepo with two apps and one shared package:
- `apps/api` — Fastify 5 backend, SQLite + Prisma ORM, JWT auth
- `apps/web` — React 19 + Vite + React Router 7 frontend, Tailwind CSS + shadcn/ui
- `packages/shared` — Zod schemas and TypeScript types shared between api and web

## Commands

All commands should be run from the relevant app directory unless noted.

### API (`apps/api`)
```bash
pnpm dev          # Start dev server with hot reload (tsx watch) on :3000
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled output
```

### Web (`apps/web`)
```bash
pnpm dev          # Start Vite dev server on :5173
pnpm build        # Type-check + build production bundle
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

### Shared (`packages/shared`)
```bash
pnpm build        # Compile TypeScript to dist/
pnpm clean        # Remove dist/
```

### Database
```bash
# From apps/api
npx prisma migrate dev    # Apply migrations and regenerate client
npx prisma studio         # Open Prisma Studio GUI
npx prisma generate       # Regenerate client after schema changes
```

### Running the full stack
```bash
pnpm install              # From repo root — installs all workspaces

# Then in separate terminals:
cd apps/api && pnpm dev   # API on :3000
cd apps/web && pnpm dev   # Web on :5173
```

## Architecture

### Shared validation
`packages/shared` exports Zod schemas used by both the API (request validation) and web (form validation). This is the source of truth for data shapes — extend schemas here first, then use them in both apps.

### Authentication flow
1. User logs in via `POST /auth/login` → API returns JWT + user object
2. Web stores token in `localStorage` and sets it on the Axios instance via `setAuthToken()` in `apps/web/src/lib/api.ts`
3. Protected API routes use the `requireAuth` middleware (`apps/api/src/middleware/auth.ts`) which calls `request.jwtVerify()`
4. `AuthProvider` in `apps/web/src/lib/auth-context.tsx` holds auth state and exposes `useAuth()` hook

### API structure
- Entry point: `apps/api/src/index.ts` — registers plugins (CORS, JWT) and mounts route modules
- Routes live in `apps/api/src/routes/` — currently only `auth.ts`
- Prisma singleton: `apps/api/src/prisma.ts`

### Web structure
- Router defined in `apps/web/src/App.tsx` using React Router 7 with a shared `Layout` wrapper
- Pages are in `apps/web/src/pages/`
- UI primitives (Button, Input, Label) are shadcn/ui components in `apps/web/src/components/ui/`
- Path alias `@/` resolves to `apps/web/src/`

### Environment variables (API)
Stored in `apps/api/.env`:
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="supersecretkey123"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173"
```
