import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function GET() {
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
