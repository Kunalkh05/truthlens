import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CloudEnv = { TRUTHLENS_API?: { fetch(request: Request): Promise<Response> } };

export async function GET() {
  if (process.env.NEXT_PUBLIC_TRUTHLENS_CLOUD_API === "true") {
    try {
      let service: CloudEnv["TRUTHLENS_API"];
      try {
        service = (getCloudflareContext().env as CloudEnv).TRUTHLENS_API;
      } catch {
        service = undefined;
      }
      const apiUrl = process.env.TRUTHLENS_CLOUDFLARE_API_URL;
      const upstream = service
        ? await service.fetch(new Request("https://truthlens-api/health/ready"))
        : apiUrl
          ? await fetch(new URL("/health/ready", apiUrl), { cache: "no-store" })
          : null;
      if (upstream) {
        const result = await upstream.json().catch(() => ({ status: "not_ready" }));
        return NextResponse.json({ ...result, application: "truthlens-web" }, { status: upstream.status });
      }
    } catch {
      return NextResponse.json(
        { status: "not_ready", application: "truthlens-web", backend: "unreachable", timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }
  }

  try {
    const db = getDatabase();
    db.prepare("SELECT 1").get();

    return NextResponse.json(
      {
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "not_ready",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
