# Portl — Detailed Build Roadmap

**Repos:** `portl-backend` (folder: `server`) · `portl-app` (folder: `client`)
**Stack:** Fastify + TypeScript + Drizzle ORM + Neon Postgres (server) · Expo SDK 57 + Expo Router (client)
**Workflow:** one branch per chapter → PR → merge to `main`, per repo

---

## Chapter 0 — Project Init ✅

`(server + client)` · Branch: `main`

**server**

- Bun-init Fastify scaffold, TypeScript (bundler-mode `tsconfig.json`), `.env`/`.env.example`
- ESLint **flat config** (`eslint.config.js`) — required because ESLint 10 dropped `.eslintrc.json` support
- Prettier
- Folder split: `src/common/` (cross-cutting) and `src/modules/` (feature modules), root `index.ts` as unified entry
- `src/modules/health/health.routes.ts` — `GET /health`

**client**

- Expo SDK 57 scaffold, `npx expo` reset-project, TypeScript, Prettier

---

## Chapter 1 — Database & ORM Setup ✅

`(server)` · Branch: `feature/db-setup`

- Neon Postgres project (no Docker — branching + zero local setup friction won over Docker)
- Drizzle ORM **v1.0.0-rc.4** — uses the new `defineRelations()` API (RQBv2); the old per-table `relations()` export is gone in v1
- Schema split by domain, all under `src/common/db/schema/`:
  - `enums.ts` — every `pgEnum` in one place
  - `identity.schema.ts` — `societies`, `towers`, `flats`, `users`(*later absorbed into Better Auth's `user` table — see Chapter 3)
  - `visitors.schema.ts` — `visitor_requests`, `delivery_details`, `cab_details`, `service_staff_details`
  - `logs.schema.ts` — `visitor_entry_logs`, `resident_entry_logs`, `staff_directory`, `staff_entry_logs`
  - `community.schema.ts` — `notices`, `polls`, `poll_options`, `poll_votes`, `complaints`
  - `amenities.schema.ts` — `amenities`, `amenity_bookings`
  - `payments.schema.ts` — `maintenance_dues`, `payment_confirmations`
  - `relations.ts` — single unified `defineRelations()` call across all 21 tables, with explicit `alias` pairing wherever a table has **multiple FKs to the same target** (e.g. `visitor_requests.created_by` + `approved_by` both → `users`; `resident_entry_logs.user_id` + `entry_marked_by` + `exit_marked_by` all → `users`)
  - `index.ts` — re-exports everything
- All PKs/FKs: `uuid().defaultRandom()` — deliberate multi-tenant choice, no sequential ID leakage across societies
- `drizzle.config.ts` schema path: single file (`./src/common/db/schema/index.ts`), **not a glob** — a glob here caused every table/enum/constraint to register twice ("duplicate name" warnings) since it matched both `index.ts` and the files it re-exports
- `src/common/plugins/db.plugin.ts` — `fastify-plugin`wrapped, decorates `app.db`; paired with a `declare module 'fastify'` TS augmentation so `app.db` is fully typed, not `any`
- Seed script — **still outstanding**, revisit before Chapter 5 (Society Bootstrap) needs real dev data

---

## Chapter 2 — Backend Foundations ✅

`(server)` · Branch: `feature/backend-foundations`

- `src/common/errors/app-error.ts` — `AppError` class (`statusCode`, `code`, `message`, `details`) + static factories (`.notFound()`, `.badRequest()`, `.conflict()`, etc.); `error-codes.ts` as a const source of truth for `code` strings
- `src/common/http/app-response.ts` — standard envelope:
  - Success: `{ success: true, data }`
  - Error: `{ success: false, error: { code, message, details? } }`
  - Helpers: `sendSuccess()`, `sendError()`
- `src/common/plugins/error-handler.plugin.ts` — global `setErrorHandler`, priority order:
  1. `AppError` instances → use their own status/code
  2. `ZodError` → 400, `VALIDATION_ERROR`, field-level details
  3. Postgres SQLSTATE codes surfaced by `pg`/Drizzle: `23505` unique violation → 409 `CONFLICT`; `23503` FK violation → 400 `INVALID_REFERENCE`; `23502` not-null violation → 400 `MISSING_FIELD`
  4. Fallback → 500 `INTERNAL_SERVER_ERROR`, generic message to client, full error always logged server-side via `app.log.error()`
- `setNotFoundHandler` — **only** for unmatched routes (wrong path/method entirely). Resource-level 404s (valid route, missing row) go through `AppError.notFound()` in the handler instead — two genuinely different code paths, kept separate
- `@fastify/helmet` registered with `contentSecurityPolicy: false` — this is a pure JSON API for a mobile client, not a browser rendering HTML, so CSP and most browser-focused headers don't apply; kept the meaningful ones (`X-Content-Type-Options`, HSTS, etc.)
- Pino refined: `pino-pretty` transport + `debug` level in dev, structured JSON + `info` level in production
- `fastify-type-provider-zod` wired (`setValidatorCompiler`/`setSerializerCompiler`) — Zod is the **sole** validation layer; deliberately skipped Ajv to avoid two competing validators solving the same problem

---

## Chapter 3 — Authentication (Better Auth + Google) ✅

`(server + client)` · Branch: `feature/authentication`

**server**

- `src/lib/auth.ts` — Better Auth config, Google as the only social provider (no password/credential flow, so no `password` field dead weight anywhere)
- `src/common/db/schema/auth.schema.ts` — Better Auth's own `user`, `session`, `account`, `verification` tables, **replacing** the original standalone `users` table entirely (not duplicating it)
- **All FKs across all 21 domain tables were migrated** from the old `users.id` to `user.id` — a real, deliberate, data-preserving cutover (verified via the actual migration SQL: ID-mapping temp table, FK rewrite across all 15 dependent tables, old table dropped)
- **ID strategy decision:** every Better Auth table (`user`, `session`, `account`, `verification`) uses `uuid().defaultRandom()`, not Better Auth's default JS-generated ID strings — set via `advanced: { database: { generateId: false } }`. Keeps every PK in the schema consistently `uuid`.
- `user.additionalFields`: `societyId`, `flatId`, `role` (nullable — assigned later by admin, matches Chapter 5's bootstrap flow), `phone`, `isActive` (`input: false`, so clients can't self-activate)
- **`firstName`/`lastName` removed** — Better Auth's base `name` field is used instead (Google prefills it at sign-in); avoided having two overlapping "name" concepts on one row
- **Google profile photo is free** — Better Auth's `user.image` is auto-populated from Google's OAuth response, zero extra code. Only *non*authenticated people (visitors, staff directory entries) need manual photo capture via `expo-camera`/`expo-image-picker`
- `trustedOrigins`: `client://`, `client://*`, plus `exp://` variants in dev (for Expo Go deep-link compatibility on other flows — **does not** make Google login work in Expo Go itself, see below)
- ⚠️ Known peer-dependency mismatch: `@better-auth/drizzle-adapter@1.6.23` officially peer-depends on `drizzle-orm@^0.45.2`, not the `1.0.0-rc.4` this project runs. Works in practice (verified via type-check), but it's an unofficial combination — worth remembering if the adapter misbehaves later.

**client**

- `src/lib/auth-client.ts` — `createAuthClient` + `@better-auth/expo/client`'s `expoClient` plugin, `scheme: 'client'`, session storage via `expo-secure-store`
- `app.json` scheme: `"client"` — must match server's `trustedOrigins` and the client plugin's `scheme` exactly (three-way consistency required for the OAuth deep-link redirect to resolve)

**Critical environment/infra notes:**

- **Expo Go cannot run Google login.** Custom schemes only get registered into the OS via a compiled build (`AndroidManifest.xml`/`Info.plist`). A **development build** is required (`npx expo prebuild` + `npx expo run:ios`/`run:android`, or `eas build --profile development`).
- **`BETTER_AUTH_URL`** = the backend's own reachable base URL, **not** the client app's URL. Google rejects raw IP addresses as redirect URIs (LAN IP won't work), and requires HTTPS except for literal `localhost`. Recommended dev setup: **ngrok** (or similar tunnel) giving a stable HTTPS URL, used as both `BETTER_AUTH_URL` (server) and `EXPO_PUBLIC_API_URL` (client) — works uniformly across iOS Simulator, Android Emulator, and physical devices without per-platform branching. A free static ngrok domain avoids having to update the URL every restart.
- **Google Cloud Console** authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
- Rotate the Neon DB password and `BETTER_AUTH_SECRET` before going further if `.env` has ever been shared outside your own machine (was flagged once already — good practice regardless).

**Native modules to install before the first dev build** (batched to avoid repeated rebuilds):

```
npx expo install expo-secure-store expo-web-browser expo-linking \
  expo-notifications expo-device \
  expo-image-picker expo-camera expo-file-system \
  expo-haptics expo-local-authentication
```

- `expo-notifications` + `expo-device` — push notifications (Chapter 7+)
- `expo-image-picker` + `expo-camera` + `expo-file-system` — visitor photos (guard-captured), payment screenshots (resident gallery upload), staff directory photos (admin-uploaded) — **not** needed for user avatars, since those come free from Google
- `expo-haptics` — approve/reject tap feedback
- `expo-local-authentication` — optional Face ID/fingerprint app-lock, **off by default**, toggle in Settings (Chapter 17). Needs `NSFaceIDUsageDescription` in `app.json`'s `ios.infoPlist` for iOS.
- Explicitly **not** using `expo-location` — the guard always logs at a fixed gate, and the address is already known at the society level, so geotagging adds a permission prompt for no real benefit.

⚠️ **Added out-of-band, not part of the original batch:** `@react-native-community/datetimepicker` — installed ad hoc for Chapter 8 (pre-approval validity windows) and now also used in Chapter 10 (notice expiry). Triggers its own native rebuild the first time it's added, same as anything else on this list — noting it here retroactively so the full native-module picture stays in one place rather than scattered across chapters.

⚠️ **Added out-of-band:** `@react-native-async-storage/async-storage` — installed for the Appearance (light/dark/system) preference toggle on the Profile screen. Deliberately AsyncStorage rather than `expo-secure-store`: a display preference isn't sensitive, doesn't need Keychain/Keystore encryption, and SecureStore has a small per-key size ceiling that's the wrong fit even for trivially small values as a matter of using the right tool.

---

## Chapter 4 — Frontend Foundations ✅

`(client)` · Branch: `feature/frontend-foundations`

- Expo Router setup
- React Query (TanStack Query) provider — server state, caching, refetch-on-focus, polling fallback if needed
- Theme/design tokens (colors, typography, spacing)
- Zustand (or Context) for local auth state, backed by `auth-client.ts`'s session

---

## Chapter 5 — Society Bootstrap & Admin Core ✅

`(server + client)` · Branch: `feature/society-bootstrap`

Foundational — every later module depends on societies/towers/flats/users existing. This is also where **authentication + authorization middleware gets built for the first time** — no route currently checks the session or enforces tenant isolation, so this has to land before any real domain routes exist, not be retrofitted after.

- Base navigation shell: auth stack + placeholder role-based root (not yet wired to real screens — that's Chapter 6)

**Layer 1 — Authentication**
A Fastify hook reads the session from the incoming request via Better Auth's server-side `auth.api.getSession({ headers })` and attaches `request.user`/`request.session` (nullable) globally. A `requireAuth` preHandler throws `401` if it's null.

**Layer 2 — Authorization (RBAC + tenant scoping)**
Three separate checks, not one combined middleware:

1. **`requireRole(...roles)`** — does this role permit this action type at all? (e.g. only `society_admin` can create a tower)
2. **`requireSociety`** — does this user belong to a society yet? (needed everywhere except the "create my first society" route)
3. **Tenant scoping on the actual query** — does the _specific resource_ being touched belong to _this caller's own_ `society_id`? Can't be a generic middleware — has to happen per-route, since "which resource" varies.

**Tenant scoping — the hybrid approach (decided, not RLS — see below):**

- **Tables with `society_id` directly** (societies, towers, flats, `user`, visitor_requests, notices, polls, complaints, amenities, maintenance_dues, staff_directory): bake the scope straight into the mutation's own `WHERE` clause — e.g. `UPDATE flats SET ... WHERE id = :id AND society_id = :callerSociety`. Zero rows affected → treat as 403/404. One query, and the check can't be forgotten separately from the action because they're the same statement.
- **Tables one hop away from `society_id`** (`delivery_details`/`cab_details`/`service_staff_details` via `visitor_request_id`; `amenity_bookings` via `flat_id`; `payment_confirmations` via `due_id`; `resident_entry_logs`/`staff_entry_logs` similarly): fetch the resource with its owning relation via Drizzle's relational query (`with: { flat: true }` etc.), then explicitly check via a shared helper — e.g. `assertBelongsToSociety(resource, callerSocietyId)` — before mutating. Check-then-act, but centralized in one helper so it's consistent and greppable rather than reinvented per route.
- **Postgres Row-Level Security was considered and deliberately deferred** — RLS enforces isolation at the DB layer itself (bulletproof even if a route forgets the filter), but needs per-request session variables (`SET LOCAL app.current_society_id`) and policies per table, which is real setup overhead against a hackathon clock. The hybrid approach above is the enforced floor for now; RLS is a legitimate Chapter 17 "if time permits" upgrade, not a Chapter 5 blocker.
- Note on relationship depth: this whole scoping problem stays simple specifically because a `user` belongs to exactly **one** society at a time (a nullable scalar `society_id`, not a join table) — there's never an ambiguous "which of this user's several societies applies here" question the way a true multi-org ReBAC system would have. What's still open is that knowing a user's society doesn't automatically constrain what SQL a handler runs — that's what this whole section solves.

**Then the actual bootstrap flow:**

- Admin flow: create society → create towers → create flats → invite/create residents & guards
- Creating a society should atomically assign the creator as that society's `society_admin` (`role` + `societyId` set in the same request) — and block a user who already belongs to a society from creating/joining a second one
- This is also where the **seed script** debt from Chapter 1 should finally get paid off, or at minimum where real dev data starts existing through the API itself

---

## Chapter 6 — Resident & Guard Dashboards ✅

`(client)` · Branch: `feature/dashboard-shells`

- Role-based tab navigators: Resident / Guard / Admin — genuinely different workflows per role, not just "more buttons for admin"
- Empty states, loading states, profile screens — structural only, no real data wiring yet

---

## Chapter 7 — Visitor Management (core flow) ✅

`(server + client)` · Branch: `feature/visitor-management`

**This is the product's heartbeat — the flagship feature.**

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/visitors.schema.ts`)**:
  - `visitor_requests` Table: `id` (UUID), `society_id` (FK), `flat_id` (FK, **nullable** — null when `approver_type = 'admin'`, see below), `name` (varchar), `phone` (varchar), `status` (enum: `pending`, `approved`, `rejected`, `expired`), `visitor_type` (enum: `guest`, `delivery`, `cab`, `service_staff`, `admin_visitor`), **`approver_type`** (enum: `resident`, `admin` — determines who this request routes to; `admin_visitor` type always implies `approver_type = 'admin'`, e.g. prospective flat buyers or anyone whose approval authority is the admin rather than a specific flat's residents), `purpose` (varchar), `vehicle_number` (varchar, optional — for **non-cab** vehicles only, e.g. a delivery rider's bike; cab-specific plate numbers live on `cab_details.plate_number` instead, see below), `source` (enum: `gate`, `pre_approval`), `photo_url` (varchar, optional), `created_at` (timestamp), `updated_at` (timestamp).
  - `delivery_details` Table: `id` (UUID), `visitor_request_id` (FK), `company` (varchar, e.g. Amazon, Swiggy, Zomato).
  - `cab_details` Table: `id` (UUID), `visitor_request_id` (FK), `company` (varchar, e.g. Uber, Ola), `plate_number` (varchar, optional).
  - `service_staff_details` Table: `id` (UUID), `visitor_request_id` (FK), `service_provider` (varchar), `job_title` (varchar).
  - **`push_tokens` Table** (new — pulled forward from Chapter 16 since this chapter is the first thing that actually needs to send a push): `id` (UUID), `user_id` (FK to `user`), `expo_push_token` (varchar), `device_id` (varchar, optional), `created_at`, `updated_at`. A user can have more than one token (multiple devices) — no uniqueness constraint on `user_id` alone, but `(user_id, expo_push_token)` should be unique to avoid duplicate rows on re-registration.
- **Endpoints (`server/src/modules/visitors/visitors.routes.ts`)**:
  - `POST /api/visitors/request` - Guard creates a request. Uses `fastify-type-provider-zod` to validate input. If `visitor_type` matches `delivery`, `cab`, or `service_staff`, validates and creates corresponding rows in detail tables within a **DB transaction**. Routing depends on `approver_type`: if `resident`, sends push to every user with a token whose `flat_id` matches the request; if `admin`, sends push to every `society_admin` in the society instead (and `flat_id` is not required on the request body in this case).
  - `GET /api/visitors/pending` - Resident fetches pending requests for their own flat (`approver_type = 'resident'` only). Admin fetches pending requests routed to them (`approver_type = 'admin'` only). Guard fetches all pending requests for the gate, regardless of `approver_type`. All scoped by caller's `society_id`.
  - `PUT /api/visitors/request/:id/respond` - Resident or admin responds (`status` = `approved` or `rejected`), depending on which `approver_type` they're allowed to act on. Must be performed inside a database transaction to handle race conditions atomically:

    ```tsx
    const [updated] = await tx
      .update(visitorRequests)
      .set({ status, approvedBy: user.id })
      .where(
        and(
          eq(visitorRequests.id, requestId),
          eq(visitorRequests.status, "pending"),
          eq(visitorRequests.societyId, user.societyId),
        ),
      )
      .returning();
    if (!updated)
      throw AppError.conflict(
        "REQUEST_ALREADY_RESOLVED",
        "This request has already been handled by another flat resident.",
      );
    ```

  - `POST /api/visitors/request/:id/log-entry` - Guard marks entry. Creates row in `visitor_entry_logs` with `entry_time = now`, `entry_marked_by = guard.id`. Scoped by caller's `society_id`.
  - `POST /api/visitors/request/:id/log-exit` - Guard marks exit. Updates the corresponding row in `visitor_entry_logs` with `exit_time = now`, `exit_marked_by = guard.id`.
  - `POST /api/upload` - Guard uploads visitor photo captured on device camera. Saves it locally or uploads to S3, returns the URL.
  - `POST /api/notifications/register` - Minimal version pulled forward from Chapter 16: saves the caller's Expo push token into `push_tokens`. Chapter 16 later hardens this (dedup, expired-token cleanup, batching) but doesn't build it from scratch — it already exists by then.
- **On `expired` status**: a request left `pending` past a reasonable window (e.g. guard-initiated requests with no response) should transition to `expired` rather than sitting `pending` forever. Worth deciding here whether this is a scheduled job, a lazily-checked condition on read (`GET /api/visitors/pending` treats old-enough pending rows as expired without a background job), or deferred entirely to a later chapter — flagging as open rather than assuming.

### Client Architecture (Expo)

- **Guard Interface**:
  - `client/src/app/(app)/guard/register-visitor.tsx` (Form, Camera component via `expo-camera` or image picker via `expo-image-picker`).
  - `client/src/app/(app)/guard/visitor-queue.tsx` (Lists all active/pending visitors).
- **Resident Interface**:
  - Live overlay/card on `client/src/app/(app)/home.tsx` that queries pending requests and shows haptic notification alerts.
- **Admin Interface**:
  - Equivalent live card/queue on the admin Home surface for `approver_type = 'admin'` requests — same underlying data shape as the resident card, just scoped to admin-routed requests instead of a flat's own.
- **State & Flow**:
  - TanStack Query hook `['visitors', 'pending']` with polling (every 5 seconds) as fallback if push is slow.
  - Haptic feedback via `expo-haptics` on receiving a request and upon successful approval/rejection actions.
  - `client/src/hooks/useNotifications.ts` (minimal version, pulled forward from Chapter 16): registers the Expo push token on login, calls `POST /api/notifications/register`. Chapter 16 later adds the listener/deep-link handling on top of this.

---

## Chapter 8 — Pre-Approvals ✅

`(server + client)` · Branch: `feature/pre-approvals`

### Server Architecture (Fastify)

- **Endpoints (`server/src/modules/visitors/visitors.routes.ts`)**:
  - `POST /api/visitors/pre-approve` - Resident creates pre-approval. Generates a row in `visitor_requests` with `status = 'approved'`, `source = 'pre_approval'`, `approver_type = 'resident'` (pre-approvals are always flat-scoped, never admin-routed), and a unique 6-digit alphanumeric code (`pass_code`) saved in a new column on `visitor_requests`. Sets expiration date (`valid_from`, `valid_until`).
  - `GET /api/visitors/pre-approvals` - Resident lists active/expired pre-approvals they created.
  - `POST /api/visitors/verify-pass` - Guard inputs the passcode or scans a QR containing the `visitor_request_id` or `pass_code`. Verified by `society_id` and checks validity window. Returns visitor details.

### Client Architecture (Expo)

- **Resident Interface**:
  - `client/src/app/(app)/pre-approvals/create.tsx` (date-picker for validation window using `@react-native-community/datetimepicker`, guest name/phone form).
  - `client/src/app/(app)/pre-approvals/index.tsx` (shows list, displays generated QR code/passcode).
- **Guard Interface**:
  - `client/src/app/(app)/guard/verify-pass.tsx` (integrates QR scanner using `expo-camera` or raw passcode text field).

---

## Chapter 9 — Resident & Staff Entry Logs ✅

`(server + client)` · Branch: `feature/entry-logs`

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/logs.schema.ts`)**:
  - `resident_entry_logs`: `id` (UUID), `society_id` (FK), `user_id` (FK to `user`), `entry_time` (timestamp), `exit_time` (timestamp, nullable), `entry_marked_by` (FK to `user`), `exit_marked_by` (FK to `user`).
  - `staff_entry_logs`: `id` (UUID), `society_id` (FK), `staff_id` (FK to `staff_directory`), `entry_time` (timestamp), `exit_time` (timestamp, nullable), `entry_marked_by` (FK), `exit_marked_by` (FK).
- **Endpoints (`server/src/modules/logs/logs.routes.ts`)**:
  - `POST /api/logs/resident` - Guard logs resident entry/exit by scanning flat cards/searching name.
  - `POST /api/logs/staff` - Guard logs staff entry/exit.
  - `GET /api/logs` - List history for the gate, filtered by date, search term, log type. Scoped by caller's `society_id`.

### Client Architecture (Expo)

- **Guard Interface**:
  - `client/src/app/(app)/guard/resident-search.tsx` (Search residents by tower/flat or name, log entry with one-tap).
  - `client/src/app/(app)/guard/gate-logs.tsx` (Unified list of logs showing who entered and exited recently).
- **Resident Interface**:
  - Historical log card added to `client/src/features/profile/components/ProfileScreen.tsx` so residents can see their own gate log history.

---

## Chapter 10 — Notices ✅

`(server + client)` · Branch: `feature/notices`

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/community.schema.ts`)**:
  - `notices`: `id` (UUID), `society_id` (FK), `title` (varchar), `content` (text), `category` (enum: `emergency`, `maintenance`, `event`, `general`), **`expires_at`** (timestamp, nullable — a notice with no expiry stays visible indefinitely; when set, the notice should stop showing to residents/guards past that time), `created_by` (FK to `user`), `created_at` (timestamp).
- **Endpoints (`server/src/modules/notices/notices.routes.ts`)**:
  - `POST /api/notices` - Admin creates notice, optionally setting `expires_at` via `@react-native-community/datetimepicker` on the client (date-only selection, avoids hand-rolled date-string validation). Triggers push notification to all users in the society: `EXPO_PUSH_NOTIFICATION_BROADCAST`. Role check: `requireRole('society_admin')`.
  - `GET /api/notices` - Fetch notices sorted by latest first. Scoped by `society_id`. **Default behavior**: residents/guards only see notices where `expires_at IS NULL OR expires_at > now()` — expired notices are filtered out of the normal feed rather than shown with a stale badge. Admin gets an `?includeExpired=true` option (or a separate "manage notices" view) so they can still see/edit/delete their own past notices rather than losing access to them entirely once expired.
  - `PUT /api/notices/:id` - Edit notice, including extending/clearing `expires_at` (Admin only).
  - `DELETE /api/notices/:id` - Delete notice (Admin only).

### Client Architecture (Expo)

- **Admin Interface**:
  - `client/src/app/(app)/admin/notices/create.tsx` (Form with dropdown categories, rich content text-area, optional expiry date picker).
- **Resident/Guard Interface**:
  - `client/src/app/(app)/notices.tsx` (switches between active feed lists, displays category badges).

---

## Chapter 11 — Polls ✅

`(server + client)` · Branch: `feature/polls`

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/community.schema.ts`)**: `polls`/`poll_options`/`poll_votes` were already scaffolded ahead of this chapter (society-scoped `polls` with `question`/`starts_at`/`ends_at`, `poll_options`, `poll_votes`). This chapter added the missing piece: a composite **unique index on `poll_votes(poll_id, user_id)`** (`poll_votes_poll_id_user_id_unique`, migration `20260724034124_safe_pet_avengers`) so one-vote-per-resident is DB-enforced via atomic insert, not a check-then-insert race.
- **Endpoints (`server/src/modules/polls/polls.routes.ts`)**:
  - `POST /api/polls` - Admin creates a poll with 2–10 options in a single transaction. Role check: `requireRole('society_admin')`.
  - `GET /api/polls` - Lists all polls (active & closed) with each option's live vote count and the caller's own vote status, so the client never needs a second round trip per poll.
  - `POST /api/polls/:id/vote` - Cast a vote. Verifies `ends_at > now`; the insert relies on the unique constraint above, catching Postgres `23505` and rethrowing as a friendly 409 ("You have already voted in this poll").
  - `GET /api/polls/:id/results` - Vote aggregates via Drizzle's `count()` + `groupBy`, matching the plan's original example.
- **Live updates (`server/src/lib/socket.ts`)**: a Socket.IO server attached to the same underlying Fastify HTTP server. Clients authenticate over the handshake using their existing Better Auth session cookie (sent in `auth.cookie`, since React Native's WebSocket transport can't attach custom headers) and join a per-society room. `poll:created` fires on `POST /api/polls`; `poll:results` fires on every successful vote — both fire-and-forget so a socket hiccup never fails the REST response.

### Client Architecture (Expo)

- **Admin Interface**:
  - `client/src/app/(app)/polls/create.tsx` (dynamic options input builder, 2–10 options, `ends_at` via the same date picker pattern as notices).
- **Resident/Guard Interface**:
  - `client/src/app/(app)/polls/index.tsx` (renders active vote cards with radio buttons, or a live bar-chart results layout if the caller has voted or the poll has ended).
- **Real-time (`client/src/lib/socket.ts`, `client/src/features/polls/hooks/use-polls.ts`)**: a shared Socket.IO client connects using `authClient.getCookie()` for the handshake; `usePolls()` subscribes to `poll:created`/`poll:results` and patches the TanStack Query cache directly, so every connected device sees vote counts update live with no polling interval.

---

## Chapter 12 — Complaints (Helpdesk) ✅

`(server + client)` · Branch: `feature/complaints`

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/community.schema.ts`)**: `complaints` was already scaffolded ahead of this chapter (society/flat/user-scoped, `complaint_status` enum). This chapter added the missing pieces: a `title` column, a `complaint_category` enum (`plumbing`/`electrical`/`security`/`cleanliness`/`general`) replacing the free-text `category` varchar, an optional `photo_url`, and an optional `admin_comments` — migration `20260724060130_previous_sugar_man`.
- **Endpoints (`server/src/modules/complaints/complaints.routes.ts`)**:
  - `POST /api/complaints` - Resident logs a complaint against their own flat. Role check: `requireRole('resident')`.
  - `GET /api/complaints` - Residents see every complaint raised against their own flat (not just their own — a flat can have several residents); admins see the whole society's queue. The split happens inside the service based on `caller.role`, same pattern as notices/polls.
  - `PUT /api/complaints/:id/status` - Admin updates status and optionally appends a resolution note (`adminComments`). Role check: `requireRole('society_admin')`. Sends a push notification back to the reporting resident (`raisedBy`), fire-and-forget, mirroring the notices push pattern (Chapter 10).
- **Photo upload**: reuses the generic `POST /api/upload` base64-upload endpoint introduced for visitor photos (Chapter 7) — its role restriction was loosened from guard-only to guard-or-resident so a resident can attach a complaint photo through the same flow.

### Client Architecture (Expo)

- **Resident Interface**:
  - `client/src/app/(app)/complaints/create.tsx` (category grid picker, title/description fields, camera/library photo capture via the same `expo-image-picker` → base64 → `/api/upload` flow as visitor registration).
  - `client/src/app/(app)/complaints/index.tsx` (list of the resident's flat complaints with status badges: red for open, amber for in-progress, green for resolved, muted for closed; shows the admin's resolution note once one exists).
- **Admin Interface**:
  - `client/src/app/(app)/admin/complaints/manage.tsx` (triage board with status filter chips; each ticket expands into a status picker + resolution-note field that calls `PUT /api/complaints/:id/status`).
- Both `constants/navigation.ts` drawer entries (`ADMIN_DRAWER_ITEMS` and `RESIDENT_DRAWER_ITEMS`) flipped from the `feature-preview` placeholder to live routes; `complaints` and `admin` registered as hidden (drawer-only) routes in `app/(app)/_layout.tsx`.

---

## Chapter 13 — Amenities & Booking ✅

`(server + client)` · Branch: `feature/amenities`

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/amenities.schema.ts`)**:
  - `amenities`: `id` (UUID), `society_id` (FK), `name` (varchar), `description` (text), `capacity` (integer), `is_active` (boolean).
  - `amenity_bookings`: `id` (UUID), `amenity_id` (FK), `flat_id` (FK), `booked_by` (FK to `user`), `start_time` (timestamp), `end_time` (timestamp), `status` (enum: `confirmed`, `cancelled`).
