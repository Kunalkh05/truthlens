# Product Requirements — TruthLens AI

## Product

TruthLens helps people inspect suspicious images, video, audio, and news claims. It presents explainable signals and source evidence so users can make informed judgments. It is decision support, not a forensic certification service or a substitute for newsroom/legal expertise.

## Users and jobs

- Everyday reader: “What can I verify about this clip or claim?”
- Journalist/researcher: compare provenance, source statements, and technical signals; export a traceable report.
- Workspace admin: manage access, retention, provider keys, quotas, and audit history.

## Core journeys

1. Landing → choose upload, URL, or text claim → review privacy and supported formats → submit.
2. Queued/processing → see stage, progress, and cancel/delete affordance → recover from provider failure.
3. Results → concise assessment band, confidence/coverage explanation, evidence timeline, source citations, media signals, limitations, and next steps.
4. History → search and reopen permitted analyses; delete an item and its derivatives.
5. Settings → account/workspace controls, retention, provider status, and secret configuration status (never reveal key values).

## Functional requirements

- Support image, video, audio, public URL, and text claim intake. Validate MIME by content, size/duration limits, safe decoding, and URL schemes; reject unsupported, encrypted, malformed, or oversized inputs with actionable errors.
- Provide asynchronous job status and idempotent submissions. Show stage-level progress, cancellation where safe, retry rules, and partial results.
- Persist immutable original digest, source/provenance metadata, normalized claim, per-stage findings, citations, model/provider/version, timestamps, and user-visible limitations.
- Results must separate media authenticity signals from factual claim verification. A real image may accompany a false claim; synthetic media can contain true information.
- Show source diversity, publication time, primary-source status, corroboration/contradiction, and citation links. Do not use raw engagement or search rank as truth.
- Allow report export with provenance, method/version, evidence references, timestamps, uncertainty, and disclaimer.
- Support account isolation, role-based workspace access, quotas, audit records, retention/deletion, and accessible user feedback.

## Nonfunctional requirements

Responsive and keyboard accessible; support WCAG 2.2 AA target. Encrypt transport and stored sensitive data. Use least privilege, bounded uploads, rate limits, structured redacted logs, resilient queues, observability, and documented recovery. Define targets in deployment config; initial objectives: API p95 under 500 ms excluding analysis, upload feedback under 1 s, and analysis progress updates at least every 5 s while active.

## Scope boundaries

No claim of perfect deepfake detection, guaranteed truth labels, facial identity recognition, covert surveillance, biometric database, automated takedowns, or public accusation. Human review is required for high-impact editorial or legal decisions. Initial rollout supports one deployment region and configurable providers; architecture must avoid hard coupling to one cloud.
