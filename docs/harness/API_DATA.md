# API Contracts and Data Model

Use versioned JSON REST endpoints (or preserve an existing repository convention), OpenAPI as source of truth, strict request/response schemas, UTC ISO-8601 timestamps, opaque IDs, pagination, and consistent errors. Never include secret values or raw private media in ordinary API responses.

## Endpoints

- `POST /v1/analyses` — multipart upload or JSON `{inputType, url?, claim?, retentionDays?, externalProcessingConsent}`. Return `202 {id,status,createdAt}`. Require idempotency key; enforce limits and ownership.
- `GET /v1/analyses/{id}` — status, stage, timestamps, partial findings, and safe error code.
- `GET /v1/analyses/{id}/result` — assessment, coverage, separate media findings and claim findings, evidence references, citations, methods, limitations, provider/model versions, and completion time.
- `GET /v1/analyses/{id}/events` — authenticated SSE or polling-compatible progress events; no secret/provider prompt content.
- `DELETE /v1/analyses/{id}` — `202` deletion workflow status; idempotent.
- `GET /v1/analyses` — cursor pagination, filters, tenant-scoped metadata only.
- `POST /v1/analyses/{id}/reports` — generate a traceable report; return short-lived download URL.
- `GET/PUT/DELETE /v1/settings/providers/{provider}` — status and credential management. Write secret once; response never includes it.
- `GET /health/live`, `GET /health/ready` — liveness/readiness without sensitive diagnostics.

## Common error

`{error:{code,message,requestId,retryable,details?}}`. Use 400 schema/format, 401 unauthenticated, 403 unauthorized, 404 absent or inaccessible, 409 idempotency/state conflict, 413 upload too large, 415 unsupported media, 422 invalid content, 429 quota, 503 dependency unavailable. Avoid leaking whether another tenant's resource exists.

## Core entities

- `users(id, auth_subject, created_at, status)`
- `workspaces(id, name, created_at, retention_policy)`
- `workspace_members(workspace_id, user_id, role, created_at)` unique workspace/user
- `analyses(id, workspace_id, owner_id, status, input_type, original_object_key, original_sha256, source_url, claim_text, consent_external, created_at, updated_at, completed_at, delete_after)`
- `analysis_stages(id, analysis_id, name, status, started_at, finished_at, attempt, safe_error_code)`
- `artifacts(id, analysis_id, parent_artifact_id, object_key, sha256, media_type, kind, tool_name, tool_version, created_at, delete_after)`
- `findings(id, analysis_id, domain, finding_type, label, score nullable, calibration_ref nullable, explanation, evidence_refs JSON, provider, model, version, created_at)`
- `sources(id, analysis_id, url, canonical_url, publisher, title, published_at, updated_at, accessed_at, excerpt, source_type, retrieval_metadata JSON)`
- `citations(id, finding_id, source_id, relation, excerpt_hash, locator)`
- `provider_secrets(id, workspace_id nullable, provider, label, ciphertext, nonce, wrapped_dek, kek_id, key_version, status, created_at, rotated_at)`
- `audit_events(id, workspace_id, actor_id, action, resource_type, resource_id, metadata_redacted JSON, created_at)`

Use foreign keys, indexes on tenant/time/status, uniqueness for idempotency scoped to actor, encrypted sensitive columns, migrations with rollback strategy, and retention-aware cleanup. Store model/provider raw payloads only when essential, minimized, access-controlled, and time-limited; default to redacted structured fields. Never store plaintext secrets. Define JSON schemas and constraints in migration/OpenAPI; adapt names/types to chosen database.
