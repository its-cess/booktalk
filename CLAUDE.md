# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookTalk is a pnpm monorepo with two apps and one shared package:
- `apps/api` — Fastify 5 backend, PostgreSQL + Prisma ORM, JWT auth
- `apps/web` — React 19 + Vite + React Router 7 frontend, Tailwind CSS + shadcn/ui
- `packages/shared` — Zod schemas and TypeScript types shared between api and web

## Commands

All commands should be run from the relevant app directory unless noted.

### API (`apps/api`)
```bash
pnpm dev          # Start dev server with hot reload (tsx watch) on :3000
pnpm build        # Compile TypeScript to dist/ and copy generated Prisma client
pnpm start        # Run compiled output
```

### Web (`apps/web`)
```bash
pnpm dev          # Start Vite dev server on :5173
pnpm build        # Type-check + build production bundle
pnpm typecheck    # Run tsc --noEmit without building
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

## Local Development Database

The API requires a PostgreSQL database. For local dev, use Docker:

```bash
docker run --name booktalk-dev-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booktalk \
  -p 5432:5432 \
  -d postgres:16

# Stop/start later:
docker stop booktalk-dev-db
docker start booktalk-dev-db
```

Then set `DATABASE_URL` in `apps/api/.env` to `postgresql://postgres:postgres@localhost:5432/booktalk` and run `npx prisma migrate dev` from `apps/api`.

## Architecture

### Shared validation
`packages/shared` exports Zod schemas and inferred TypeScript types, organized per-file and re-exported from `src/index.ts`: `auth.ts`, `post.ts`, `user.ts`, `notification.ts`, `rating.ts`, `shelf.ts`, `top-books.ts`, `feedback.ts`, `push.ts`, `types.ts` (e.g. `createPostSchema`, `createCommentSchema`, `loginSchema`, `signupSchema`, `updateProfileSchema`, `pushSubscriptionSchema`, and types like `PostWithAuthor`, `CommentWithAuthor`, `UserProfile`, `BookResult`, `GroupedNotification`). This is the source of truth for data shapes — extend schemas here first, then use them in both apps.

`packages/shared/dist` is committed to git so Railway's build can resolve the package without relying on pnpm workspace symlinks.

### Authentication flow
1. User logs in via `POST /auth/login` → API returns JWT + user object
2. Web stores token in `localStorage` and sets it on the Axios instance via `setAuthToken()` in `apps/web/src/lib/api.ts`
3. Protected API routes use the `requireAuth` middleware (`apps/api/src/middleware/auth.ts`) which calls `request.jwtVerify()`
4. `AuthProvider` in `apps/web/src/lib/auth-context.tsx` holds auth state and exposes `useAuth()` hook

### API structure
- Entry point: `apps/api/src/index.ts` — registers plugins (CORS, JWT, rate limiting) and mounts route modules; listens on `0.0.0.0` using `process.env.PORT`
- Routes in `apps/api/src/routes/`: `auth.ts`, `posts.ts`, `books.ts`, `users.ts`, `comments.ts`, `notifications.ts`, `gifs.ts`, `shelves.ts`, `feedback.ts`, `push.ts`
- Prisma singleton: `apps/api/src/prisma.ts`
- Prisma CLI config: `apps/api/prisma.config.ts` — sets the datasource URL from `DATABASE_URL` env var (Prisma 7 requirement)
- Mention handling: `apps/api/src/lib/mentions.ts` — extracts `@username` mentions from post/comment content and creates notifications via `notifyMentions()` (also fires a push)
- Web Push: `apps/api/src/lib/push.ts` — `sendPushToUser()` / `pushActivity()` (see the Web Push note under API env vars)

Key API patterns:
- All routes validate input with Zod schemas from `@booktalk/shared`; errors return `{ errors: err.issues }` with 400
- Many endpoints support optional auth — unauthenticated requests get limited data (e.g., no `isLiked` field). Use `getOptionalUserId()` helper to extract userId when JWT may or may not be present
- Reusable Prisma select objects (`authorSelect`, `bookSelect`) defined per route file to keep field selections consistent
- `books.ts` fetches from the OpenLibrary API (`https://openlibrary.org/search.json`) and upserts results into the local DB (graceful degradation to cache if OpenLibrary is unreachable)
- `gifs.ts` proxies GIF search to the Giphy API (`GET /gifs/search?q=`); requires `GIPHY_API_KEY`

