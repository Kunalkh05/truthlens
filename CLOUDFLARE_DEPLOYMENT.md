# TruthLens Cloudflare Backend

This package adds a Cloudflare Worker API to the existing Next.js app. The Worker uses D1 for records, a private R2 bucket for media and reports, and a Queue for analysis jobs. Gemini is the primary model provider; OpenRouter's free-model router is the fallback for transient Gemini failures. Provider credentials are Cloudflare Worker Secrets.

The Next.js app remains a separate Node.js app and proxies browser API calls to the Worker. The current SQLite, filesystem storage, and process-based job runner are not used by the Cloudflare backend. This deploys the API backend; it does not publish the Next.js website.

The deployed Worker is available at `https://truthlens-api.truthlens-ai.workers.dev`.

## Local setup

From the project root:

```sh
npm install
cp workers/api/.dev.vars.example workers/api/.dev.vars
```

Set a random `APP_API_TOKEN` with at least 32 characters in `workers/api/.dev.vars`. Provider keys can be omitted to exercise the metadata-only path. Apply the local database migration and run the Worker:

```sh
npm run cf:migrate:local
npm run cf:dev
```

The Worker listens on Wrangler's local address, normally `http://localhost:8787`. `/health/live` is public; `/health/ready` checks D1. All `/api/...` endpoints require `Authorization: Bearer <APP_API_TOKEN>`.

In a second terminal, run `npm run cf:smoke` to exercise an authenticated metadata-only analysis and delete its disposable record.

## Cloudflare resource setup

Sign in to the Cloudflare account that will own the resources, then create these resources in that account. No custom domain or DNS changes are needed; Wrangler provides a `workers.dev` URL.

### R2 billing activation

Cloudflare requires an R2 subscription before the private media bucket can be created. The account's R2 checkout currently shows $0 due now and $0 monthly base, plus usage charges beyond the free allowance. Standard storage includes 10 GB-month, 1 million Class A operations, and 10 million Class B operations each month. Above those allowances, the dashboard lists usage-based rates. The subscription auto-renews, is billed to the payment method on file, and accepts Cloudflare's terms. Cloudflare documents the [R2 subscription setup](https://developers.cloudflare.com/r2/get-started/) and [current R2 prices](https://developers.cloudflare.com/r2/pricing/).

R2 does not have a hard account spending cap; billing alerts only notify, and Cloudflare's Workers spend limit does not cap R2 charges. Review the checkout and configure any available billing alerts yourself. The account owner must complete the R2 subscription checkout in the dashboard before bucket creation. Do not proceed if you are not comfortable with usage-based charges.

```sh
npx wrangler d1 create truthlens-data
npx wrangler r2 bucket create truthlens-private-media
npx wrangler queues create truthlens-analysis
npx wrangler queues create truthlens-analysis-dlq
```

Copy the D1 database UUID printed by Wrangler into `workers/api/wrangler.jsonc` as `database_id`. Keep the binding name and database name as `DB` and `truthlens-data`. Apply the schema and deploy:

```sh
npm run cf:migrate:remote
npm run cf:deploy
```

The first deployment returns the Worker URL. Add provider keys interactively so they are saved as Worker Secrets, not command-line values or source files:

```sh
npx wrangler secret put GEMINI_API_KEY --config workers/api/wrangler.jsonc
npx wrangler secret put OPENROUTER_API_KEY --config workers/api/wrangler.jsonc
npx wrangler secret put APP_API_TOKEN --config workers/api/wrangler.jsonc
npm run cf:deploy
```

Wrangler prompts for each value. Use a newly generated random value for `APP_API_TOKEN`; never reuse either provider key for it. Set the same app token in the server-only `TRUTHLENS_CLOUDFLARE_API_TOKEN` variable in the Next.js deployment environment.

## Connect a local Next.js app

In the ignored root `.env.local`, set:

```dotenv
NEXT_PUBLIC_TRUTHLENS_CLOUD_API=true
TRUTHLENS_CLOUDFLARE_API_URL=https://truthlens-api.truthlens-ai.workers.dev
TRUTHLENS_CLOUDFLARE_API_TOKEN=<same random app token configured as a Worker Secret>
```

Restart the Next.js server after changing these values. The browser calls same-origin Next.js routes; only the server proxy sends the bearer token to the Worker.

## Smoke checks

```sh
curl -fsS https://truthlens-api.truthlens-ai.workers.dev/health/live
curl -fsS https://truthlens-api.truthlens-ai.workers.dev/health/ready
curl -fsS -H 'Authorization: Bearer <app-token>' https://truthlens-api.truthlens-ai.workers.dev/api/v1/providers/health
```

The provider health route checks whether each key/model can be reached without submitting an inference request. Do not paste the token into shared logs or commit it.

## Implemented routes

- `GET /health/live`, `GET /health/ready`
- `GET /api/v1/providers/health`
- `POST`, `GET /api/v1/analyses`
- `GET`, `DELETE /api/v1/analyses/:id`
- `GET /api/v1/analyses/:id/events` (finite server-sent event snapshot)
- `GET /api/v1/analyses/:id/result`
- `POST /api/v1/analyses/:id/reports`, `GET /api/v1/analyses/:id/reports/download`
- `GET /api/v1/settings/providers/:provider`

The app's settings page reports whether Worker Secrets are configured. Rotate or revoke them with Wrangler; they cannot be changed from the browser.

## Current product limits

- The default workspace is a single shared workspace; the existing app has no sign-in or per-person authorization.
- Uploads are capped at 50 MiB. Inline model processing is capped at 14 MiB. Oversized media receives a partial report.
- The Worker performs basic file signature and header-marker checks. It does not validate C2PA signatures, run a calibrated deepfake detector, or establish forensic authenticity.
- Gemini is primary. OpenRouter is tried after transient failures; image inputs are supported on fallback, while audio/video fallback is skipped.
- OpenRouter defaults to `openrouter/free`, which routes to available free models that support request features such as structured output. OpenRouter documents free model rate limits and availability; exhausted limits can leave a partial result. [Free Models Router](https://openrouter.ai/openrouter/free).
- Source URLs are recorded but not fetched. The system therefore cannot independently corroborate news claims.
- Automatic 30-day deletion is not configured. Users can delete items from History; lifecycle cleanup still needs a scheduled implementation.
- Inference charges depend on provider account/model pricing. Health checks do not run inference.
- No Cloudflare website plan upgrade or custom domain is needed. R2 subscription activation is required as described above and can incur usage charges above its free tier.

## Rollback and removal

Rollback the Worker by deploying the last known good version in Cloudflare's Workers dashboard. D1 migrations are forward-only in this starter; take a D1 backup before schema changes. Remove test records in History. To fully remove the project resources, first disable the app proxy, then delete the Worker, Queue and dead-letter Queue, R2 bucket, and D1 database through Wrangler or the Cloudflare dashboard after exporting any data you need.
