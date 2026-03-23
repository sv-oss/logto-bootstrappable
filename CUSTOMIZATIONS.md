# Logto Customizations

This document describes all changes made to the upstream [Logto](https://github.com/logto-io/logto) codebase in this fork. It is intended to make rebasing, upgrading, and onboarding easier by clearly separating custom work from upstream code.

## Overview

The primary addition is a **self-service management dashboard** built into the Account Center SPA (`packages/account`). This allows end-users to view and edit their own profile, security settings, and MFA options from a single page, gated by the existing `AccountCenterFieldControl` settings configured in the admin console.

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

Example output:
```json
{"level":"info","time":"2024-01-01T00:00:00.000Z","prefix":"index","message":"Core app is running at https://logto.example.com"}
{"level":"error","time":"2024-01-01T00:00:00.001Z","message":"Error: something broke","error":{"name":"Error","message":"something broke","stack":"Error: something broke\n    at ..."}}
```

Text output remains the default (no change to existing behaviour when `LOG_FORMAT` is unset).

---

### `packages/cli`

> Bootstrap configuration additions are documented in [BOOTSTRAP.md](./BOOTSTRAP.md).

---

### `packages/phrases-experience` in all 18 supported locales (English is the authoritative source; other locales carry English placeholders until translated):

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

## Upstream Compatibility Notes

- No database schema changes were made (all features use existing Logto API endpoints and `AccountCenterFieldControl` fields).
- The `fields.profile` control value (`AccountCenterControlValue`) was already present in upstream Logto but unused in the account center. We now use it to gate `givenName`/`familyName` display and editing.
- `PATCH /api/my-account/profile` is an existing upstream endpoint; no backend changes were required.
- All ESLint rules (complexity, max-lines, import order, etc.) are satisfied — no rule suppressions were added.
