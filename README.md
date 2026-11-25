# TruthLens AI — Media Forensics & Claim Verification Platform

TruthLens AI is a production-minded consumer verification platform for inspecting suspicious images, video, audio, and news claims. It presents explainable technical signals, provenance credentials, and source evidence to support human judgment.

> **Decision Support Notice:** TruthLens does not claim that models can conclusively determine truth or detect every deepfake. Outputs use calibrated language, method attribution, explicit evidence references, and known limitations.

---

## Architecture & Features

1. **Intake & Threat Boundaries:**
   - Image (JPEG, PNG, WebP), Video (MP4), Audio (MP3, OGG), Public URL, and Plaintext Claim verification.
   - Bounded uploads (50MB limit) with magic byte validation and safe decoding.
   - **SSRF Defense:** Outbound egress blocks RFC 1918 subnets, loopback, link-local, AWS/GCP cloud metadata (`169.254.169.254`), and enforces size and redirect limits.
   - **Prompt Injection Defense:** Webpage text is stripped of active scripts and sanitized into structured excerpts.

2. **Secure Key Management (SKM) Vault:**
   - Server-side AES-256-GCM envelope encryption (KEK wrapping DEK).
   - Zero-plaintext exposure: keys are never returned to the browser or written to logs.
   - Key versioning, rotation, and revocation controls.

3. **Staged Evidence Forensics Pipeline:**
   - **Stage 1 (Intake):** MIME signature validation and SHA-256 digest computation.
   - **Stage 2 (Metadata & Sensors):** EXIF header parsing and container analysis.
   - **Stage 3 (Provenance):** C2PA / Coalition for Content Provenance and Authenticity manifest detection.
   - **Stage 4 (Media Signals):** Discrete Cosine Transform (DCT) quantization block uniformity, spectral decay, and audio-visual coherence.
   - **Stage 5 (Source Retrieval):** Multi-source wire corroboration and fact-checking registry queries.
   - **Stage 6 (Synthesis):** Calibrated assessment band (`Supported`, `Mixed`, `Unverified`, `Contradicted`, `Insufficient evidence`).

4. **Calibrated UI & Accessibility:**
   - Dual theme support (refined dark theme default + light theme).
   - Meets WCAG 2.2 AA contrast standards, keyboard accessible, screen-reader status announcements.
   - Real-time Server-Sent Events (SSE) pipeline progress updates.
   - Traceable report export with cryptographically verifiable checksums.

---

## Local Development & Quickstart

### Prerequisites
- Node.js >= 20 (Node 22 or 26 recommended)
- npm or pnpm

### Setup
```bash
# Clone and enter directory
git clone <repo-url>
cd TruthLens

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run test suite (deterministic, zero external API keys needed)
npm test

# Run Next.js dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Offline / Demo Mode vs External AI

TruthLens is architected to run out of the box **without requiring paid third-party API credentials**:
- **Offline / Local Mode:** Runs complete cryptographic SHA-256 hashing, magic byte verification, EXIF parsing, C2PA manifest inspection, DCT block analysis, and curated wire registry verification.
- **External Processing Mode:** Configurable via Settings or `.env.local` using Google Gemini (`GEMINI_API_KEY`) as primary and OpenRouter (`OPENROUTER_API_KEY`) as secondary route. External processing is strictly gated behind user consent.

---

## API Endpoints

- `POST /api/v1/analyses` — Submit media file, URL, or claim (Multipart or JSON). Returns `202 Accepted`.
- `GET /api/v1/analyses` — List previous analyses with pagination and filters.
- `GET /api/v1/analyses/:id` — Inspect job status and stage milestones.
- `GET /api/v1/analyses/:id/result` — Get full calibrated assessment, media signals, claim findings, and citations.
- `GET /api/v1/analyses/:id/events` — Authenticated Server-Sent Events (SSE) stream for live stage updates.
- `POST /api/v1/analyses/:id/reports` — Generate immutable verification report certificate.
- `DELETE /api/v1/analyses/:id` — Cascading purge of database records and object storage files.
- `GET /api/v1/settings/providers/:provider` — Inspect SKM vault provider status.
- `PUT /api/v1/settings/providers/:provider` — Encrypt and store API key in SKM vault.
- `GET /health/live` & `GET /health/ready` — Production liveness and readiness probes.

---

## Required Production Infrastructure & Secrets

When deploying to production, configure the following secrets via your cloud secret manager (e.g., Google Secret Manager, AWS Secrets Manager, or Kubernetes Secrets):

| Variable | Description | Requirement |
|---|---|---|
| `SKM_MASTER_KEY` | 32-byte secret for master KEK envelope encryption | **Required** in production |
| `DATABASE_URL` | PostgreSQL connection string | Optional (falls back to persistent SQLite) |
| `GEMINI_API_KEY` | Google Gemini API key for primary AI routing | Optional (enables external Gemini vision/text) |
| `OPENROUTER_API_KEY`| OpenRouter API key for secondary fallback | Optional |
| `OBJECT_STORAGE_*` | S3 or GCS bucket credentials | Optional (falls back to local filesystem storage) |

---

## Testing & Quality Assurance

Run the test suite:
```bash
npm test
```

Build the production bundle:
```bash
npm run build
```