- **Conflict Prevention Query (Crucial Edge Case)**:
  When booking, the handler must check if any overlapping booking exists for the selected amenity:

  ```tsx
  const overlapping = await tx
    .select()
    .from(amenityBookings)
    .where(
      and(
        eq(amenityBookings.amenityId, amenityId),
        eq(amenityBookings.status, "confirmed"),
        or(
          and(
            lte(amenityBookings.startTime, startTime),
            gt(amenityBookings.endTime, startTime),
          ),
          and(
            lt(amenityBookings.startTime, endTime),
            gte(amenityBookings.endTime, endTime),
          ),
          and(
            gte(amenityBookings.startTime, startTime),
            lte(amenityBookings.endTime, endTime),
          ),
        ),
      ),
    );
  if (overlapping.length > 0)
    throw AppError.conflict(
      "SLOT_DOUBLE_BOOKED",
      "This time slot overlaps with an existing booking.",
    );
  ```

- **Endpoints (`server/src/modules/amenities/amenities.routes.ts`)**:
  - `POST /api/amenities` - Admin creates new amenities.
  - `GET /api/amenities` - List active amenities.
  - `POST /api/amenities/:id/book` - Resident books time slots (includes overlapping transaction check).
  - `GET /api/amenities/bookings` - Lists booking slots.

