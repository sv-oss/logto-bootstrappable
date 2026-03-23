# Copilot Instructions for Logto

Logto is an open-source identity and access management platform (OIDC/OAuth 2.1/SAML) with multi-tenancy, built as a pnpm monorepo.

> **This is a fork.** Always read `CUSTOMIZATIONS.md` before making changes to understand what is custom vs upstream. Fork-specific additions are documented there. Bootstrap behaviour is documented in `BOOTSTRAP.md`. Please always update one or both of those files with your changes.

## Prerequisites

- Node.js ^22.14.0, pnpm ^9.0.0 || ^10.0.0, PostgreSQL ^14.0

## Build, Lint, and Test Commands

### Root-level commands

```bash
pnpm i && pnpm prepack         # Install deps + build workspace packages (required first time)
pnpm dev                        # Start all packages in parallel with watch mode
pnpm ci:build                   # Build all packages
pnpm ci:lint                    # ESLint all packages in parallel
pnpm ci:stylelint               # Stylelint all SCSS in parallel
pnpm ci:test                    # Run all tests with coverage
```

### Per-package commands

Run from the package directory, or from root with `pnpm --filter <package> <script>`.

**Core (backend):**

```bash
pnpm build                      # tsup bundle
pnpm dev                        # tsup watch mode
pnpm test                       # Build for test + run Jest
pnpm test:only                  # Run Jest without rebuilding
pnpm test:only -- --testPathPattern='user' # Run a single test file by pattern
pnpm lint                       # ESLint
```

**Console / Experience / Account (React SPAs):**

```bash
pnpm build                      # Vite build
pnpm dev                        # Vite dev server
pnpm test                       # Jest
pnpm test -- --testPathPattern='hook' # Run a single test file by pattern
pnpm lint                       # ESLint
pnpm stylelint                  # Stylelint SCSS
```

**Schemas:**

```bash
pnpm build                      # Generate types + compile + build alterations
pnpm test                       # Vitest
pnpm test -- src/path/to/file   # Run a single test file
```

**`@logto/shared`** uses **Vitest** (not Jest):

```bash
pnpm test -- src/node/env/ConsoleLog.test.ts --reporter=verbose  # Run a single test file
```

**Integration tests** (requires running Logto instance + Postgres):

```bash
pnpm build && pnpm test:api     # API integration tests
pnpm test:experience            # UI experience tests
pnpm test:console               # Console UI tests
```

### Database management

```bash
pnpm cli db seed                # Seed database (requires DB_URL in .env)
pnpm cli db seed --swe          # Seed + run bootstrap (skip-when-exists: only runs on first init)
pnpm alteration deploy          # Deploy pending schema migrations
```

## Architecture

### Monorepo structure

This is a **pnpm workspace** monorepo (no Turborepo/Nx). Workspaces are defined in `pnpm-workspace.yaml`: `packages/*`, `packages/toolkit/*`, and `packages/connectors/*`.

### Core packages

- **`packages/core`** — Koa-based backend server: OIDC provider, REST API, multi-tenancy router. Uses `@silverhand/slonik` for type-safe PostgreSQL queries, `koa-router` for routing, and `zod` for request/response validation.
- **`packages/console`** — React 18 admin SPA (Vite, SCSS modules, React Hook Form, SWR for data fetching). See `packages/console/CONVENTION.md` for UI component organization rules.
- **`packages/experience`** — React 18 end-user sign-in/register SPA (Vite, SCSS modules). Runs within OIDC interaction flow context.
- **`packages/account`** — React 18 account center SPA.
- **`packages/schemas`** — Single source of truth for database table definitions (SQL in `tables/`), TypeScript types, Zod guards, and migration scripts (`alterations/`).
- **`packages/phrases`** / **`packages/phrases-experience`** — i18n translation strings (18+ languages).
- **`packages/cli`** — CLI for database setup, migrations, and connector management.

### Toolkit (shared libraries)

- **`@logto/connector-kit`** — Interfaces and utilities all connectors must implement.
- **`@logto/core-kit`** — OIDC scope/claim constants, shared types.
- **`@logto/language-kit`** — Language tag definitions and metadata.
- **`@logto/shared`** — Cross-package utilities including the `ConsoleLog` class used everywhere for logging.

### Connectors (50+)

