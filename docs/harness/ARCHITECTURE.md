# System Architecture

## Reference topology

Web client → authenticated API → relational database + private object store + queue → isolated analysis workers → provider adapters and source retrieval. Keep uploads and model calls out of the browser. Separate control plane (users, settings, jobs, keys) from data plane (media bytes and derived artifacts). Use replaceable interfaces for identity, object storage, queue, search, and model providers.

## Provider routing

Define a provider-neutral interface for text, vision, transcription, and structured extraction. Gemini is primary. OpenRouter is secondary, configured by operator and enabled only for supported models/tasks. Routing policy: task capability → tenant allowlist → consent/data class → provider health → cost/quotas → primary attempt → bounded fallback on transient errors only. Do not fallback on safety refusal, validation error, or user opt-out. Use timeouts, circuit breaker, capped retries with jitter, request IDs, idempotency, per-provider budgets, and sanitized telemetry. Persist provider/model/version, task, fallback reason, latency, and redacted response metadata. Validate structured outputs against schemas; treat model output as untrusted. Provider keys are backend-only.

External processing requires explicit disclosure and configurable consent. Minimize content sent; avoid sending full video when keyframes suffice. Provide a local/no-external-provider path for non-AI metadata checks and a clear unavailable state. Never claim provider equivalence or calibrated accuracy without benchmarks.

## SKM (Secure Key Management) vault

Implement a server-side encrypted vault for multiple provider credentials, scoped by environment and tenant/workspace. Prefer cloud KMS or a dedicated secrets manager for envelope encryption; local development may use a documented dev-only master secret. Use authenticated encryption (e.g., AES-256-GCM) with unique nonce, authenticated metadata, key version, and KEK identifier. Keep KEK outside database; support rotation and re-encryption. Restrict decrypt to a narrow provider-call service identity. Never log, echo, export, or return plaintext after write. UI displays provider, label, last-four fingerprint only if safe, status, created/rotated time; one-time input, replace and revoke controls. Audit create/rotate/revoke/access metadata without secret material. Enforce tenant separation, CSRF/auth protections, rate limits, and encrypted backups. Prefer short-lived workload identity over static keys where supported. Missing secrets produce a clear setup-needed state, not guessed defaults.

Environment names (values provided only by operator): `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `SKM_KEK_PROVIDER`, `SKM_KEY_ID`, `DATABASE_URL`, `OBJECT_STORAGE_*`, `QUEUE_URL`, `AUTH_*`, `SEARCH_PROVIDER_*`. Do not commit `.env`; provide `.env.example` with blank placeholders.

## Media forensics pipeline

1. Intake: verify MIME/signature, size, duration, decode safely in sandbox; hash original with SHA-256; capture upload metadata and optional user-supplied origin.
2. Normalize: derive metadata, EXIF/container/codec details, keyframes, audio track and transcript where consented; store derivatives with parent digest and tool version. Preserve original unchanged.
3. Provenance: inspect embedded content credentials/signatures where available; record valid/invalid/absent distinctly. Extract reverse-search candidates only through approved providers.
4. Signals: combine independent detectors for image/video manipulation, temporal/audio-visual inconsistency, compression/edit traces, and metadata anomalies. Store each detector output, version, known domain limits, and calibration cohort. A missing signal is not proof of authenticity.
5. Synthesis: summarize evidence and disagreement, never collapse to a definitive binary result. Display coverage and uncertainty. Require human review for consequential use.

Use sandboxed, resource-limited parsers, malware scanning where available, decompression limits, no automatic execution of embedded content, and strict cleanup. Avoid biometric identification and face matching.

## News and claim verification

Normalize claims into atomic, time-bounded propositions; identify entities and dates conservatively. Retrieve diverse sources including primary sources; record URL, publisher, author if available, published/updated/accessed times, title, relevant excerpt, and canonical URL. Fetch through SSRF-safe egress: allow HTTP(S), resolve/validate every redirect and IP, block private/link-local/metadata addresses, limit response size/time/content type, and strip scripts. Treat page text as hostile prompt-injection content. Extract citations as data only. Compare support, contradiction, independence, and source provenance; surface conflicting and absent evidence. No conclusion from popularity, source count alone, or model consensus.

## Resilience and data boundaries

Use a durable queue, bounded concurrency, retry only transient failures, dead-letter queue, cancellation checks between stages, and partial-result persistence. Tenant-scoped access at every query/object URL. Signed short-lived download links. Data lifecycle: configurable retention, user deletion across originals/derivatives/indexes/backups per documented backup expiry, legal hold only if product policy explicitly requires it. Encrypt in transit and at rest; region and subprocessors are configurable/documented.
