# Portl

A mobile-first society management platform for Indian residential apartment communities — visitor approvals, gate entry/exit logs, notices, polls, complaints, amenity bookings, staff directory, and maintenance dues, all in one app instead of scattered across gate calls and WhatsApp groups.

Built as a multi-tenant platform: one deployment serves any number of independent societies, each fully isolated from the others.

---

## Stack

| Layer         | Choice                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Backend       | Fastify + TypeScript, running on Bun                                     |
| ORM / DB      | Drizzle ORM (v1, relational query API) + Postgres (Docker, dev and prod) |
| Auth          | Better Auth, Google OAuth only                                           |
| Validation    | Zod, via `fastify-type-provider-zod`                                     |
| Realtime      | Socket.IO (Polls only — see below)                                       |
| Image hosting | ImageKit                                                                 |
| Mobile client | Expo SDK 57 + Expo Router, React Native                                  |
| Client state  | TanStack Query (server state) + React context (UI-only state)            |
| Styling       | Uniwind (Tailwind for React Native)                                      |
| Testing / CI  | `bun test` unit tests + GitHub Actions (`.github/workflows/ci.yml`)      |

---

## Repository layout

```
portl/
  server/     — Fastify backend (repo: portl-backend)
  client/     — Expo app (repo: portl-app)
  plan.md     — full chapter-by-chapter build log and design-decision record
```

This is intentionally **one repository with two folders**, not two separate repos or git submodules — kept simple during active development, with deployment handled via each platform's "root directory" setting rather than repo-splitting. `plan.md` is the working document this whole project was actually built against — every schema choice, every API shape, every "why" behind a chapter's scope is recorded there as it was decided, chapter by chapter. This README is the higher-level tour; `plan.md` is the detailed paper trail.

---

## Server structure (`server/`)

```
server/
  index.ts                 — entry point: builds and starts the Fastify instance
  env.ts                   — Zod-validated environment variables (fails fast on missing config)
  src/
    common/                — cross-cutting code, shared by every module
      db/
        schema/            — one file per domain (identity, visitors, logs, community,
                              amenities, payments, invites, auth), plus enums.ts and a
                              single unified relations.ts
      errors/               — AppError class + a const object of error codes
      http/                 — the standard { success, data|error } response envelope
      plugins/              — Fastify plugins (db, session, error handler, rate limit)
      middleware/           — requireAuth / requireRole / requireSociety
      helpers/              — assertBelongsToSociety (tenant-scoping helper)
      hooks/                — session-reading onRequest hook
      services/             — push.service.ts (Expo push notifications)
    modules/                — one folder per feature (auth, society, invite, visitors,
                              logs, notices, polls, complaints, amenities, staff,
                              payments, notifications), each with the same four files:
                              *.routes.ts, *.controllers.ts, *.service.ts, *.schema.ts
    lib/                    — singletons: auth.ts (Better Auth config), imagekit.ts,
                              socket.ts
```

**Why `common/` vs `modules/`**: `common/` is infrastructure — nothing in it knows what a "visitor" or a "notice" is. `modules/` is where domain logic lives, one folder per feature, each shaped the same way (routes → controllers → service → schema) so any module is navigable the same way regardless of which one you're looking at.

## Client structure (`client/`)

```
client/src/
  app/                     — Expo Router routes ONLY. Thin files: import from
                              features/*, render, handle routing glue. No business
                              logic lives here.
  features/
    <feature-name>/
      components/          — the actual screen content, extracted out of app/ routes
      services/            — TanStack Query hooks (useQuery/useMutation)
      hooks/                — feature-specific hooks that aren't plain data-fetching
      types/                — TS types specific to this feature
  lib/                     — cross-cutting singletons shared by every feature:
                              auth-client.ts, api.ts, query-client.ts, socket.ts,
                              offline-queue.ts, errors.ts
  components/              — generic, feature-agnostic UI: RoleDrawer, Toast,
                              ConfirmDialog, QrCode, AppLockScreen, OfflineSyncBanner
  context/                 — DrawerContext (open/close state for the role drawer)
  hooks/                   — app-wide hooks: useColorScheme, useAppLock, useOfflineSync
  constants/                — colors, fonts, navigation (drawer item definitions per role)
```

