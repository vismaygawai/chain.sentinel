# CHAIN.SENTINEL — Complete Codebase Inspection, Security Audit & Engineering Report

**Project:** CHAIN.SENTINEL  
**Repository:** https://github.com/vismaygawai/chain.sentinel  
**Author & Maintainer:** Vismay  
**Audit Branch:** `security/professional-codebase-audit`  
**Audit Date:** 2026-11-25  
**License:** MIT

---

## 1. Executive Summary

CHAIN.SENTINEL is a TypeScript `pnpm` monorepo implementing an autonomous multi-agent DeFi treasury security and Aave V3 liquidation defense platform. It comprises:
- `packages/agents-core`: Multi-agent workflows, deterministic risk scoring, protection planning, governance circuit breakers, sliding-window threat correlation, and EVM/Aave/price/RPC tools built on `@iqai/adk` and `ethers` v6.
- `apps/api`: Fastify 5 REST and WebSocket backend service exposing treasury scanning, WhaleWatch/LiquidShield monitoring registration, alert feeds, chain/price endpoints, and Agent Tokenization Platform (ATP) registration.
- `apps/web`: Next.js 16 (App Router) + React 18 + Tailwind CSS operations dashboard and landing interface.

This audit inspected every relevant source, configuration, CI/CD, script, and documentation file across the repository, eliminated all **CRITICAL** dependency vulnerabilities (`6 → 0`) and high-risk API/agent flaws, added automated offline unit and Fastify API integration test suites, streamlined `scripts/build-all.ts` to typecheck all workspaces cleanly before building, standardized authorship to **Vismay**, and rewrote `README.md` to match the verified implementation.

---

## 2. Repository Structure

```text
chain.sentinel/
├── .github/workflows/          # ci.yaml, lint.yaml
├── apps/
│   ├── api/                    # Fastify REST & WebSocket service + integration tests
│   └── web/                    # Next.js 16 operations console & UI components
├── packages/
│   └── agents-core/            # ADK-TS agents, workflows, policies, tools, memory & unit tests
├── docs/                       # ARCHITECTURE.md, API-DOCS.md, ATP-DEPLOYMENT.md, DEMO-SCRIPT.md, JUDGING-MAP.md, ROADMAP.md
├── scripts/                    # build-all.ts, check-node.js, clean.ts, deploy-atp.ts, export-codebase.ts, seed-demo-data.ts
├── .env.example                # Safe environment variable template
├── LICENSE                     # MIT License (Copyright (c) 2026 Vismay Gawai)
├── package.json                # Workspace root scripts, overrides, metadata
├── pnpm-lock.yaml              # Workspace lockfile
├── pnpm-workspace.yaml         # Workspace package boundaries
├── README.md                   # Rewritten comprehensive documentation
├── CODEBASE_AUDIT_REPORT.md    # This engineering audit report
├── render.yaml                 # Render deployment specification for apps/api
└── tsconfig.base.json          # Shared strict TypeScript config
```

---

## 3. Files Inspected

Every relevant source, config, workflow, script, and documentation file was read and reviewed:

| File Path | Purpose | Reviewed | Key Findings |
| :--- | :--- | :--- | :--- |
| `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.nvmrc`, `.npmrc`, `.gitignore`, `LICENSE` | Workspace manifests & config | Yes | Unused AI SDK root deps; `author: "WWHS?"`; license mismatch in subpackages |
| `.env.example`, `render.yaml` | Env template & Render config | Yes | Wildcard `CORS_ORIGIN=*` default; legacy team branding; `render.yaml` lacked `--frozen-lockfile` and `ATP_API_KEY` |
| `.github/workflows/ci.yaml`, `.github/workflows/lint.yaml` | GitHub Actions CI & Lint | Yes | `ci.yaml` missed `apps/web` typecheck, API tests, and used `/ws` instead of `/ws/feed` |
| `scripts/*` (`build-all.ts`, `check-node.js`, `clean.ts`, `deploy-atp.ts`, `export-codebase.ts`, `seed-demo-data.ts`) | Repo utility scripts | Yes | Unused `path` import & live RPC `test` call inside `build-all.ts`; legacy attribution in `export-codebase.ts` & `seed-demo-data.ts` |
| `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/local_db.json` | API manifest, TS config & local store | Yes | `fastify@5.8.2` vulnerable to body validation/URL bypasses; `ISC` license; `ES2020` target override |
| `apps/api/src/index.ts`, `server.ts`, `config/*`, `middlewares/errorHandler.ts` | Server boot, CORS, error handler | Yes | `origin: true` CORS reflection; no body limit or security headers; stack/RPC secret leakage risk |
| `apps/api/src/routes/*`, `controllers/scanController.ts`, `services/*`, `websocket/liveFeed.ts`, `types/api.ts` | HTTP routes, controllers, services, WS | Yes | Missing Fastify JSON schemas; non-hashed `timingSafeEqual`; WS lacked origin checks & client cap; `@ts-ignore` in `liveFeed.ts` |
| `apps/web/package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `tailwind.config.js`, `postcss.config.mjs` | Frontend build & styling configs | Yes | `next@16.0.7` had 4 CRITICAL RCE CVEs; missing security headers; no `author`/`license` metadata |
| `apps/web/src/app/*`, `components/*`, `hooks/*`, `lib/api.ts`, `types/index.ts` | Pages, components, hooks, API client | Yes | Duplicate formatters; nested `<Link><button>`; `<div onClick>` accessibility gap; fake "Simulated" success on HTTP failure; missing WS payload validation |
| `packages/agents-core/src/**/*` (all 39 source files) | Multi-agent core, workflows, tools, policies, memory, queues, schemas | Yes | Circular dynamic `import('../index.ts')`; non-atomic `local_db.json` writes; missing `HIGH` risk `<= $1M` fallback in `governanceAgent.ts`; empty-array bypass in `plannerAgent.ts`; string-unaware `extractJSON`; uncached RPC providers & secret leakage risk in errors |
| `docs/*` (`API-DOCS.md`, `ARCHITECTURE.md`, `ATP-DEPLOYMENT.md`, `DEMO-SCRIPT.md`, `JUDGING-MAP.md`, `ROADMAP.md`) | Technical & walkthrough docs | Yes | Legacy team/hackathon attribution; outdated API/WS payload examples in `API-DOCS.md` |

*(Binary image assets in `apps/web/public/*.png`, `*.ico`, `pnpm-lock.yaml`, and the auto-exported text dump `chain-sentinel-codebase.txt` were classified appropriately and not manually edited.)*

---

## 4. Files Modified & Created

### Created
- `packages/agents-core/src/lib/security.ts` — Secret redaction (`redactSecrets`), URL protocol validation (`assertSafeExternalUrl`), SHA-256 constant-time comparison (`constantTimeEqual`), and control-character sanitization (`sanitizeText`).
- `packages/agents-core/src/__tests__/core.test.ts` — 16 offline unit tests across 8 suites covering security helpers, JSON extraction, Aave debt math, queue prioritization, alert correlation, vector store, risk/planner/governance agents, cooldowns, and atomic persistence.
- `apps/api/src/__tests__/api.test.ts` — 4 Fastify `.inject()` integration & security tests covering health/chains endpoints, security headers, CORS non-reflection, strict schema rejection (`400`), and fail-closed ATP registration (`503`).
- `CODEBASE_AUDIT_REPORT.md` — This final engineering audit report.

### Modified
- Root & workspace manifests: `package.json`, `apps/api/package.json`, `apps/web/package.json`, `packages/agents-core/package.json`, `apps/api/tsconfig.json`, `pnpm-lock.yaml`.
- Config & CI/CD: `.env.example`, `render.yaml`, `.github/workflows/ci.yaml`.
- Build & utility scripts: `scripts/build-all.ts` (typecheck all 3 workspaces + Next.js production build, removing unused `path` import and live RPC dependency), `scripts/export-codebase.ts`, `scripts/seed-demo-data.ts`.
- Core engine (`packages/agents-core`): `src/lib/index.ts`, `src/database.ts`, `src/tools/rpcTools.ts`, `src/tools/defiTools.ts`, `src/tools/priceTools.ts`, `src/tools/treasuryTools.ts`, `src/tools/walletTools.ts`, `src/workflows/scanPositionWorkflow.ts`, `src/workflows/watchWalletWorkflow.ts`, `src/workflows/treasuryWorkflow.ts`, `src/agents/plannerAgent.ts`, `src/agents/governanceAgent.ts`, `src/agents/scannerAgent.ts`, `src/agents/wwGovernanceAgent.ts`.
- Backend API (`apps/api`): `src/config/env.ts`, `src/server.ts`, `src/index.ts`, `src/middlewares/errorHandler.ts`, `src/controllers/scanController.ts`, `src/routes/scan.ts`, `src/routes/atp.ts`, `src/services/atpService.ts`, `src/websocket/liveFeed.ts`.
- Frontend (`apps/web`): `next.config.ts`, `README.md`, `src/lib/api.ts`, `src/hooks/useLiveFeed.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`, `src/components/ActionList.tsx`, `src/components/PolicySelector.tsx`, `src/components/AlertPanel.tsx`, `src/components/PositionCard.tsx`, `src/components/WalletCard.tsx`.
- Documentation: `README.md`, `docs/API-DOCS.md`, `docs/ARCHITECTURE.md`, `docs/DEMO-SCRIPT.md`, `docs/JUDGING-MAP.md`.

---

## 5. Security Audit Methodology

The audit followed **OWASP Top 10 (2021)**, **OWASP ASVS**, **Node.js / Fastify / Next.js security best practices**, Web3 EVM interaction safety checks, and AI/LLM boundary hardening principles:
1. Static line-by-line code review of all backend, frontend, agent, and configuration modules.
2. Credential & secret pattern scanning across the repository.
3. Dependency vulnerability analysis using `pnpm audit --json`.
4. Dynamic verification of HTTP security headers, CORS behavior, schema validation, and fail-closed auth via Fastify `.inject()` integration tests and `node:test` unit tests.

---

## 6. Security Vulnerabilities Discovered & Vulnerability Severity

| ID | Severity | Category | Location | Summary |
| :--- | :--- | :--- | :--- | :--- |
| **V-01** | **CRITICAL** | Vulnerable Dependency | `apps/web/package.json` (`next@16.0.7`) | 4 critical RCE advisories (Image Optimization AVIF/SVG, `use cache` typed arrays, Windows RCE) + 6 high SSRF/DoS/Middleware bypass advisories |
| **V-02** | **CRITICAL** | Vulnerable Transitive Dependencies | `pnpm-lock.yaml` (`proxy-addr@2.0.7`, `protobufjs@7.5.4`) | IP spoofing via IPv4-mapped IPv6 in `proxy-addr` and arbitrary code execution advisory in `protobufjs` |
| **V-03** | **HIGH** | Broken Access Control / CORS Reflection | `apps/api/src/server.ts`, `env.ts`, `.env.example`, `render.yaml` | `CORS_ORIGIN=*` default combined with `origin: true` caused `@fastify/cors` to reflect any untrusted `Origin` header |
| **V-04** | **HIGH** | Framework Validation & Auth Bypasses | `apps/api/package.json` (`fastify@5.8.2`, `ws@8.19.0`, `find-my-way@9.5.0`) | Fastify Content-Type header leading-space schema bypass, malformed URL auth bypass, boolean schema bypass, HTTP/2 DoS, and `ws` memory exhaustion |
| **V-05** | **HIGH** | Missing Input Schemas & Unbounded State DoS | `apps/api/src/routes/scan.ts`, `atp.ts`, `server.ts`, `database.ts`, workflows | No JSON Schema validation or body limits; unauthenticated registration allowed unbounded growth of `local_db.json` and background RPC polling queues |
| **V-06** | **HIGH** | Secret / Internal Error Disclosure | `rpcTools.ts`, `defiTools.ts`, `walletTools.ts`, `scanController.ts`, `errorHandler.ts` | Raw `ethers`/fetch error messages containing Alchemy RPC URLs/API keys could propagate to logs and HTTP 500/502 error payloads |
| **V-07** | **HIGH** | Cross-Site WebSocket Hijacking & Unbounded WS | `apps/api/src/websocket/liveFeed.ts` | WebSocket endpoints accepted connections from any origin with no client cap or payload cap |
| **V-08** | **HIGH** | Governance Fallback Logic Gap & Prompt Output Bypass | `governanceAgent.ts`, `plannerAgent.ts` | `governanceAgent` lacked a deterministic fallback for `HIGH` risk when `totalUsdValue <= $1M` (returning blocked unrecognized state); `plannerAgent` accepted empty `actions: []` arrays; untrusted data in prompts lacked delimiting |
| **V-09** | **MEDIUM** | Missing Security Headers & Key-Length Timing Leak | `apps/api/src/server.ts`, `apps/web/next.config.ts`, `apps/api/src/routes/atp.ts` | Missing `nosniff`, `X-Frame-Options`, `CSP`, `Referrer-Policy`, `HSTS`; `timingSafeEqual` compared raw buffer lengths directly |
| **V-10** | **MEDIUM** | Race Conditions & Circular Unawaited Imports | `database.ts`, `scanPositionWorkflow.ts`, `watchWalletWorkflow.ts` | Non-atomic `writeFileSync` without locking risked JSON corruption; circular `import('../index.ts').then(...)` lacked error handling |
| **V-11** | **MEDIUM** | String-Unaware JSON Extraction & SSRF URL Check | `packages/agents-core/src/tools/treasuryTools.ts` | `extractJSON` miscounted `{`/`}` inside quoted string values; `QWEN_API_URL` lacked `http:`/`https:` scheme validation |
| **V-12** | **LOW** | Frontend Error Masking, Unencoded Query Params & Stale WS Validation | `apps/web/src/lib/api.ts`, `useLiveFeed.ts`, `ActionList.tsx` | Missing `encodeURIComponent`, silent "Simulated" fallback on HTTP errors, unvalidated WS payloads, missing fetch timeouts |

---

## 7. Vulnerabilities Fixed

- **V-01, V-02, V-04 (Dependencies):** Upgraded `next` & `eslint-config-next` to `16.4.6`, `fastify` to `^5.12.2` (`5.12.8`), `zod` to `^4.6.6` (`4.6.7`), removed unused `@ai-sdk/google`, `@ai-sdk/openai`, `ai` packages, and added `pnpm.overrides` for `proxy-addr`, `protobufjs`, `axios`, `socket.io-parser`, `fast-xml-parser`, `fast-xml-builder`, `hono`, `kysely`, `@grpc/grpc-js`, `@modelcontextprotocol/sdk`, `ws`, and `find-my-way`. All **6 CRITICAL** advisories are resolved (`0` remaining).
- **V-03 (CORS):** Replaced `origin: true` reflection with explicit allowlist parsing (`parseAllowedOrigins`), defaulted development CORS to `http://localhost:3000,http://127.0.0.1:3000`, and configured production to fail closed (`false`) unless `CORS_ORIGIN` is explicitly set.
- **V-05 (Validation & DoS Bounds):** Added `bodyLimit: 16384`, `ajv: { customOptions: { removeAdditional: false } }`, strict Fastify JSON schemas across `/api/risk-scan`, `/whale`, `/alerts`, `/position`, `/position/health`, and `/api/atp/register`, plus `MAX_PERSISTED_WALLETS = 100` cap and `429` handling.
- **V-06 (Secret Redaction & Safe Errors):** Added `redactSecrets()` across RPC, Aave, Alchemy, controller, and error handler paths; masked 5xx internal error messages and stack traces in production.
- **V-07 (WebSocket Hardening):** Added `Origin` verification against `CORS_ORIGIN` allowlists, `MAX_WS_CLIENTS = 100`, `maxPayload: 4096`, proper TypeScript types (removing `@ts-ignore`), and clean shutdown hook (`closeLiveFeed()`).
- **V-08 (AI/Governance Safety):** Added deterministic `HIGH` risk fallback for `<= $1M` treasuries in `governanceAgent.ts`, required `actions.length > 0` in `plannerAgent.ts`, bounded action counts/lengths, sanitized output text, and delimited untrusted data inside `<DATA>` blocks.
- **V-09 (Security Headers & Constant-Time Auth):** Added security headers to both Fastify (`onSend` hook) and Next.js (`headers()`), disabled `poweredByHeader`, and updated `/api/atp/register` to use SHA-256 `constantTimeEqual`.
- **V-10, V-11, V-12 (Concurrency, Parsing, Frontend):** Implemented serialized async write lock + atomic temp-file rename in `database.ts`, removed circular `import('../index.ts')`, fixed `extractJSON` string-literal brace tracking, validated `QWEN_API_URL`, added `AbortController` timeouts, `encodeURIComponent`, and WS schema validation in `apps/web`.

---

## 8. Remaining Security Risks

1. **Public Unauthenticated Scan & Monitoring Endpoints (`POST /api/risk-scan`, `POST /whale`, `POST /position`)**: These routes intentionally remain accessible without user authentication so the public dashboard works out of the box. Mitigations in place: strict EVM address schema validation, per-IP rate limiting (`15–20 req/min`), and `100`-entity capacity cap. For private institutional deployments, placing an auth proxy or `SENTINEL_API_KEY` middleware in front of write routes is recommended.
2. **Transitive Advisories in `@iqai/adk@0.8.1`**: `pnpm audit` still reports **49 high**, **41 moderate**, and **8 low** advisories (0 critical) originating primarily from transitive dependencies inside `@iqai/adk` (OpenTelemetry SDK, `drizzle-orm`, `engine.io`, `ws@8.19.0` peer constraints, `body-parser`) and ESLint/PostCSS dev tooling. Upgrading `@iqai/adk` when a newer upstream release ships will resolve these without forced incompatible overrides.
3. **In-Memory / Local File Storage**: `local_db.json` and the in-memory `LocalRedisMock` shim are single-instance only and unsuitable for horizontally scaled multi-worker production deployments.
4. **React 18 Deprecation Warning in Next.js 16**: `next@16.4.6` warns that React 18 support will be removed in Next.js 17. Upgrading React from `18.3.1` to `19.x` was intentionally deferred as a major dependency upgrade requiring separate compatibility verification.

---

## 9. Architecture & Code-Quality Improvements

- Removed circular module dependency between `workflows/` and `packages/agents-core/src/index.ts`.
- Refactored `scripts/build-all.ts` to typecheck all 3 workspaces (`agents-core`, `api`, `web`) before running `next build`, removing an unused `path` import and decoupling offline builds from live RPC smoke tests.
- Eliminated unused `ethers` import in `treasuryWorkflow.ts` and unused `@ai-sdk/google`, `@ai-sdk/openai`, and `ai` dependencies across root and `agents-core`.
- Standardized license metadata to `MIT` across all 4 `package.json` files and aligned `apps/api/tsconfig.json` target to `ES2022`.
- Added provider instance caching and 10s RPC call timeouts in `rpcTools.ts`, batch price fetching in `walletTools.ts`, and re-entrancy polling guard (`isPolling`) + clean shutdown stop handles across workflows.

---

## 10. Frontend Improvements

- Added security HTTP headers and `poweredByHeader: false` in `apps/web/next.config.ts`.
- Eliminated duplicate `truncateAddress` / `formatUSD` helpers across `AlertPanel.tsx`, `PositionCard.tsx`, and `WalletCard.tsx` by reusing `formatAddress` and `formatCompactUSD` from `@/lib/api`.
- Fixed invalid nested interactive HTML (`<Link><button>`) in `Navbar.tsx` and `page.tsx`, replaced clickable `<div>` in `PolicySelector.tsx` with semantic `<button type="button" aria-pressed>`, and added `aria-label` / `aria-pressed` attributes in `dashboard/page.tsx`.
- Replaced render-time `setState` in `ActionList.tsx` with trigger-identity comparison, and loaded persisted monitored workflows cleanly on mount in `dashboard/page.tsx`.

---

## 11. Backend & Blockchain Security Improvements

- Enforced strict canonical checksummed EVM address normalization (`ethers.getAddress`) across API controllers.
- Routed `fetchAaveUserAccountData` through `withResilientProvider` failover when no custom provider is supplied, avoiding single-point-of-failure hardcoded public RPC calls.
- Verified read-only Aave V3 contract interactions (`getUserAccountData` view call only; no private keys, seed phrases, or transaction-signing code exist anywhere in the codebase).
- Hardened `ActionList` UI simulation labeling so simulated actions are never misrepresented as live on-chain transactions.

---

## 12. Dependency Changes

- **Upgraded:** `next` (`16.0.7 → 16.4.6`), `eslint-config-next` (`16.0.7 → 16.4.6`), `fastify` (`^5.6.2 / 5.8.2 → ^5.12.2 / 5.12.8`), `zod` (`^4.1.13 / 4.3.6 → ^4.6.6 / 4.6.7`), `typescript` in root devDependencies (`^5.5.3 → ^5.9.3`).
- **Removed:** Unused `@ai-sdk/google`, `@ai-sdk/openai`, `ai` from root and `packages/agents-core`; moved `@iqai/adk`, `ethers`, `zod` out of root `package.json` (kept in `packages/agents-core` where used).
- **Overrides Added (`pnpm.overrides`):** `proxy-addr >=2.0.8`, `protobufjs >=7.5.6`, `axios >=1.16.0`, `socket.io-parser >=4.2.6`, `fast-xml-parser >=5.5.6`, `fast-xml-builder >=1.1.7`, `hono >=4.13.16`, `kysely >=0.28.17`, `@grpc/grpc-js >=1.14.4`, `@modelcontextprotocol/sdk >=1.26.0`, `fastify >=5.12.2`, `find-my-way >=9.7.0`, `ws >=8.21.0`, `zod >=4.6.6`.
- **Vulnerability Count Reduction:** `280` total (`6 critical, 114 high, 141 moderate, 19 low` in CLI summary) → **0 critical, 49 high, 41 moderate, 8 low** (`98` total in `pnpm-audit-final.json`).

---

## 13. Documentation & Authorship Standardization

- Rewrote `README.md` from scratch based strictly on verified repository files, scripts, endpoints, and environment variables.
- Updated `docs/API-DOCS.md`, `docs/ARCHITECTURE.md`, `docs/DEMO-SCRIPT.md`, `docs/JUDGING-MAP.md`, and `apps/web/README.md` for technical accuracy.
- Standardized sole project author and maintainer to **Vismay** across `package.json` files, `.env.example`, `apps/web` metadata/UI, scripts, and docs while preserving `LICENSE` (`Copyright (c) 2026 Vismay Gawai`) and third-party dependency attributions.

---

## 14. Verification: Tests, Typechecking, Linting & Production Build

All checks below were executed **after the final code edit**:

| Check | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Typecheck** | `pnpm typecheck` | **PASSED** | `agents-core`, `api`, and `web` (`tsc --noEmit`) all exited 0 with 0 errors |
| **Lint** | `pnpm lint` | **PASSED** | `apps/web` ESLint passed with 0 errors, 0 warnings |
| **Unit Tests (`agents-core`)** | `pnpm --filter agents-core test` | **PASSED** | **16 / 16 tests** across **8 suites** passed (offline, deterministic, `node:test`) |
| **API Integration Tests (`api`)** | `pnpm --filter api test` | **PASSED** | **4 / 4 tests** in **1 suite** passed via `Fastify.inject()` |
| **Production Build** | `pnpm build` | **PASSED** | `scripts/build-all.ts` typechecked all 3 workspaces and completed `next build` (Next.js 16.4.6 Turbopack; routes `/`, `/_not-found`, `/dashboard`) |
| **Dependency Audit** | `pnpm audit --json` | **0 CRITICAL** | Reduced from 6 critical / 280 total to **0 critical / 98 total** |
| **Live RPC Smoke Test** | `pnpm --filter agents-core test:live` | **NOT EXECUTED** | Not run to keep verification deterministic and offline; requires live Ethereum RPC |

---

## 15. Outstanding Limitations & Recommended Next Steps

1. **Replace `local_db.json` & `LocalRedisMock` with PostgreSQL (Prisma) and Redis:** Needed before multi-instance production scaling or persistent historical alert storage.
2. **Add Optional Write-Endpoint Auth (`SENTINEL_API_KEY`) & Proxy Trust Hardening:** If deploying the API publicly for private treasuries, gate `/whale`, `/position`, and `/api/risk-scan` with signed sessions or API keys.
3. **Plan React 19 Migration:** Upgrade `react` and `react-dom` from `18.3.1` to `19.x` in a dedicated PR before Next.js 17 drops React 18 support.
4. **Track Upstream `@iqai/adk` Releases:** Update `@iqai/adk` when upstream bumps OpenTelemetry, `drizzle-orm`, and `socket.io` to clear remaining transitive `HIGH` advisories.
5. **Add End-to-End Browser Tests (Playwright):** Exercise the `/dashboard` risk-scan flow against a running API test server in CI.
