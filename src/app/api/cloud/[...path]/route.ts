import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const baseUrl = process.env.TRUTHLENS_CLOUDFLARE_API_URL;
  const token = process.env.TRUTHLENS_CLOUDFLARE_API_TOKEN;
  if (!baseUrl || !token) {
    return Response.json(
      { error: { code: "CLOUD_BACKEND_NOT_CONFIGURED", message: "Cloudflare API settings are missing on the server." } },
      { status: 503 }
    );
  }

  const { path } = await context.params;
  if (!path.length || path.some((part) => part === "." || part === "..")) {
    return Response.json({ error: { code: "INVALID_PATH", message: "Invalid API path." } }, { status: 400 });
  }
  const target = new URL("/api/" + path.map(encodeURIComponent).join("/"), baseUrl);
  target.search = new URL(request.url).search;

  const headers = new Headers();
  for (const name of ["content-type", "accept", "idempotency-key", "x-workspace-id", "x-user-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Authorization", "Bearer " + token);

  const init: RequestInit = { method: request.method, headers, redirect: "manual", cache: "no-store" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.arrayBuffer();
  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return Response.json(
      { error: { code: "CLOUD_BACKEND_UNAVAILABLE", message: "The Cloudflare backend could not be reached." } },
      { status: 502 }
    );
  }
  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-disposition", "cache-control", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