**Why `app/` stays thin**: Expo Router's file-based routing means route files can't move — but their _content_ can. Every route file is a a few lines: import the feature's component, render it. This means a feature's actual logic is discoverable in one place (`features/<name>/`) regardless of how many different routes happen to render it.

---

## Data model, in brief

21+ tables across seven domain areas, every tenant-scoped table carrying (directly or one hop away) a `society_id`:

- **Identity**: `societies`, `towers`, `flats`, and Better Auth's own `user`/`session`/`account`/`verification` tables
- **Invitations**: `society_invites`
- **Visitors**: `visitor_requests` + type-specific detail tables (`delivery_details`, `cab_details`, `service_staff_details`), `visitor_entry_logs`
- **People logs**: `resident_entry_logs`, `staff_entry_logs`, `staff_directory`
- **Community**: `notices`, `polls` + `poll_options` + `poll_votes`, `complaints`
- **Amenities**: `amenities`, `amenity_bookings`
- **Money**: `maintenance_dues`, `payment_confirmations`

Every primary/foreign key is a `uuid` (not a serial int) — a deliberate multi-tenant choice, so no sequence ever leaks how many rows exist across all tenants combined.

---

## Key architectural decisions, and why

### Payment _verification_, not a payment gateway

Residents don't pay through the app. They pay however they already pay — any UPI app — and then upload a screenshot plus the UTR reference number as proof; the admin reviews and marks the due paid or rejected. The app never touches money.

This wasn't a corner cut for lack of time — it's the actual right call for this product. Real payment gateways (Razorpay, RevenueCat, etc.) take a processing fee on every transaction, which means either the society absorbs that cost, or — far more likely in practice — the resident ends up paying _more than the actual maintenance amount_ just to cover the gateway's cut. For a maintenance-fee use case where the money is going to the society itself, not to Portl, inserting a payment processor into that flow adds cost and complexity for everyone involved and solves a problem nobody actually had. Keeping the ledger and audit trail in-house while letting UPI apps (which already exist on every resident's phone, with zero fees for peer/merchant transfers) handle the actual money movement is the pragmatic, arguably _more correct_ design — not a simplification.

### RBAC + tenant scoping, not textbook single-tenant RBAC

A role alone (`resident`, `security_guard`, `society_admin`) never determines whether a request is allowed — every check also confirms the specific resource belongs to the _caller's own_ `society_id`. Tables with `society_id` directly bake the scope into the mutation's own `WHERE` clause; tables one hop away (via `flat_id`, `visitor_request_id`, etc.) go through a shared `assertBelongsToSociety()` helper after fetching the resource with its owning relation. Postgres Row-Level Security was considered and deliberately deferred — it's the "if time permits" upgrade path, not a blocker, since the hybrid approach above is already a real enforced floor, not a hand-wave.

### Better Auth owns identity — no separate `users` table

Rather than maintaining a standalone `users` table alongside Better Auth's own `user`/`session`/`account` tables, the domain `users` table was migrated _into_ Better Auth's `user` table (via `additionalFields`: `societyId`, `flatId`, `role`, `phone`, `isActive`) early on. One identity table, not two overlapping ones — every foreign key across the schema points at the same place.

### Search-and-invite onboarding, not placeholder rows

Getting a resident into a society isn't "admin creates a row for someone who hasn't signed up yet, hope the email matches later." It's: the person signs in with Google first, the admin searches for their (already-existing, still-unassigned) account by name or email, sends an invite, and the person explicitly accepts or rejects it. Slower to bootstrap, but nobody is added to anything without a visible, revocable moment of consent — a real UX and trust improvement over a claim-by-email-match flow.

### Visitor approval: fan-out + atomic race-safe response

A visitor request goes to **every** resident of the flat at once, not one designated approver — first to respond wins. That "first wins" part is enforced with a single conditional `UPDATE ... WHERE status = 'pending'` rather than a read-then-write pair, so two residents tapping Approve/Reject within the same second can't both succeed or corrupt the request's state.

### Three parallel entry-log tables, not one polymorphic table

`visitor_entry_logs`, `resident_entry_logs`, and `staff_entry_logs` are three separate, symmetric tables rather than one table with a `loggable_type`/`loggable_id` polymorphic pair. Slightly more repetition, but each table only has the columns relevant to what it's actually logging, and no query ever needs to branch on a type discriminator to know what it's looking at. Residents' own entry/exit is logged too, not just visitors' — deliberately, for the same reason a visitor log matters: if something ever needs investigating, there's a record.

