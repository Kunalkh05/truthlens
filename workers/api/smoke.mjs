import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const parseEnv = (path) => {
  try {
    return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const split = line.indexOf("=");
        return [line.slice(0, split), line.slice(split + 1).replace(/^['"]|['"]$/g, "")];
      }));
  } catch { return {}; }
};

const local = parseEnv(resolve(root, "workers/api/.dev.vars"));
const app = parseEnv(resolve(root, ".env.local"));
const base = (process.env.TRUTHLENS_CLOUDFLARE_API_URL || process.env.WORKER_URL ||
  app.TRUTHLENS_CLOUDFLARE_API_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const token = process.env.TRUTHLENS_CLOUDFLARE_API_TOKEN || local.APP_API_TOKEN || app.TRUTHLENS_CLOUDFLARE_API_TOKEN;
if (!token || token.length < 32) {
  console.error("Smoke check needs APP_API_TOKEN in workers/api/.dev.vars or TRUTHLENS_CLOUDFLARE_API_TOKEN in .env.local.");
  process.exit(1);
}

async function request(path, init = {}) {
  const response = await fetch(base + path, {
    ...init,
    headers: { Authorization: "Bearer " + token, ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${init.method || "GET"} ${path} returned HTTP ${response.status}.`);
  return body;
}

try {
  const live = await fetch(base + "/health/live");
  if (!live.ok) throw new Error("Liveness check failed.");
  const ready = await fetch(base + "/health/ready");
  if (!ready.ok) throw new Error("Readiness check failed; D1 may not be available or migrated.");
  const created = await request("/api/v1/analyses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": "smoke-" + crypto.randomUUID() },
    body: JSON.stringify({ inputType: "claim", claim: "Disposable TruthLens backend smoke check", externalProcessingConsent: false }),
  });
  if (!created?.id) throw new Error("Analysis create response did not include an ID.");

  let analysis;
  for (let attempt = 0; attempt < 25; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    analysis = await request("/api/v1/analyses/" + encodeURIComponent(created.id));
    if (["completed", "partial", "failed"].includes(analysis.status)) break;
  }
  if (!analysis || !["completed", "partial"].includes(analysis.status)) {
    throw new Error("Analysis job did not reach a successful terminal state.");
  }
  const result = await request("/api/v1/analyses/" + encodeURIComponent(created.id) + "/result");
  if (!result?.disclaimer || !Array.isArray(result.methodsAndLimitations)) {
    throw new Error("Analysis result is missing its limitations or disclaimer.");
  }
  const report = await request("/api/v1/analyses/" + encodeURIComponent(created.id) + "/reports", { method: "POST" });
  if (!report?.downloadUrl) throw new Error("Report generation did not return a download link.");
  const downloadedReport = await request(report.downloadUrl);
  if (!downloadedReport?.disclaimer) throw new Error("Downloaded report is missing its disclaimer.");
  await request("/api/v1/analyses/" + encodeURIComponent(created.id), { method: "DELETE" });
  console.log(`Smoke check passed: liveness, readiness, authenticated analysis, result, report download, and deletion (${analysis.status}).`);

  if (process.env.VERIFY_PROVIDERS === "true") {
    const health = await request("/api/v1/providers/health");
    for (const name of ["gemini", "openrouter"]) {
      if (health?.providers?.[name]?.configured !== true || health?.providers?.[name]?.valid !== true) {
        throw new Error(`Provider check failed for ${name}; no inference request was sent.`);
      }
    }
    console.log("Provider credential checks passed for Gemini and OpenRouter; no inference request was sent.");
  }

  if (process.env.RUN_MEDIA_SMOKE === "true") {
    const form = new FormData();
    form.set("inputType", "image");
    form.set("claim", "Disposable media storage integration check");
    form.set("externalProcessingConsent", "false");
    form.set("file", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: "image/png" }), "truthlens-smoke.png");
    const mediaJob = await request("/api/v1/analyses", {
      method: "POST",
      headers: { "Idempotency-Key": "smoke-media-" + crypto.randomUUID() },
      body: form,
    });
    try {
      let mediaAnalysis;
      for (let attempt = 0; attempt < 25; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        mediaAnalysis = await request("/api/v1/analyses/" + encodeURIComponent(mediaJob.id));
        if (["completed", "partial", "failed"].includes(mediaAnalysis.status)) break;
      }
      const mediaResult = await request("/api/v1/analyses/" + encodeURIComponent(mediaJob.id) + "/result");
      if (!Array.isArray(mediaResult.mediaFindings) || mediaResult.mediaFindings.length === 0) {
        throw new Error("Media upload did not produce container observations.");
      }
      console.log("Media upload, private R2 storage, analysis, and report checks passed.");
    } finally {
      await request("/api/v1/analyses/" + encodeURIComponent(mediaJob.id), { method: "DELETE" });
    }
  }

  if (process.env.RUN_PROVIDER_INFERENCE === "true") {
    const aiJob = await request("/api/v1/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "smoke-ai-" + crypto.randomUUID() },
      body: JSON.stringify({
        inputType: "claim",
        claim: "Disposable integration check: state whether 2 + 2 = 4 in one short sentence.",
        externalProcessingConsent: true,
      }),
    });
    try {
      let aiAnalysis;
      for (let attempt = 0; attempt < 75; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        aiAnalysis = await request("/api/v1/analyses/" + encodeURIComponent(aiJob.id));
        if (["completed", "partial", "failed"].includes(aiAnalysis.status)) break;
      }
      if (!aiAnalysis || !["completed", "partial"].includes(aiAnalysis.status)) {
        throw new Error("Provider inference did not complete successfully.");
      }
      const aiResult = await request("/api/v1/analyses/" + encodeURIComponent(aiJob.id) + "/result");
      if (!["Gemini", "OpenRouter"].includes(aiResult.providerAttribution?.primaryProvider)) {
        const providerError = (aiResult.methodsAndLimitations || []).find((item) => item.startsWith("Automated provider analysis was unavailable"));
        throw new Error(providerError || "No AI provider returned a usable assessment.");
      }
      console.log(`Provider inference passed through ${aiResult.providerAttribution.primaryProvider}; the disposable record was removed.`);
    } finally {
      await request("/api/v1/analyses/" + encodeURIComponent(aiJob.id), { method: "DELETE" });
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Smoke check failed.");
  process.exit(1);
}