Each connector in `packages/connectors/` implements `SocialConnector`, `EmailConnector`, or `SmsConnector` from `@logto/connector-kit`. Connector `package.json` files are auto-synced from `packages/connectors/templates/` on install — don't edit shared fields directly in individual connectors.

**Fork-specific connectors:**

- **`connector-smtp`** (`simple-mail-transfer-protocol`) — Standard SMTP email connector. Config fields include `host`, `port`, `auth` (`{ user, pass }`), `fromEmail`, `replyTo`, `secure`, `ignoreTLS`, `requireTLS`, `tls`, `debug`, `logger`, `templates`.
- **`connector-smtp-sms`** (`smtp-sms`) — Custom email-to-SMS gateway connector. Same SMTP fields plus `toEmailTemplate` (e.g. `{{phoneNumberOnly}}@txt.att.net`) and `subject`. Supports `{{phoneNumberOnly}}` (digits only) and `{{phone}}` (raw E.164) placeholders.

### Backend (core) architecture

```
packages/core/src/
├── routes/          # API endpoints (receive router + TenantContext)
├── middleware/       # Koa middleware (auth, validation, audit, error handling)
├── libraries/       # Business logic services (scoped per tenant)
├── queries/         # Database query builders (Slonik SQL templates)
├── tenants/         # Multi-tenant context (Tenant, TenantContext, Libraries, Queries)
├── oidc/            # OIDC provider configuration
└── database/        # Low-level DB utilities (insert-into, update-where, etc.)
```

**Request flow:** Route → `koa-guard` middleware (Zod validation) → handler → library → query → Slonik/PostgreSQL.

**Multi-tenancy:** Domain-based tenant routing. Each tenant gets isolated context with its own libraries, queries, and OIDC provider instance.

**HTTP request logging:** Each request gets a unique `nanoid(16)` request ID. A `ConsoleLog` instance with the ID as prefix is attached to `ctx.console` and the ID is echoed in the `Logto-Core-Request-Id` response header. The `koa-logger` transporter calls `consoleLog.plain(string)` and skips static file requests in development.

### Database schema system

SQL table definitions live in `packages/schemas/tables/*.sql`. Init order is controlled by `/* init_order = N */` comments. Lifecycle hooks: `_before_all.sql`, `_after_all.sql`, `_after_each.sql`.

**Migrations** (alterations) in `packages/schemas/alterations/` are versioned files (e.g., `1.37.0-1768758295-add-user-geo-location.ts`). They support bidirectional `up`/`down` operations. Deploy with `pnpm alteration deploy`.

### Frontend SPA architecture

Both console and experience follow this pattern:

- `src/pages/` — Route-matched page components
- `src/components/` — Shared business components
- `src/hooks/` — Custom React hooks
- `src/contexts/` or `src/Providers/` — React context providers
- Path alias: `@/` maps to `src/`
- Styling: SCSS modules (`.module.scss`)

## Fork-Specific Features

### Bootstrap system (`packages/cli/src/commands/database/seed/bootstrap*.ts`)

A zero-click setup system that runs during `pnpm cli db seed --swe` (skip-when-exists). All data is created in a single database transaction on first initialisation. Full documentation in `BOOTSTRAP.md`.

**Files:**

- `bootstrap.ts` — Orchestrator
- `bootstrap-config.ts` — Type definitions (`SmtpConfig`, `SmtpSmsConfig`, `AdminConfig`, `M2mConfig`, `AppConfig`, `SignInExperienceConfig`, `MfaConfig`) and env var parsers (`getSmtpConfig`, `getSmtpSmsConfig`, etc.)
- `bootstrap-connectors.ts` — `bootstrapSmtpConnector`, `bootstrapSmtpSmsConnector`
- `bootstrap-sign-in.ts` — Sign-in experience configuration
- `bootstrap-users.ts` — User seeding from CSV/JSON file

**Key env vars (all optional unless stated):**