### Push notifications built incrementally, not all at once

Rather than building the entire push-notification system as its own chapter before any feature needs it, a minimal `push_tokens` table + registration endpoint + send-on-event call was built alongside the first feature that actually needed to notify someone (visitor approvals). Every later feature that needs a push (notices, complaint updates, payment review) adds its own send call against that same minimal infrastructure. A dedicated later pass then audits everything for consistent payload shape and deep-link targets — hardening what already works end-to-end, rather than building speculative infrastructure up front and hoping every feature ends up needing it the way it was guessed.

### Socket.IO — scoped to Polls only, not a general realtime layer

Nearly everything else in the app is well served by request/response plus a short-interval poll as a fallback (visitor approvals, notices, complaints). Polls are the one place where several people are looking at the _same_ live-updating number (vote counts) at the same time, where a socket genuinely earns its complexity over polling. Rather than introducing a general realtime layer and finding reasons to use it everywhere, Socket.IO here is one namespace, one room per society, two events — deliberately small.

### Offline queue for the guard app

Gate connectivity is the one place in the app where a dropped connection has a real consequence — a visitor stuck waiting. Guard-side actions (entry/exit logs, visitor registration) queue locally when offline and replay **sequentially**, not in parallel, once connectivity returns — replaying an exit log before its matching entry log would otherwise hit the server out of order.

### ImageKit for uploads

Every photo-upload flow (visitor photos, complaint photos, payment screenshots) uploads to ImageKit's media library rather than a generic S3 bucket — simpler auth (a single private key, Basic Auth, no bucket policy configuration), and one place to look for every uploaded image regardless of which feature produced it.

---

## Roles

| Role               | Can do                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resident**       | Approve/reject visitors for their flat, create + share pre-approval passes, view notices, vote in polls, raise complaints, book and cancel amenity slots, view their own gate history, submit payment proof |
| **Security Guard** | Register visitors at the gate, log entry/exit for visitors/residents/staff, verify pre-approval passcodes/QR codes, search residents, broadcast emergency alerts                                             |
| **Society Admin**  | Everything above, plus: manage towers/flats, invite residents/guards, create/edit notices, run polls, resolve complaints, manage amenities and the staff directory, review payment confirmations            |

---

## Getting started

**Server** (`server/`): copy `.env.example` to `.env`. The defaults point at the bundled Docker Postgres — only secrets need filling in: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` (must be a publicly reachable HTTPS URL — see `plan.md`'s Chapter 3 notes on why a plain `localhost`/LAN IP won't work for Google OAuth), `IMAGEKIT_PRIVATE_KEY`. Then:

```bash
bun install
bun run db:up        # start the Postgres container (docker compose)
bun run db:migrate   # apply migrations
bun run db:seed      # optional: demo society with all three roles
bun run dev          # start the API with watch mode
```

Other useful scripts: `bun run db:down` / `db:logs` manage the container, `bun test` runs the unit tests, `bun run type-check` and `bun run lint` match CI.

**Seed data**: `bun run db:seed` creates "Green Meadows Society" — two towers, eight flats, an admin, a guard, and two residents, plus amenities, notices, a poll, a complaint, staff, and this month's dues. Sign-in is Google-only, so seed users' emails must be real Google accounts you control: override with `SEED_ADMIN_EMAIL=… SEED_GUARD_EMAIL=… SEED_RESIDENT_EMAIL=…` before running. Safe to re-run — it exits without writing if the demo society already exists.

**Production (fully containerized)**: `docker-compose.prod.yml` runs Postgres (internal-only, no host port), the API (which auto-migrates on boot), and Caddy for TLS:

```bash
cp .env.example .env   # set strong POSTGRES_PASSWORD + all secrets
bun run docker:prod    # build & start the whole stack
```

Set `BETTER_AUTH_URL` to the public HTTPS origin Caddy serves, and point the domain in `server/Caddyfile` at yours.

**Client** (`client/`): copy `.env.example` to `.env`, set `EXPO_PUBLIC_API_URL` to the same reachable URL as the server. Google sign-in requires a **development build**, not Expo Go (custom URL schemes aren't available inside Expo Go's shared shell):

```bash
bun install
npx expo prebuild
npx expo run:android   # or run:ios
```

See `plan.md` for the full chapter-by-chapter history of every decision that led here.
