# TruthLens Cloudflare API

This Worker provides the app's versioned API with D1, a private R2 bucket, and a Cloudflare Queue. Provider keys are Worker secrets and are never returned to the browser or stored in D1.

Live endpoint: `https://truthlens-api.truthlens-ai.workers.dev`.

## Local run

1. Install project dependencies from the repository root with `npm install`.
2. Copy `workers/api/.dev.vars.example` to `workers/api/.dev.vars` and set `APP_API_TOKEN` to a random value of at least 32 characters. Provider keys may be omitted for metadata-only tests.
3. Apply the local D1 migration with `npm run cf:migrate:local`.
4. Start the Worker with `npm run cf:dev`.
5. Check `/health/live` and `/health/ready`. API routes require the bearer token from `.dev.vars`.
6. In a second terminal, run `npm run cf:smoke` to create and delete a disposable test analysis.

Wrangler simulates D1, R2, and Queues locally.

## Behavior and limits

- Uploads are capped at 50 MiB and stored in private R2.
- External AI processing requires explicit consent.
- Gemini is primary. OpenRouter's free-model router is attempted only after a transient Gemini failure; availability and rate limits can still result in a partial report.
- Inline AI media processing is capped at 14 MiB. Larger files receive a partial result.
- OpenRouter fallback can receive claim text or images; audio/video fallback is skipped because that compatibility route is not configured for those media types.
- User-supplied URLs are not fetched or treated as corroborating evidence.
- Container checks are basic header scans; this MVP does not validate C2PA signatures or run a calibrated deepfake detector.
- Health routes are public; analysis and settings routes require the backend bearer token.

Cloud deployment steps are in CLOUDFLARE_DEPLOYMENT.md.