Notable endpoints not obvious from route file names:
- `GET /posts/trending` — scores posts by likes + comments×2
- `GET /posts/search?q=` — full-text post search
- `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password` — password reset flow (uses Resend for email, `PasswordResetToken` model)
- `GET /auth/me` — returns current authenticated user
- `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/:id/read` — notification system
- `POST /users/me/avatar-upload-url` — returns a presigned Cloudflare R2 URL for avatar upload
- `PUT /books/:id/rating`, `DELETE /books/:id/rating` — set/clear the current user's rating for a book (ratings live under `books.ts`, not a separate route file)
- `GET /users/:username/top-books`, `PUT /users/me/top-books` — a user's pinned "Top 8" books (replace-all)
- `GET /shelves/me`, `GET /shelves/:id`, `POST /shelves`, `PATCH /shelves/:id`, `DELETE /shelves/:id`, `POST /shelves/:id/items`, `DELETE /shelves/:id/items/:bookId` — custom + system book shelves
- `POST /feedback` — persists a `Feedback` row and emails `FEEDBACK_EMAIL` (falls back to `FROM_EMAIL`) via Resend; open to logged-out users, rate-limited
- `GET /push/vapid-public-key`, `POST /push/subscribe`, `POST /push/unsubscribe` — Web Push subscription management

### Data model highlights
Notable Prisma models beyond User/Post/Comment:
- **Book** — cached from OpenLibrary; identified by `openLibraryKey` (unique)
- **Post** — can reference a `Book` or store manual `bookTitle`/`bookAuthor`; has `hasSpoilers` and `commentsDisabled` flags
- **Follow** — self-referential many-to-many on User for social graph
- **PostLike** / **CommentLike** — unique on `[userId, postId]` / `[userId, commentId]`
- **PasswordResetToken** — used by the password reset flow
- **Notification** — `type` is one of `POST_LIKE`, `COMMENT`, `FOLLOW`, `MENTION_POST`, `MENTION_COMMENT` (note: comment-likes create **no** notification); grouped by `(type, postId)` when returned to the client (FOLLOWs grouped together)
- **BookRating** — one rating per user per book (half-stars 0–10, or DNF); drives own-ratings + a gated average
- **Shelf** / **ShelfItem** — custom + system ("Want to Read") book shelves; `ShelfItem` links a shelf to a book
- **ProfileTopBook** — a user's pinned "Top 8" books (`userId`, `bookId`, `position`, cap 8)
- **Feedback** — bug/feature/other submissions from the feedback dialog
- **PushSubscription** — one row per browser/device Web Push subscription (`endpoint` unique, `p256dh`/`auth` keys), cascade-deleted with the user

### Web structure
- Router defined in `apps/web/src/App.tsx` using React Router 7 with a shared `Layout` wrapper. `App` also wraps everything in `ThemeProvider` + `AuthProvider` and renders the global `<Toaster />` and `<PWAUpdatePrompt />`
- Routes: `/` (feed), `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/search`, `/posts/:id`, `/books/:id`, `/settings`, `/:username`, `/:username/followers`, `/:username/following`, `/:username/shelves/:shelfId`
- Pages are in `apps/web/src/pages/`
- UI primitives (Button, Input, Label, Switch) are shadcn/ui-style components in `apps/web/src/components/ui/`; toasts via Sonner
- Path alias `@/` resolves to `apps/web/src/`
- **No `ProtectedRoute` component** — auth-gating is done inline per page (a page reads `useAuth()` and redirects/renders a logged-out view itself, e.g. `Home`, `PostDetail`)

### Dark mode / theming
- `apps/web/src/lib/theme-context.tsx` — `ThemeProvider` + `useTheme()` (`theme: "light" | "dark"`, `toggleTheme`, `setTheme`); persists to `localStorage` key `theme` and respects `prefers-color-scheme`
- Colors are HSL CSS custom properties in `apps/web/src/index.css`; dark values live in a `.dark {}` block, activated via `@custom-variant dark (&:is(.dark *))` and a `.dark` class on `<html>`
- `index.html` runs a tiny inline script before paint to add `.dark` from stored/system preference (avoids a flash)
- Header toggle: `apps/web/src/components/ThemeToggle.tsx` (a `Switch` with a `SunMoon` icon); also a "Dark mode" toggle in Settings

### PWA (installable + update prompt + push)
- Configured via `vite-plugin-pwa` in `apps/web/vite.config.ts` using **`injectManifest`** with a custom service worker `apps/web/src/sw.ts` (precache + SPA navigation fallback + `push` / `notificationclick` handlers + `SKIP_WAITING`). The plugin is skipped under Vitest (`mode === "test"`) and `virtual:pwa-register/react` is aliased to a stub in tests
- `registerType: "prompt"` — `apps/web/src/components/PWAUpdatePrompt.tsx` uses `useRegisterSW` to show a Sonner "Refresh" toast when a new build is waiting (never auto-activates)
- Icons are generated by `apps/web/scripts/generate-pwa-icons.mjs` (`pnpm icons:generate`, needs the `sharp` devDependency) — an SVG open-book on a midnight gradient; mark-only for maskable/apple-touch/favicon, mark + "BookTalk" wordmark for the larger `any` install-prompt sizes
- Push: `apps/web/src/lib/push.ts` + `usePush` hook power a single master "Push notifications" toggle in Settings (browsers require explicit opt-in; the OS handles per-site muting). Notifications fire only for **new** activity to opted-in subscriptions — there is no backfill