| Group | Variable | Notes |
|-------|----------|-------|
| Admin | `LOGTO_ADMIN_USERNAME` ✱ | Required to trigger admin creation |
| Admin | `LOGTO_ADMIN_PASSWORD` ✱ | |
| Admin | `LOGTO_ADMIN_EMAIL` | |
| M2M | `LOGTO_M2M_APP_NAME` ✱ | All three required to trigger M2M app creation |
| M2M | `LOGTO_M2M_CLIENT_ID` ✱ | max 21 chars |
| M2M | `LOGTO_M2M_CLIENT_SECRET` ✱ | |
| OIDC App | `LOGTO_APP_NAME` ✱ | All five required to trigger app creation |
| OIDC App | `LOGTO_APP_CLIENT_ID` ✱ | max 21 chars |
| OIDC App | `LOGTO_APP_CLIENT_SECRET` ✱ | |
| OIDC App | `LOGTO_APP_REDIRECT_URIS` ✱ | Comma-separated |
| OIDC App | `LOGTO_APP_POST_LOGOUT_REDIRECT_URIS` | Comma-separated |
| SMTP | `LOGTO_SMTP_HOST` ✱ | All five required to trigger SMTP connector |
| SMTP | `LOGTO_SMTP_PORT` ✱ | |
| SMTP | `LOGTO_SMTP_USERNAME` ✱ | |
| SMTP | `LOGTO_SMTP_PASSWORD` ✱ | |
| SMTP | `LOGTO_SMTP_FROM_EMAIL` ✱ | |
| SMTP | `LOGTO_SMTP_REPLY_TO` | |
| SMTP | `LOGTO_SMTP_SECURE` | `true`/`false`, default `false` |
| SMTP | `LOGTO_SMTP_IGNORE_SSL` | `true`/`false` — sets Nodemailer `ignoreTLS` |
| SMTP | `LOGTO_SMTP_DEBUG` | `true`/`false` — sets Nodemailer `debug` + `logger` |
| SMTP SMS | `LOGTO_SMTP_SMS_HOST` ✱ | All six required to trigger SMS connector |
| SMTP SMS | `LOGTO_SMTP_SMS_PORT` ✱ | |
| SMTP SMS | `LOGTO_SMTP_SMS_USERNAME` ✱ | |
| SMTP SMS | `LOGTO_SMTP_SMS_PASSWORD` ✱ | |
| SMTP SMS | `LOGTO_SMTP_SMS_FROM_EMAIL` ✱ | |
| SMTP SMS | `LOGTO_SMTP_SMS_TO_EMAIL_TEMPLATE` ✱ | e.g. `{{phoneNumberOnly}}@txt.att.net` |
| SMTP SMS | `LOGTO_SMTP_SMS_SUBJECT` | |
| SMTP SMS | `LOGTO_SMTP_SMS_SECURE` | |
| SMTP SMS | `LOGTO_SMTP_SMS_IGNORE_SSL` | |
| SMTP SMS | `LOGTO_SMTP_SMS_DEBUG` | |
| Sign-in | `LOGTO_SIGN_IN_IDENTIFIER` | `email` or `username` (default) |
| Sign-in | `LOGTO_BOOTSTRAP_SIGNIN_EXPERIENCE` | `true` to auto-configure dark mode + name collection |
| MFA | `LOGTO_MFA_FACTORS` | Comma-separated: `totp`, `webauthn`, `backupCode`, `emailVerificationCode`, `phoneVerificationCode` |
| Users | `LOGTO_SEED_USERS_FILE` | Absolute path to `.json` or `.csv` |
| Phone | `LOGTO_DEFAULT_PHONE_COUNTRY_CODE` | e.g. `AU` |

When adding new bootstrap env vars, follow the pattern in `bootstrap-config.ts`:

1. Add a field to the relevant `*Config` type with a JSDoc comment referencing the env var name.
2. Read it with `getEnv('LOGTO_...')` (string) or `yes(getEnv('LOGTO_...'))` (boolean) in the config getter.
3. Spread it conditionally into the connector/record object in `bootstrap-connectors.ts` (use `...(value ? { key: value } : {})` for optional fields).
4. Document it in `BOOTSTRAP.md`.

### JSON structured logging (`packages/shared` — `ConsoleLog`)

`ConsoleLog` is the single logging class used across all packages. Set `LOG_FORMAT=json` to switch all output to newline-delimited JSON.

**JSON line shape:**

```json
{ "level": "info|warn|error|fatal|plain", "time": "<ISO8601>", "message": "<string>", "prefix": "<string, if set>", "error": { "name": "...", "message": "...", "stack": "..." } }
```

