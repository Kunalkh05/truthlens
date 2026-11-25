import { NextRequest, NextResponse } from "next/server";
import { SkmVault } from "@/lib/security/skm";
import { getDatabase } from "@/lib/db";
import crypto from "node:crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    if (provider !== "gemini" && provider !== "openrouter") {
      return NextResponse.json(
        { error: { code: "INVALID_PROVIDER", message: "Supported providers: gemini, openrouter" } },
        { status: 400 }
      );
    }

    const workspaceId = req.headers.get("x-workspace-id") || null;
    const status = SkmVault.getProviderStatus(workspaceId, provider);
    return NextResponse.json(status);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { code: "SERVER_ERROR", message: errorMsg } }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    if (provider !== "gemini" && provider !== "openrouter") {
      return NextResponse.json(
        { error: { code: "INVALID_PROVIDER", message: "Supported providers: gemini, openrouter" } },
        { status: 400 }
      );
    }

    const body = await req.json();
    const apiKey = body.apiKey;
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_KEY", message: "API key is required." } },
        { status: 400 }
      );
    }

    const workspaceId = req.headers.get("x-workspace-id") || null;
    const actorId = req.headers.get("x-user-id") || "usr_default_admin";

    // Encrypt and store in SKM vault
    const saved = SkmVault.setProviderKey(workspaceId, provider, apiKey.trim());

    // Record audit event (redacting secret key)
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_events
      (id, workspace_id, actor_id, action, resource_type, resource_id, metadata_redacted, created_at)
      VALUES (?, ?, ?, 'provider_key.updated', 'provider_secret', ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      workspaceId,
      actorId,
      saved.id,
      JSON.stringify({ provider, keyVersion: saved.keyVersion, label: saved.label }),
      now
    );

    return NextResponse.json({
      id: saved.id,
      provider: saved.provider,
      label: saved.label,
      keyVersion: saved.keyVersion,
      status: "active",
      message: "Provider key securely encrypted and stored in SKM vault.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { code: "VAULT_WRITE_FAILED", message: errorMsg } }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const db = getDatabase();
    const workspaceId = req.headers.get("x-workspace-id") || null;

    db.prepare(`
      UPDATE provider_secrets
      SET status = 'revoked', rotated_at = ?
      WHERE provider = ? AND (workspace_id = ? OR (workspace_id IS NULL AND ? IS NULL))
    `).run(new Date().toISOString(), provider, workspaceId, workspaceId);

    return NextResponse.json({
      provider,
      status: "revoked",
      message: "Provider credential revoked.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { code: "REVOCATION_FAILED", message: errorMsg } }, { status: 500 });
  }
}
