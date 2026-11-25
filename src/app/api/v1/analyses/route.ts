import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { ObjectStorage } from "@/lib/storage";
import { AnalysisOrchestrator } from "@/lib/pipeline/orchestrator";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const idempotencyKey = req.headers.get("idempotency-key");
    const db = getDatabase();

    const analysisId = `ans_${crypto.randomUUID()}`;
    const workspaceId = req.headers.get("x-workspace-id") || "ws_default_workspace";
    const userId = req.headers.get("x-user-id") || "usr_default_admin";
    const now = new Date().toISOString();

    let inputType: "image" | "video" | "audio" | "url" | "claim" = "claim";
    let originalObjectKey: string | null = null;
    let originalSha256: string | null = null;
    let sourceUrl: string | null = null;
    let claimText: string | null = null;
    let consentExternal = false;
    let retentionDays = 30;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      inputType = (formData.get("inputType") as any) || "image";
      sourceUrl = (formData.get("url") as string) || null;
      claimText = (formData.get("claim") as string) || null;
      consentExternal = formData.get("externalProcessingConsent") === "true";
      retentionDays = parseInt((formData.get("retentionDays") as string) || "30", 10);

      if (file) {
        // Enforce max size (50MB)
        const maxBytes = 50 * 1024 * 1024;
        if (file.size > maxBytes) {
          return NextResponse.json(
            {
              error: {
                code: "UPLOAD_TOO_LARGE",
                message: "File exceeds maximum size of 50MB.",
                requestId: crypto.randomUUID(),
                retryable: false,
              },
            },
            { status: 413 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stored = await ObjectStorage.putObject(buffer, file.name, file.type, false);
        originalObjectKey = stored.key;
        originalSha256 = stored.sha256;
      }
    } else {
      const body = await req.json();
      inputType = body.inputType || "claim";
      sourceUrl = body.url || null;
      claimText = body.claim || null;
      consentExternal = Boolean(body.externalProcessingConsent);
      retentionDays = body.retentionDays || 30;
    }

    if (!originalObjectKey && !sourceUrl && !claimText) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Must provide media file upload, public URL, or claim text.",
            requestId: crypto.randomUUID(),
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Insert analysis record
    db.prepare(`
      INSERT INTO analyses
      (id, workspace_id, owner_id, status, input_type, original_object_key, original_sha256, source_url, claim_text, consent_external, created_at, updated_at)
      VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      analysisId,
      workspaceId,
      userId,
      inputType,
      originalObjectKey,
      originalSha256,
      sourceUrl,
      claimText,
      consentExternal ? 1 : 0,
      now,
      now
    );

    // Record audit event
    db.prepare(`
      INSERT INTO audit_events
      (id, workspace_id, actor_id, action, resource_type, resource_id, metadata_redacted, created_at)
      VALUES (?, ?, ?, 'analysis.created', 'analysis', ?, ?, ?)
    `).run(
      `aud_${crypto.randomUUID()}`,
      workspaceId,
      userId,
      analysisId,
      JSON.stringify({ inputType, hasMedia: Boolean(originalObjectKey), hasUrl: Boolean(sourceUrl) }),
      now
    );

    // Enqueue background processing
    AnalysisOrchestrator.enqueueJob(analysisId);

    return NextResponse.json(
      {
        id: analysisId,
        status: "queued",
        createdAt: now,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: errorMsg,
          requestId: crypto.randomUUID(),
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(req.url);
    const workspaceId = req.headers.get("x-workspace-id") || "ws_default_workspace";
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    let query = `
      SELECT id, workspace_id, owner_id, status, input_type, original_sha256, source_url, claim_text, created_at, completed_at
      FROM analyses
      WHERE workspace_id = ?
    `;
    const params: any[] = [workspaceId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = db.prepare(query).all(...params);

    return NextResponse.json({
      items: rows,
      count: rows.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: {
          code: "DATABASE_ERROR",
          message: errorMsg,
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
