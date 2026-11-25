import { NextRequest, NextResponse } from "next/server";
import { ObjectStorage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing storage key" }, { status: 400 });
    }

    const buffer = await ObjectStorage.getObject(key);
    if (!buffer) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="truthlens_verification_${id}.json"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
