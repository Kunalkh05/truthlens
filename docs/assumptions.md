# TruthLens AI — Assumptions and Architecture Decisions

This document records the design assumptions, domain decisions, and deployment choices made for the TruthLens AI implementation in accordance with `MASTER_HARNESS.md`, `PRD.md`, `UI_UX.md`, `ARCHITECTURE.md`, `API_DATA.md`, and `OPERATIONS.md`.

## 1. Stack and Runtime
- **Runtime**: Node.js (>=20, current v26.8) with TypeScript.
- **Framework**: Next.js 15 (App Router) + React 19 + Tailwind CSS + Lucide Icons + Radix UI primitives.
- **Persistence**: Relational database engine using SQLite (`better-sqlite3` or robust embedded SQL engine) with an interchangeable PostgreSQL driver adapter for production (`DATABASE_URL`). Includes schema migrations, foreign keys, indexes, and full support for the 10 core entities in `API_DATA.md`.
- **Object Storage**: Pluggable storage abstraction supporting Local Filesystem storage for dev/test (`storage/uploads` and `storage/derivatives`) and S3/GCS compatible blob storage for production.
- **Queue/Worker**: Resilient background job queue with concurrency control, stage transitions, event emission for SSE (`/v1/analyses/:id/events`), bounded retries, and cancellation support.

## 2. Security Boundaries & Threat Defense
- **SKM Vault**: Server-side AES-256-GCM authenticated envelope encryption. Encryption keys (`KEK`) never touch the database or client. Supports key versioning, rotation, tenant isolation, and audit events.
- **SSRF Defense**: Strict outbound HTTP egress filter that blocks loopback, RFC 1918 private subnets, link-local (169.254.0.0/16 including AWS/GCP metadata), IPv6 localhost/link-local, validates redirects recursively, and limits response size/time.
- **Prompt Injection Defense**: Ingested webpage snippets and user claims are treated as untrusted data strings, wrapped in boundary delimiters, sanitized, and extracted as structured schema data only.
- **Input Validation & Sandboxing**: Strict file size (max 50MB for demo/dev), MIME verification using magic byte signatures, safe metadata stripping/decoding, and denial of executables/polyglots.

## 3. Product Invariants & Calibrated Assessment
- Outputs never use definitive accusatory labels ("Fake", "Deepfake guaranteed", "Guilty").
- Calibrated assessment bands: `Supported`, `Mixed`, `Unverified`, `Contradicted`, `Insufficient evidence`.
- Strict separation of Media Authenticity signals (provenance, compression, visual/audio consistency) from Factual Claim Verification (source diversity, timestamps, corroboration/contradiction).
- Traceable provenance and exportable verification reports with method versions and explicit limitations.

## 4. Provider Routing
- **Primary**: Google Gemini API (`GEMINI_API_KEY`).
- **Secondary**: OpenRouter API (`OPENROUTER_API_KEY`).
- **Local/Offline Mock Provider**: Deterministic offline provider for CI, automated tests, and offline demo mode, guaranteeing that CI runs without paid external credentials.