- ANSI escape codes are stripped from all string args in JSON mode.
- Objects are `JSON.stringify`'d inline in `message`; `Error` instances are expanded to `name: message` in the message and separately in `error`.
- `static get jsonOutput()` is a getter (not a readonly static) so that tests can override `process.env.LOG_FORMAT` at runtime.
- Text output (coloured chalk prefixes) is the default when `LOG_FORMAT` is unset.

**Levels by method:**

| Method | Text mode | JSON `level` |
|--------|-----------|-------------|
| `plain()` | raw `console.log` | `"plain"` |
| `info()` | blue `info` prefix | `"info"` |
| `succeed()` | blue `info` + green `✔` | `"info"` |
| `warn()` | yellow `warn`, `console.warn` | `"warn"` |
| `error()` | red `error`, `console.error` | `"error"` |
| `fatal()` | red `fatal`, exits with code 1 | `"fatal"` |

There is **no configurable log level filter** — all messages are always emitted.

### `EnvSet` / `GlobalValues`

`packages/core/src/env-set/` reads all runtime env vars for the core server (endpoints, multi-tenancy flags, database URL, pool sizes, etc.) via `GlobalValues`. Notable flags:

- `isProduction` — controls static file log filtering in `koa-logger`
- `isDomainBasedMultiTenancy` — controls domain-based tenant routing
- `TRUST_PROXY_HEADER` — set to `true` on Render / behind a reverse proxy
- `APPLICATIONINSIGHTS_CONNECTION_STRING` — enables Azure Application Insights telemetry

### Deployment

- **`docker-compose.yml`** — local development with Postgres
- **`render.yaml`** — Render.com production deployment (`TRUST_PROXY_HEADER=true`, `ALL_YES=1`)
- **`Dockerfile`** — production image; `DEV_FEATURES_ENABLED` build arg controls experimental features

## Key Conventions

### Commit messages

Conventional Commits enforced via commitlint. Allowed types: standard conventional types plus `api` and `release`. Scopes: `connector`, `console`, `core`, `experience`, `schemas`, `phrases`, `cli`, `toolkit`, `elements`, `account`, `shared`, `deps`, `deps-dev`, `test`, `translate`, `tunnel`, `account-elements`, `demo-app`, `experience-legacy`, `cloud`, `app-insights`, `api`. Header max 110 chars in CI.

### API route pattern (core)

Routes use `koa-guard` for Zod-based request/response validation. Route functions receive `(router, tenantContext)`. Router types: `AnonymousRouter`, `ManagementApiRouter`, `UserRouter`. OpenAPI docs are co-located as `.openapi.json` files alongside route files.

### Database queries (core)

Use `@silverhand/slonik` SQL template literals — never string concatenation. Queries return fully typed results. Pattern: `pool.one<Type>(sql\`SELECT ...\`)`.

### Console UI conventions (packages/console/CONVENTION.md)

- `ds-components/` for design system components, `components/` for business components.
- Flatten sub-pages in the parent page folder. Use `tabs/`, `hooks/`, `utils/` subfolders for complex pages.
- Page-specific components go in that page's `components/` subfolder.
- Use a folder when a component has more than one file (e.g., `index.tsx` + `index.module.scss`).
- Always fetch remote data before initializing React Hook Form (`useForm({ defaultValues: data })`).
- Convert nullable backend fields to empty values before setting as form defaults to avoid false dirty states.

### i18n (phrases)

Translation keys must not contain dots (`.`) — they break custom phrase editing in the console. English (`en`) is the default/fallback language.

### Silverhand ecosystem

This repo uses `@silverhand/*` packages for shared config: `eslint-config`, `eslint-config-react`, `ts-config`, `ts-config-react`, `slonik`, `essentials`. Don't add competing configs.

### Module system

All packages use ESM (`"type": "module"`). Internal cross-package references use `workspace:^`. Published packages are versioned via Changesets — core packages (`@logto/core`, `@logto/api`, `@logto/cli`, `@logto/create`, `@logto/schemas`) are released as a fixed group.

### Linting

ESLint with `@silverhand/eslint-config` (backend) or `@silverhand/eslint-config-react` (frontend). Stylelint for SCSS. Both auto-fix on pre-commit via lint-staged + husky.
