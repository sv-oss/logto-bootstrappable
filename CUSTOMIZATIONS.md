# Logto Customizations

This document describes all changes made to the upstream [Logto](https://github.com/logto-io/logto) codebase in this fork. It is intended to make rebasing, upgrading, and onboarding easier by clearly separating custom work from upstream code.

## Overview

The primary addition is a **self-service management dashboard** built into the Account Center SPA (`packages/account`). This allows end-users to view and edit their own profile, security settings, and MFA options from a single page, gated by the existing `AccountCenterFieldControl` settings configured in the admin console.

### Upstream catch-up notes

- **v1.38.0 integration:** The account center routing now keeps fork-specific routes (`/profile`, `/authenticator-app/manage`) while also retaining upstream v1.38.0 additions (social account routes/callback flow and authenticator app replace flow). The fork behavior remains: users with existing TOTP are redirected to manage/remove instead of seeing an error screen.
- **v1.38.0 reconciliation (customization-reconcile):**
  - `packages/account` profile save now refreshes user info through `PageContext.refreshUserInfo()` to stay compatible with upstream `PageContext` shape while preserving given/family name updates.
  - `ConsoleLog` JSON output remains aligned with fork contracts: `time` is ISO 8601, HTTP JSON uses `x-host`, and audit JSON message keys are emitted consistently as `[Audit] <key>`.
  - `auto-custom-data-claims` keeps the `customer_id` auto-generation behavior with lint-compatible typing adjustments only (no runtime behavior change).
- **security-safe-remediation:**
  - Applied non-breaking dependency hardening through direct patch/minor updates and root `pnpm.overrides` for vulnerable transitive ranges (`vite`, `nodemailer`, `follow-redirects`, `axios`, `dompurify`, `@xmldom/xmldom`, `basic-ftp`), then refreshed the lockfile.
  - Left advisories with no stable safe upgrade path (`lodash` / `lodash-es` advisories requiring non-existent `4.18.0`) deferred for upstream ecosystem resolution.
- **repo-validation follow-up (chore/upstream-v1.38.0-catchup):**
  - `packages/phrases-experience/src/index.ts` now mirrors upstream `@logto/phrases` resource typing by requiring full `LocalePhrase` only for the default locale (`en`) and allowing `DeepPartial<LocalePhrase>` for non-default locales. This resolves stricter TypeScript assignability regressions introduced during the upstream/security catch-up while preserving runtime fallback behavior.
  - `packages/core/package.json` now ignores generated `build/**` and local Jest JS config files during ESLint runs so `pnpm ci:lint` remains stable after `pnpm ci:build` in this fork’s validation flow.
  - `packages/core/package.json` now runs `build:test` before `test:only` in `test:ci`, aligning CI behavior with the existing `test` script so Jest can discover tests under `build/` after upstream catch-up.
  - `packages/core/src/oidc/scope.test.ts` now expects the fork’s `customer_id` profile claim in accepted OIDC claims, keeping tests aligned with the auto custom data claim behavior retained in this fork.
  - `packages/connectors/connector-smtp-sms/package.json` now uses `vitest run src` for `test` so recursive CI test runs exit deterministically instead of entering watch mode.
  - Validation snapshot: `pnpm ci:build`, `pnpm ci:lint`, `pnpm --filter @logto/core test:ci`, `pnpm --filter @logto/shared test -- src/node/env/ConsoleLog.test.ts src/node/env/ConsoleLog.audit.test.ts --reporter=verbose`, and `pnpm --filter ./packages/connectors/connector-smtp-sms test` pass on this branch; `pnpm audit --prod` now reports only deferred `lodash` advisories in `packages/cli > inquirer`.

---

## Changes by Package

### `packages/account`

#### New pages

| Path | Description |
|------|-------------|
| `src/pages/Home/` | Management dashboard — the root route (`/`). Shows personal info (name, given name, family name, avatar, username, email, phone) and security fields (password, TOTP, passkeys, backup codes) as read-only rows with contextual action buttons. Respects `AccountCenterControlValue` (Off / ReadOnly / Edit) for each field. Includes an empty state when all fields are `Off`. |
| `src/pages/TotpManage/` | TOTP removal flow at `/authenticator-app/manage`. Requires a fresh verification, shows the current authenticator app status, and allows the user to remove it via a confirmation modal. |

#### Modified pages

| Path | Change |
|------|--------|
| `src/pages/Profile/index.tsx` | Extended to handle `profile.givenName` and `profile.familyName` in addition to the existing `name` and `avatar` fields. Submits two API calls when both are active: `PATCH /api/my-account` (name/avatar) and `PATCH /api/my-account/profile` (givenName/familyName). Visibility is controlled by `fields.profile` (`AccountCenterControlValue`). |
| `src/pages/TotpBinding/index.tsx` | Now redirects to `/authenticator-app/manage` via `useEffect` when TOTP is already configured, instead of showing an error state. |
| `src/pages/UpdateSuccess/index.tsx` | Conditionally shows a "Back to account" button (using React Router `navigate('/')`) when no external `redirectUrl` is present in session storage. External redirect flows (post-signin / onboarding) are unchanged. |
| `src/pages/Home/index.tsx` | Added a **Sign out** button at the bottom of the dashboard using `useLogto().signOut()`. Redirects to the account center root (`accountCenterBasePath`) after sign-out. |

#### New files (within existing pages)

| Path | Description |
|------|-------------|
| `src/pages/Home/FieldRow.tsx` | Shared `FieldRow` display component and `editAction` helper used by `PersonalInfoSection` and `SecuritySection`. |
| `src/pages/Home/PersonalInfoSection.tsx` | Personal info section of the dashboard. Profile-route fields (name, given name, family name, avatar) render as a group with a **single** "Edit" button in the section header. Contact fields (username, email, phone) each have their own action button. Also exports `checkHasPersonalInfoFields`. |

#### Other modified files

| Path | Change |
|------|--------|
| `src/apis/account.ts` | Added `updateProfileFields(profile: UserProfile)` calling `PATCH /api/my-account/profile`. |
| `src/constants/routes.ts` | Added `authenticatorAppManageRoute = '/authenticator-app/manage'`. |
| `src/App.tsx` | Registered the `TotpManage` component at `authenticatorAppManageRoute`. |

#### Dashboard design decisions

- **Field visibility**: Each field row is gated by its corresponding `AccountCenterFieldControl` value. `Off` → hidden; `ReadOnly` → shown without action button; `Edit` → shown with "Edit"/"Add" button.
- **Profile card**: The top card prioritises `profile.givenName + profile.familyName` as the display name, falling back to `name`, then `username`. The initials avatar is derived from the same value.
- **Single edit button for profile fields**: Name, given name, family name, and avatar all navigate to the same `/profile` page, so they share one "Edit" button in the section header rather than having per-row buttons.
- **MFA status**: TOTP active/inactive state and passkey count are fetched on mount via `GET /api/my-account/mfa-verifications` (no verification record required).
- **Back to account CTA**: MFA success/failure pages detect whether the user arrived from the dashboard (no `redirectUrl` in session storage) and show a "Back to account" button instead of leaving the user stranded.

---

### `packages/shared`

#### JSON structured logging (`ConsoleLog`)

The `ConsoleLog` class (used by every package for all stdout/stderr output) now supports JSON structured logging in addition to the default coloured text format.

Set the environment variable `LOG_FORMAT=json` to switch all log output to newline-delimited JSON. Each log line is a JSON object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `level` | `"plain"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` | Severity of the log entry |
| `time` | ISO 8601 string | Timestamp at the time of the call |
| `message` | string | All arguments joined as a space-separated string (ANSI codes stripped, objects JSON-encoded) |
| `prefix` | string | Instance prefix (e.g. request ID), only present when set |
| `error` | `{ name, message, stack }` | Only present when an `Error` object is passed as an argument |
| *(context keys)* | string | Any extra fields injected via `withContext()` appear as top-level keys after `message` |

**`withContext(context)`** — returns a new `ConsoleLog` that carries arbitrary string key-value pairs. In JSON mode the keys become top-level fields; in text mode they are appended as `key=value` pairs.

**`http(koaString, entry)`** — dedicated method for HTTP request/response lines produced by koa-logger. Accepts a typed `HttpLogEntry` and emits `level: "http"` in JSON mode with full header names as top-level keys, or appends short `key=value` extras in text mode. Controlled separately by the `LOG_HTTP` environment variable (see below).

**`audit(key, payload)`** — dedicated method for audit log events collected by `koa-audit-log`. Emits `level: "audit"` in JSON mode with all payload fields as top-level keys, or a compact `[audit] key result=… userId=…` line in text mode. Controlled by the `LOG_AUDIT` environment variable (see below).

Example output:

```json
{"level":"info","time":"2024-01-01T00:00:00.000Z","prefix":"index","message":"Core app is running at https://logto.example.com"}
{"level":"error","time":"2024-01-01T00:00:00.001Z","message":"Error: something broke","error":{"name":"Error","message":"something broke","stack":"Error: something broke\n    at ..."}}
```

Text output remains the default (no change to existing behaviour when `LOG_FORMAT` is unset).

---

### `packages/core`

#### HTTP request logging — enriched per-request context (`src/app/init.ts`)

The koa-logger transporter calls `consoleLog.http(koaString, entry)` for every HTTP request and response. Fields are emitted differently in text vs JSON mode — text mode skips values already present in the koa-logger string (method, status, duration, response length), and uses short aliases for readability.

**`LOG_HTTP` environment variable** controls which HTTP log lines are emitted:

| Value | Behaviour |
|-------|-----------|
| *(unset)* | Log all request and response lines |
| `off` / `silent` / `false` | Suppress all HTTP log output |
| `error` | Log only responses with status ≥ 400; request lines are suppressed |

**Text mode fields** (appended as `key=value` pairs after the koa-logger line):

| Field | Source | Lines |
|-------|--------|-------|
| `ip=` | `ctx.ip` | both |
| `fwd=` | `X-Forwarded-For` | both — only when chain differs from resolved IP |
| `proto=` | `X-Forwarded-Proto` | both — when present |
| `ua=` | `User-Agent` | both — when present |
| `host=` | `Host` | both — when present |
| `trace=` | `X-Amzn-Trace-Id` | both — when present |
| `accepts=` | `Accept` | both — when present |
| `origin=` | `Origin` | both — when present |
| `req_len=` | `Content-Length` | `<--` line only — when present |
| `ct=` | response `Content-Type` | `-->` line only — when present |

**JSON mode fields** (top-level keys, full header names, proper types):

| Field | Type | Source | Lines |
|-------|------|--------|-------|
| `message` | string | `"Serving Request for <path>"` | both |
| `method` | string | `ctx.method` | both |
| `url` | string | `ctx.originalUrl` (includes query string) | both |
| `path` | string | `ctx.path` (pathname only, no query string) | both — when present |
| `ip` | string | `ctx.ip` | both |
| `x-forwarded-for` | string | `X-Forwarded-For` header | both — only when chain differs from IP |
| `x-forwarded-proto` | string | `X-Forwarded-Proto` header | both — when present |
| `user-agent` | string | `User-Agent` header | both — when present |
| `x-host` | string | `Host` header | both — when present |
| `x-amzn-trace-id` | string | `X-Amzn-Trace-Id` header | both — when present |
| `accepts` | string | `Accept` header | both — when present |
| `origin` | string | `Origin` header | both — when present |
| `request_headers` | object | filtered request headers (see below) | both — when non-empty |
| `request_length` | number | `Content-Length` request header | both — when present |
| `status_code` | number | `ctx.status` | `-->` line only |
| `duration_ms` | number | `Date.now() - startTime` | `-->` line only |
| `response_length` | number | `ctx.response.length` | `-->` line only |
| `response_content_type` | string | response `Content-Type` header | `-->` line only — when present |

**`request_headers` filtering** — The following headers are excluded from `request_headers` because they are either sensitive or already captured as dedicated top-level fields: `authorization`, `cookie`, `set-cookie`, `x-api-key`, `proxy-authorization`, `x-auth-token`, `x-access-token`, `user-agent`, `host`, `x-forwarded-for`, `x-forwarded-proto`, `x-amzn-trace-id`, `content-length`, `origin`, `accept`.

The `message` field is formatted as `Serving Request for <path>` (using `ctx.path`, the pathname without query string) on both request and response lines, making these logs render cleanly in Datadog without a custom parsing pipeline.

Example text mode:

```
  <-- GET /api/path ip=203.0.113.42 proto=https ua=Mozilla/5.0 (...) host=logto.example.com accepts=application/json origin=https://app.example.com
  --> GET /api/path 200 12ms 1b ip=203.0.113.42 proto=https host=logto.example.com ct=application/json
```

Example JSON mode (`-->` response line):

```json
{"level":"http","time":"...","message":"Serving Request for /api/path","method":"GET","url":"/api/path","path":"/api/path","ip":"203.0.113.42","x-forwarded-proto":"https","user-agent":"Mozilla/5.0 (...)","x-host":"logto.example.com","accepts":"application/json","origin":"https://app.example.com","request_headers":{"x-request-id":"abc"},"status_code":200,"duration_ms":12,"response_length":1,"response_content_type":"application/json; charset=utf-8"}
```

#### Audit log console output (`src/middleware/koa-audit-log.ts`)

After inserting each audit log entry to the database, the middleware now also emits the event to the console via `consoleLog.audit(key, payload)`. This makes audit events available to any log aggregator watching stdout (e.g. a CloudWatch log group can filter on `"level":"audit"` to capture only security-relevant events).

**`LOG_AUDIT` environment variable** controls whether audit events are emitted:

| Value | Behaviour |
|-------|-----------|
| *(unset)* | Emit all audit events (default) |
| `off` / `silent` / `false` | Suppress all audit log output |

**JSON mode fields** (each audit line contains `level: "audit"` plus the full payload as top-level keys):

| Field | Type | Description |
|-------|------|-------------|
| `level` | `"audit"` | Fixed value — use this to filter audit lines |
| `time` | ISO 8601 string | Timestamp of the log call |
| `prefix` | string | Request ID prefix (when set) |
| `key` | string | Log event key, e.g. `Interaction.SignIn.Submit` |
| `result` | `"Success"` \| `"Error"` | Outcome of the event |
| `userId` | string | Authenticated user ID (when known) |
| `applicationId` | string | OIDC application ID (when known) |
| `ip` | string | Client IP address |
| `userAgent` | string | Raw User-Agent header |
| `error` | object | Error details when `result` is `"Error"` |
| *(other payload fields)* | mixed | Any additional context added by the route handler |

**Text mode:** emits `[audit] <key> result=… userId=… app=…` (only non-empty fields are shown).

Example JSON mode (successful sign-in):

```json
{"level":"audit","time":"...","prefix":"abc123","key":"Interaction.SignIn.Submit","result":"Success","userId":"usr_xyz","applicationId":"app_abc","ip":"203.0.113.42"}
```

---

### `packages/cli`

> Bootstrap configuration additions are documented in [BOOTSTRAP.md](./BOOTSTRAP.md).

#### `packages/cli/src/commands/database/seed/oidc-config.ts`

Added support for the `LOGTO_OIDC_SIGNING_KEY_TYPE` environment variable. When no OIDC private key is supplied via `OIDC_PRIVATE_KEYS` or `OIDC_PRIVATE_KEY_PATHS`, the seed process reads this variable to decide which algorithm to use when auto-generating the signing key. Accepted values: `EC` (default, secp384r1 / ES384) and `RSA` (4096-bit / RS256). Unrecognised values fall back to EC.

---

### `packages/phrases-experience` in all 18 supported locales (English is the authoritative source; other locales carry English placeholders until translated)

**`home` section**

| Key | Usage |
|-----|-------|
| `no_fields_available` | Empty state shown when all `AccountCenterFieldControl` values are `Off`. |
| `totp_active` | Status label shown when a TOTP authenticator app is configured. |
| `passkeys_count` / `passkeys_count_plural` | Status label showing number of registered passkeys (with `{{count}}` interpolation). |
| `return_to_account` | "Back to account" button label on MFA success pages. |
| `sign_out` | "Sign out" button label on the dashboard home page. |
| `field_given_name` | Row label for given name field. |
| `field_family_name` | Row label for family name field. |

**`profile` section**

| Key | Usage |
|-----|-------|
| `given_name_label` | Input label on the profile edit page. |
| `family_name_label` | Input label on the profile edit page. |

**`mfa` section**

| Key | Usage |
|-----|-------|
| `totp_manage_title` | Page title for the TOTP management/removal page. |
| `totp_manage_description` | Descriptive text on the TOTP management page. |
| `totp_remove` | "Remove" button label. |
| `totp_removed` | Toast message shown after successful TOTP removal. |
| `totp_remove_confirm_description` | Confirmation modal body text. |

---

### `commitlint.config.ts`

Commitlint is configured to follow the **Service Victoria (SV) Standard** (`@service-victoria/projen-templates` `Commitlint` component):

- `scope-case`: `pascal-case` — scopes must be PascalCase (e.g. `Core`, `Console`, `Schemas`).
- `header-max-length`: 100 characters (hardcoded; not CI-conditional).
- `subject-case`: `sentence-case` or `lower-case`.
- `type-enum`: upstream conventional types plus fork-specific `api` and `release`.
- `scope-enum`: allowed scopes (PascalCase) — `Connector`, `Console`, `Core`, `DemoApp`, `Test`, `Phrases`, `Schemas`, `Shared`, `Experience`, `ExperienceLegacy`, `Deps`, `DepsDev`, `Cli`, `Toolkit`, `Cloud`, `AppInsights`, `Elements`, `Translate`, `Tunnel`, `AccountElements`, `Account`, `Api`.

---

### `.github/workflows/build.yml`

PR builds run on both `linux/amd64` and `linux/arm64` natively (same runner matrix as the release workflow) with `cancel-in-progress: true` so stale builds are dropped when new commits are pushed. Images are pushed to GHCR with two tags:

| Tag | Example |
|-----|---------|
| `pr-<number>` | `pr-42` — always points to the latest commit in the PR |
| `sha-<short_sha>` | `sha-a1b2c3d` — specific commit |

No `release` environment gate or release-please dependency — just build and push.

### `.github/workflows/release.yml`

#### Multi-platform Docker builds (native matrix)

The release workflow builds `linux/amd64` and `linux/arm64` images in parallel on their respective GitHub-hosted runners (`ubuntu-latest` and `ubuntu-24.04-arm`) instead of using QEMU emulation. Each platform build pushes by digest; a `merge` job assembles the final multi-arch manifest list.

#### GitHub Releases with Conventional Commits changelog (`release-please`)

A `release-please` job (using `googleapis/release-please-action@v4`) runs on every push to `master`. It:

- Maintains a Release PR that accumulates conventional commit entries and bumps the version.
- When the Release PR is merged, publishes a GitHub Release with an auto-generated changelog.

Docker image tags are driven by the `release-please` job outputs:

| Scenario | Tags applied |
|----------|-------------|
| Every push to `master` | `sha-<hash>`, `edge` |
| Edge build with a pending Release PR | + `v<next>-rc.<run_number>` (e.g. `v1.1.0-rc.42`) |
| Release PR merged (release published) | + `v<version>`, `latest` |

The next version for RC tags is extracted from the release-please Release PR title (`chore: release X.Y.Z`).

Supporting config files:

- `.release-please-config.json` — `release-type: simple`; `changelog-sections` maps all commit types (including fork-specific `api` and `release` types) to labelled sections.
- `.release-please-manifest.json` — version manifest, starting at `0.0.0`.

---

---

### `packages/shared`

#### `generateCustomerId` (`src/utils/id.ts`)

Exports a new ID generator using `nanoid`'s `customAlphabet('0123456789', 10)`. Produces a random 10-digit string on every call. Used to generate `customer_id` values stored in `custom_data`.

---

### `packages/core`

#### Custom data claim configuration (`src/libraries/auto-custom-data-claims.ts`)

To facilitate fully mocking the SV IDAM instance, one key thing that it provides is a custom profile claim called `customer_id`, which is on the root of the ID token.

It's an auto-generated integer string, which is used for some internal tooling.

A new `AutoGeneratedCustomDataClaim` type and `autoGeneratedCustomDataClaims` list define `custom_data` keys that are auto-populated at user creation time. If a key is absent from the caller-supplied `customData`, `generate()` is called and the result is stored before the user record is inserted. Caller-supplied keys are never overwritten.

The default list contains one entry:

| Key | Generator | Storage |
|-----|-----------|---------|
| `customer_id` | `generateCustomerId()` — random 10-digit numeric string | `users.custom_data.customer_id` |

No database schema migration is required. Values live in the existing `custom_data` JSONB column. To add another auto-generated claim, append an entry to `autoGeneratedCustomDataClaims` in `src/libraries/auto-custom-data-claims.ts`.

#### User creation (`src/libraries/user.ts`)

`insertUser()` iterates `autoGeneratedCustomDataClaims` and merges any missing keys into `customData` before calling `insertUserQuery`.

---

## Upstream Compatibility Notes

- No database schema changes were made (all features use existing Logto API endpoints and `AccountCenterFieldControl` fields, plus the existing `custom_data` column for auto-generated claims).
- The `fields.profile` control value (`AccountCenterControlValue`) was already present in upstream Logto but unused in the account center. We now use it to gate `givenName`/`familyName` display and editing.
- `PATCH /api/my-account/profile` is an existing upstream endpoint; no backend changes were required.
- All ESLint rules (complexity, max-lines, import order, etc.) are satisfied — no rule suppressions were added.
