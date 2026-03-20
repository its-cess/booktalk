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
pnpm test         # Run Vitest tests
pnpm test -- --run src/test/Foo.test.tsx  # Run a single test file
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
`packages/shared` exports Zod schemas (`createPostSchema`, `updatePostSchema`, `createCommentSchema`, `loginSchema`, `signupSchema`, `updateProfileSchema`) and inferred TypeScript types (`PostWithAuthor`, `CommentWithAuthor`, `UserProfile`, `BookResult`, etc.). This is the source of truth for data shapes — extend schemas here first, then use them in both apps.

### Authentication flow
1. User logs in via `POST /auth/login` → API returns JWT + user object
2. Web stores token in `localStorage` and sets it on the Axios instance via `setAuthToken()` in `apps/web/src/lib/api.ts`
3. Protected API routes use the `requireAuth` middleware (`apps/api/src/middleware/auth.ts`) which calls `request.jwtVerify()`
4. `AuthProvider` in `apps/web/src/lib/auth-context.tsx` holds auth state and exposes `useAuth()` hook

### API structure
- Entry point: `apps/api/src/index.ts` — registers plugins (CORS, JWT) and mounts route modules
- Routes in `apps/api/src/routes/`: `auth.ts`, `posts.ts`, `books.ts`, `users.ts`, `comments.ts`
- Prisma singleton: `apps/api/src/prisma.ts`

Key API patterns:
- All routes validate input with Zod schemas from `@booktalk/shared`; errors return `{ errors: err.issues }` with 400
- Many endpoints support optional auth — unauthenticated requests get limited data (e.g., no `isLiked` field). Use `getOptionalUserId()` helper to extract userId when JWT may or may not be present
- Reusable Prisma select objects (`authorSelect`, `bookSelect`) defined per route file to keep field selections consistent
- `books.ts` fetches from the OpenLibrary API (`https://openlibrary.org/search.json`) and upserts results into the local DB (graceful degradation to cache if OpenLibrary is unreachable)

### Data model highlights
Notable Prisma models beyond User/Post/Comment:
- **Book** — cached from OpenLibrary; identified by `openLibraryKey` (unique)
- **Post** — can reference a `Book` or store manual `bookTitle`/`bookAuthor`; has `hasSpoilers` and `commentsDisabled` flags
- **Follow** — self-referential many-to-many on User for social graph
- **PostLike** / **CommentLike** — unique on `[userId, postId]` / `[userId, commentId]`
- **PasswordResetToken** — model exists but not yet wired to any route

### Web structure
- Router defined in `apps/web/src/App.tsx` using React Router 7 with a shared `Layout` wrapper
- Routes: `/` (feed), `/login`, `/signup`, `/search`, `/posts/:id`, `/:username`, `/:username/followers`, `/:username/following`
- Pages are in `apps/web/src/pages/`
- UI primitives (Button, Input, Label) are shadcn/ui components in `apps/web/src/components/ui/`; toasts via Sonner
- Path alias `@/` resolves to `apps/web/src/`
- `ProtectedRoute` component wraps auth-gated routes

### React Query (TanStack Query v5)
All server state goes through React Query. Queries and mutations are centralized in `apps/web/src/lib/queries.ts`. Key patterns:
- Query keys follow the shape `["posts", "feed"]`, `["users", username]`, `["comments", postId]`
- Mutations invalidate related queries on success (e.g., creating a post invalidates `FEED_KEY`)
- Some queries set `staleTime` (books: 5 min, post search: 30 sec)

### Environment variables (API)
Stored in `apps/api/.env`:
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="supersecretkey123"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173"
```

## CI
GitHub Actions (`.github/workflows/ci.yml`) runs on PRs to `main` with Node 20 + pnpm 10: builds shared, lints web, typechecks web, and runs web tests.