### Feature flags
There is currently **no** `apps/web/src/lib/config.ts` / `SHOW_GIPHY` flag (removed). If a feature flag is needed, add it fresh.

### React Query (TanStack Query v5)
All server state goes through React Query. Queries and mutations are centralized in `apps/web/src/lib/queries.ts`. Key patterns:
- Query keys follow the shape `["posts", "feed"]`, `["users", username]`, `["comments", postId]`, `["notifications"]`, `["posts", "trending"]`
- Mutations invalidate related queries on success (e.g., creating a post invalidates `FEED_KEY`)
- Some queries set `staleTime` (books: 5 min, post search: 30 sec) or `refetchInterval` (notifications: 30 s)

### Tests (`apps/web/src/test/`)
Tests use Vitest with JSDOM + `@testing-library/react`. The setup file patches `ResizeObserver` for Radix UI compatibility. Coverage spans pages (`Login`, `Signup`, `Home`, `Profile`, `Settings`, `BookDetail`), components (`PostComposer`, `PostCard`, `CommentCard`, `MentionTextarea`, `NotificationDropdown`, `FollowList`, `Layout`, `ThemeToggle`, `PWAUpdatePrompt`), hooks/libs (`theme-context`, `use-push`, mutations), and query hooks. Currently ~270 tests. Note: the API has no automated tests yet (planned).

### Environment variables (API)
Stored in `apps/api/.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booktalk"
JWT_SECRET="supersecretkey123"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
APP_URL="http://localhost:5173"        # Used in password reset emails
GIPHY_API_KEY=""                       # Giphy API key for GIF search
RESEND_API_KEY=""                      # Resend API key for password reset + feedback emails
FROM_EMAIL=""                          # Sender address for Resend emails
FEEDBACK_EMAIL=""                      # Where feedback submissions are emailed (falls back to FROM_EMAIL); keep the owner's inbox here — never commit
R2_ACCOUNT_ID=""                       # Cloudflare R2 for avatar storage
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""                      # e.g. booktalk-prod
R2_PUBLIC_URL=""                       # e.g. https://assets.booktalksocial.com
VAPID_PUBLIC_KEY=""                    # Web Push VAPID keypair (generate: npx web-push generate-vapid-keys)
VAPID_PRIVATE_KEY=""                   # secret — never commit
VAPID_SUBJECT=""                       # mailto: contact for push, e.g. mailto:notifications@booktalksocial.com
```

Web Push (PWA push notifications) is optional: if `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` are unset, `sendPushToUser`/`pushActivity` in `apps/api/src/lib/push.ts` become no-ops so the app runs fine without them. Push is wired into every notification creation point (likes, comments, follows, mentions); the web client subscribes via a Settings toggle and the custom service worker (`apps/web/src/sw.ts`, built with vite-plugin-pwa `injectManifest`) shows the notification.

### Environment variables (Web)
Stored in `apps/web/.env`:
```
VITE_API_URL=http://localhost:3000
```

## Production Deployment

- **API**: Railway — build command: `pnpm install && pnpm --filter @booktalk/shared build && cd apps/api && npx prisma generate && cd ../.. && pnpm --filter @booktalk/api build`; start command: `node apps/api/dist/index.js`
- **Web**: Cloudflare Pages — build command: `pnpm --filter @booktalk/shared build && pnpm --filter web build`; output directory: `apps/web/dist`
- **Database**: Supabase PostgreSQL (session pooler URL)
- **Storage**: Cloudflare R2 bucket (`booktalk-prod`) with custom domain `assets.booktalksocial.com`
- **Email**: Resend (domain verified on `booktalksocial.com`)

## CI
GitHub Actions (`.github/workflows/ci.yml`) runs on PRs to `main` with Node 20 + pnpm 10: builds shared, lints web, runs the **full web build** (`pnpm --filter web build`, i.e. `tsc -b && vite build`), and runs web tests. The full build (not just `tsc --noEmit`) is intentional — Cloudflare's build type-checks test files with `noUnusedLocals`, which a bare `tsc --noEmit` misses, so running the real build in CI catches that class of error before deploy.

## Local dev note
The build tooling requires **Node 20+**. If your shell defaults to an older Node, switch first (e.g. `nvm use 20`) before running `pnpm build`/`pnpm test`.