### Client Architecture (Expo)

- **Resident Interface**:
  - `client/src/app/(app)/amenities/book.tsx` (time-slot grid visualizer, validates selections).
- **Admin Interface**:
  - `client/src/app/(app)/admin/amenities/logs.tsx` (booking logs calendar).

---

## Chapter 14 — Staff/Service Provider Directory

`(server + client)` · Branch: `feature/staff-directory`

- **Contact-only directory** — no login, no self-service. Deliberately distinct from the `service_staff` _visitor type_ in Chapter 7 (a one-off service visitor vs. a recurring staff member like a cook or driver)

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/logs.schema.ts`)**:
  - `staff_directory`: `id` (UUID), `society_id` (FK), `name` (varchar), `phone` (varchar), `role` (varchar, e.g. Cook, Driver, Maid), `photo_url` (varchar, optional), `is_active` (boolean).
- **Endpoints (`server/src/modules/staff/staff.routes.ts`)**:
  - `POST /api/staff` - Admin adds helper/staff to directory.
  - `GET /api/staff` - Searchable listing for residents and guards. Scoped by `society_id`.
  - `DELETE /api/staff/:id` - Deactivates/removes staff (Admin only).

### Client Architecture (Expo)

- **Resident/Guard Interface**:
  - `client/src/app/(app)/staff-directory.tsx` (list of staff members with click-to-call action, searchable by name and filterable by roles).
- **Admin Interface**:
  - `client/src/app/(app)/admin/staff/manage.tsx` (add/remove staff members, handles photo upload using `expo-camera`).

---

## Chapter 15 — Maintenance Dues & Payment Confirmations

`(server + client)` · Branch: `feature/maintenance-dues`

- Deliberately **not** integrating a real payment gateway — "smartly outsourcing" the actual money movement to UPI apps while keeping the audit trail in-house; a genuinely pragmatic scope decision.

### Server Architecture (Fastify)

- **Database Schema (`server/src/common/db/schema/payments.schema.ts`)**:
  - `maintenance_dues`: `id` (UUID), `society_id` (FK), `flat_id` (FK), `amount` (numeric), `due_date` (timestamp), `billing_period` (varchar, e.g. "July 2026"), `status` (enum: `unpaid`, `pending_verification`, `paid`).
  - `payment_confirmations`: `id` (UUID), `due_id` (FK), `uploaded_by` (FK to `user`), `transaction_id` (varchar/UTR number), `screenshot_url` (varchar), `rejection_reason` (text, optional), `created_at` (timestamp).
- **Endpoints (`server/src/modules/payments/payments.routes.ts`)**:
  - `POST /api/payments/dues` - Admin generates bills for all flats or specific ones.
  - `GET /api/payments/dues` - Lists dues. Scoped by flat (for resident) or society (for admin).
  - `POST /api/payments/confirm` - Resident submits confirmation proof (uploads screenshot, enters UTR). Triggers status change in `maintenance_dues` to `pending_verification`.
  - `PUT /api/payments/confirm/:id/verify` - Admin approves or rejects the proof. If approved, marks `maintenance_dues.status = 'paid'`. If rejected, reverts to `unpaid` and saves rejection comments.

### Client Architecture (Expo)

- **Resident Interface**:
  - `client/src/app/(app)/payments/index.tsx` (Displays unpaid maintenance bills, displays a static UPI QR code linked to society account, provides form to input transaction UTR and upload receipt via `expo-image-picker`).
- **Admin Interface**:
  - `client/src/app/(app)/admin/payments/review.tsx` (Pending list showing transaction details, provides fullscreen image gallery review, and Approve/Reject buttons).

---

## Chapter 16 — Push Notification Consolidation

`(server + client)` · Branch: `feature/push-consolidation`

- Hardening pass, not new features — Chapter 7 already built the minimal `push_tokens` table, registration endpoint, and client-side registration hook (pulled forward since Chapter 7 was the first thing that actually needed to send a push). This chapter audits and hardens what already exists across Chapters 7–15, rather than building push infrastructure from scratch.

### Server Architecture (Fastify)

- **Service (`server/src/common/services/push.service.ts`)**:
  - Wraps native Expo Push API client, implements bulk notification batching, and handles error reporting for expired tokens (removing dead `push_tokens` rows on delivery failure).
- **Endpoints (`server/src/modules/notifications/notifications.routes.ts`)**:
  - `POST /api/notifications/register` - Already exists from Chapter 7; confirm it correctly dedupes on `(user_id, expo_push_token)`.
  - `DELETE /api/notifications/unregister/:token` - New — remove push token from DB upon logout.
- **Payload Standards**:
  Every notification includes a structured data envelope:

  ```json
  {
    "to": "ExponentPushToken[xxx]",
    "title": "Visitor at Gate",
    "body": "Uber driver is requesting entry to Flat 402",
    "data": {
      "screen": "/(app)/home",
      "params": { "requestId": "uuid" }
    }
  }
  ```

- Audit every push call added in Chapters 7–15 against this envelope shape for consistency (category naming, `data.screen` deep-link targets, etc.) — this is the actual point of the chapter.

### Client Architecture (Expo)

- **Hook (`client/src/hooks/useNotifications.ts`)**:
  - Token registration already exists from Chapter 7; this chapter adds the notification listener and handles deep link redirects automatically when a user taps a notification.

---

## Chapter 17 — Polish & Production Readiness

`(server + client)` · Branch: `feature/production-polish`

### Security & DB Hardening

- **Rate Limiting**: Integrate `@fastify/rate-limit` on security-sensitive routes (login callbacks, pass code verifications).
- **Indexes**: Explicitly verify/add indexes on frequently-queried columns (`society_id`, `flat_id`, `status`) in schemas.
- **Biometric Lock**: Integrate `expo-local-authentication` into client login/initialization.
- **Postgres Row-Level Security** — upgrade the Chapter 5 hybrid tenant-scoping approach to DB-enforced isolation, if time permits. Not a hard requirement for submission, but the natural next step if there's time left after the above.

### Offline Guard Queue

- Implement offline storage (e.g. SQLite or AsyncStorage) in the Guard app.
- If gate connection drops, keep logs locally. Set up a background sync task that runs when network state switches back to online (`NetInfo` API) and flushes the queue to the backend.

---

## Standing decisions worth remembering

- **Two separate git repos are not used during dev** — single `portl` repo, `server`/`client` as folders, matching the hackathon's "public GitHub repository" (singular) requirement. Deploy-only snapshots (fresh single-commit repos) can be created at the very end if a platform genuinely requires its own repo root.
- **No shared types package** between `server` and `client` — manually kept in sync, Zod schemas on the backend act as the source of truth to copy from.
- **Drizzle v1's `defineRelations()`**, not the legacy `relations()` API — this project is intentionally on a release-candidate version ahead of most tutorials/docs online, so don't trust older Drizzle examples verbatim.
- **Verify package versions against the actual registry before installing** — this has already caught stale/wrong versions twice (ESLint 9 vs 10 tooling, `@eslint/js`/`typescript-eslint`/`globals`).
- **Authorization is RBAC + tenant scoping, not textbook single-tenant RBAC** — role alone never determines access; every check also confirms the specific resource belongs to the caller's own `society_id`, either baked into the query (direct-column tables) or via an explicit shared helper (one-hop tables). See Chapter 5 for the full design.
- **Push notifications are built module-by-module starting in Chapter 7** (minimal token table + registration + send-on-event), not built from scratch in Chapter 16 — Chapter 16 is a consolidation/hardening pass over infrastructure that already exists by then.
- **Socket.IO for live/real-time features, introduced in Chapter 11** — one `Server` instance attached to Fastify's underlying HTTP server (`server/src/lib/socket.ts`), one room per society. Auth rides on the existing Better Auth session cookie passed through the handshake's `auth` payload (not headers — React Native's WebSocket transport can't set custom headers), verified with `auth.api.getSession`. Future chapters needing live updates (e.g. Complaints status changes, Amenity booking availability) should extend this same socket server with new events/rooms rather than standing up a second one.

---
