# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript 5** (strict)
- **Bun** for package management and dev scripts — always use `bun`, never npm/yarn/pnpm
- **Biome** for linting and formatting (no ESLint, no Prettier) — lineWidth 320, indent 4 spaces
- **Tailwind CSS v4** + `@tailwindcss/postcss` (no `tailwind.config.ts`)
- **shadcn/ui** — `base-nova` style, `mauve` base color, **hugeicons** icon library (`@hugeicons/core-free-icons`)
- **Supabase** for auth and data (no ORM — raw `supabase-js` queries)
- **React Compiler** enabled (`reactCompiler: true` + `babel-plugin-react-compiler` dev dep)

## Commands

| Task | Command |
|------|---------|
| Dev server | `bun dev` |
| Lint | `bun run lint` (Biome check) |
| Format | `bun run format` (Biome --write) |
| Build | `bun run build` |

No test runner is configured. There is no `test` script.

## Env variables (`src/env.ts`)

All env access goes through `@t3-oss/env-nextjs` validation in `src/env.ts`. Validated vars:

| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only |

When adding env vars, update both the zod schema in `src/env.ts` and the `experimental__runtimeEnv` mapping.

## Middleware / Auth (Next.js 16 proxy pattern)

Auth uses Next.js 16's `proxy.ts` convention — **not** `middleware.ts`:

- `src/proxy.ts` — exports `proxy` function + `config.matcher`, delegates to `@/lib/supabase/proxy`
- `@/lib/supabase/proxy.ts` — `updateSession()` calls `supabase.auth.getUser()`, redirects unauthenticated `/dashboard/*` requests to `/login?next=<path>`
- The proxy matcher catches **all** requests except static files (`_next/static`, `_next/image`, `favicon.ico`, image files)

## Supabase clients — which one to use

| File | Export | Use case |
|------|--------|----------|
| `src/lib/supabase/client.ts` | `createClient()` | Client components (`"use client"`) — uses publishable key |
| `src/lib/supabase/server.ts` | `createClient()` | Server components / RSCs — uses publishable key + cookie handling |
| `src/lib/supabase/proxy.ts` | `updateSession()` | **Only in the proxy** — auth check |
| `src/lib/supabase/service.ts` | `createServiceClient()` | Admin operations (create/delete users) — uses `SUPABASE_SERVICE_ROLE_KEY`, marked `"server-only"` |

## Database

No Prisma, no Drizzle. All queries are raw `supabase.from("table").select(...)`.

**Tables:** `events`, `event_phases`, `profiles`
- `events`: `id`, `name`, `status` (planned/active/archived), `created_at`
- `event_phases`: `id`, `event_id`, `phase` (not_started/intake/selling/payout/finished), `starts_at`, `ends_at`
- `profiles`: `id`, `first_name`, `last_name`, `email`, `role` (admin/super_admin)

**Stored procedure:** `create_event(p_name)` — use via `supabase.rpc("create_event", { p_name })` to create an event with default phases.

## Event model & dashboard guard

Every dashboard page is wrapped in `<EventGuard>` (`src/app/dashboard/event-guard.tsx`). This client component:

1. Initializes `useEventStore` (Zustand — fetches events + phases from Supabase)
2. Initializes `useUserStore` (Zustand — fetches current user + profile)
3. Shows a loading state, "no events" prompt (super admins can create), or "select event" prompt
4. Only renders children once `selectedEventId` is set

The selected event ID is persisted to localStorage and synced to an `x-event-id` cookie (via `src/lib/event-cookie.ts`). Always use `useEventStore()` / `useSelectedEvent()` to read the current event — never hardcode or query independently.

Event types and labels are in `src/lib/event-utils.ts`.

## Conventions

- **Language:** All user-facing strings are in Polish (forms, labels, errors, navigation). Code is in English.
- **Client/server boundaries:** `"use client"` on every client component file. Server components are async functions without the directive. Server actions get `"use server"`.
- **Imports:** Use `@/` path alias (maps to `src/`). No barrel exports — import directly from the file.
- **Styling:** Use `cn()` from `@/lib/utils` for class merging, Tailwind utility classes, shadcn CSS variables.
- **Fonts:** Outfit (`--font-sans`, `--font-heading`) + JetBrains Mono (`--font-mono`)
- **Theming:** `next-themes` via `<ThemeProvider>` in root layout — `class` attribute, `system` default
- **Forms:** `react-hook-form` + `@hookform/resolvers` + Zod v4
- **Toasts:** `sonner` (`<Toaster richColors />`) in root layout
- **Components:** General components live in `src/components/`. Page-specific components are co-located with their route (e.g. components under `src/app/dashboard/admins/`).

## Bun quirks

`package.json` has `"ignoreScripts": ["sharp", "unrs-resolver"]` and `"trustedDependencies": ["sharp", "unrs-resolver"]`. When adding native dependencies, update these lists.
