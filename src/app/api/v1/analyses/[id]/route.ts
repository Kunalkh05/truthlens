import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { ObjectStorage } from "@/lib/storage";
import crypto from "node:crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const workspaceId = req.headers.get("x-workspace-id") || "ws_default_workspace";

    const analysis = db
      .prepare(`
        SELECT id, workspace_id, owner_id, status, input_type, original_sha256, source_url, claim_text, created_at, updated_at, completed_at
        FROM analyses
        WHERE id = ? AND workspace_id = ?
      `)
      .get(id, workspaceId) as any;

    if (!analysis) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Analysis not found or inaccessible in current workspace.",
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      );
    }

    const stages = db
      .prepare(`
        SELECT id, name, status, started_at, finished_at, attempt, safe_error_code
        FROM analysis_stages
        WHERE analysis_id = ?
        ORDER BY started_at ASC
      `)
      .all(id);

    return NextResponse.json({
      id: analysis.id,
      status: analysis.status,
      inputType: analysis.input_type,
      stages,
      timestamps: {
        createdAt: analysis.created_at,
        updatedAt: analysis.updated_at,
        completedAt: analysis.completed_at,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: errorMsg,
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDatabase();
    const workspaceId = req.headers.get("x-workspace-id") || "ws_default_workspace";
    const actorId = req.headers.get("x-user-id") || "usr_default_admin";

    const analysis = db
      .prepare("SELECT original_object_key FROM analyses WHERE id = ? AND workspace_id = ?")
      .get(id, workspaceId) as { original_object_key: string | null } | undefined;

    if (!analysis) {
      // Idempotent: return 202 even if already absent
      return NextResponse.json(
        { message: "Analysis deletion processed.", id },
        { status: 202 }
      );
    }

    // 1. Delete associated storage files (original & artifacts)
    if (analysis.original_object_key) {
      await ObjectStorage.deleteObject(analysis.original_object_key);
    }

    const artifacts = db
      .prepare("SELECT object_key FROM artifacts WHERE analysis_id = ?")
      .all(id) as { object_key: string }[];

    for (const art of artifacts) {
      if (art.object_key) {
        await ObjectStorage.deleteObject(art.object_key);
      }
    }

    // 2. Delete database records (cascading constraints delete stages, artifacts, findings, citations, sources)
    db.prepare("DELETE FROM analyses WHERE id = ?").run(id);

    // 3. Log audit event
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_events
      (id, workspace_id, actor_id, action, resource_type, resource_id, metadata_redacted, created_at)
      VALUES (?, ?, ?, 'analysis.deleted', 'analysis', ?, '{}', ?)
    `).run(`aud_${crypto.randomUUID()}`, workspaceId, actorId, id, now);

    return NextResponse.json(
      {
        message: "Analysis and derived artifacts successfully removed.",
        id,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: {
          code: "DELETION_FAILED",
          message: errorMsg,
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
