# BookTalk

A full-stack social platform for readers to share thoughts, reviews, and recommendations around books. Built as a production-deployed portfolio project to demonstrate end-to-end product thinking — from UX decisions and component design to API architecture, security, and cloud infrastructure.

**Live site: [booktalksocial.com](https://booktalksocial.com)**

---

## Features

- **Social feed** — follow other readers, like and comment on posts, see a personalized feed from people you follow
- **Book search** — search books via the OpenLibrary API; results are cached locally for performance and offline resilience
- **Post composer** — create posts with optional book tagging, spoiler warnings, and comment controls
- **@mention system** — mention other users in posts and comments; mentioned users receive in-app notifications
- **Notification center** — real-time-style notification dropdown with unread counts, grouped by type
- **User profiles** — editable display name, bio, and avatar; followers/following lists
- **Avatar uploads** — direct-to-cloud uploads via presigned URLs (no file data passes through the API server)
- **Password reset flow** — full forgot/reset flow with time-limited tokens delivered via transactional email
- **Responsive design** — mobile-friendly layout throughout

---

## Tech Stack

### Frontend
- React 19, TypeScript
- React Router 7
- TanStack Query v5 (server state, caching, optimistic updates)
- Tailwind CSS + shadcn/ui component library
- Axios
- Vite

### Backend
- Fastify 5 (Node.js)
- TypeScript
- Prisma ORM 7 (PostgreSQL)
- JWT authentication (`@fastify/jwt`)
- Zod for request validation
- Resend for transactional email

### Infrastructure
- **Database**: Supabase (PostgreSQL, session pooler)
- **API hosting**: Railway
- **Frontend hosting**: Cloudflare Pages
- **Asset storage**: Cloudflare R2 (avatar images, served via custom domain)
- **Domain & DNS**: Cloudflare

### Monorepo
- pnpm workspaces
- Shared `@booktalk/shared` package — Zod schemas and TypeScript types consumed by both the API and web app, keeping validation logic in one place

---

## Security

- JWT-based auth with configurable expiry
- Bcrypt password hashing
- Rate limiting on all auth endpoints (login, signup, password reset) via `@fastify/rate-limit`
- Presigned R2 URLs for avatar uploads — the API never handles file data directly
- Time-limited, single-use password reset tokens
- CORS locked to the production domain

---

## Testing & Quality

- Unit tests with Vitest + React Testing Library, covering pages, components, and query/mutation hooks
- TypeScript strict mode across the entire codebase
- ESLint on the frontend
- GitHub Actions CI runs linting, typechecking, and the full test suite on every PR

---

## Architecture Highlights

The monorepo is structured so that validation schemas defined in `packages/shared` are the single source of truth for data shapes — the same Zod schemas validate API request bodies and type frontend form data. This eliminates a whole class of frontend/backend contract bugs.

The API uses optional auth on many endpoints — unauthenticated users can browse posts and profiles, but authenticated users get enriched responses (e.g. whether they've already liked a post). This pattern keeps endpoints from being duplicated while supporting a good public browsing experience.

Avatar uploads use a presigned URL flow: the API generates a short-lived Cloudflare R2 URL and returns it to the client, which uploads directly to R2. This keeps binary file data off the API server entirely.
