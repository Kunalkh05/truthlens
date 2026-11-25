import crypto from "node:crypto";
import { getDatabase } from "@/lib/db";
import { ObjectStorage } from "@/lib/storage";
import { MediaForensicsPipeline } from "./forensics";
import { ClaimVerificationPipeline } from "./claims";
import { ProviderRouter } from "@/lib/providers/router";
import { pipelineEvents } from "./events";
import type { AssessmentBand, StageName } from "@/types/domain";

export class AnalysisOrchestrator {
  private static activeJobs = new Map<string, AbortController>();

  /**
   * Dispatches analysis job to asynchronous queue.
   */
  static enqueueJob(analysisId: string): void {
    const controller = new AbortController();
    this.activeJobs.set(analysisId, controller);

    // Run asynchronously without blocking caller
    setImmediate(async () => {
      try {
        await this.runPipeline(analysisId, controller.signal);
      } catch (err: unknown) {
        console.error(`Analysis ${analysisId} pipeline uncaught failure:`, err);
      } finally {
        this.activeJobs.delete(analysisId);
      }
    });
  }

  /**
   * Cancels an active job.
   */
  static cancelJob(analysisId: string): boolean {
    const controller = this.activeJobs.get(analysisId);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(analysisId);

      const db = getDatabase();
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE analyses
        SET status = 'failed', completed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, analysisId);

      pipelineEvents.emitEvent({
        analysisId,
        stage: "cancelled",
        status: "failed",
        message: "Analysis job cancelled by user request.",
        timestamp: now,
        safeErrorCode: "JOB_CANCELLED",
      });

      return true;
    }
    return false;
  }

  private static recordStage(
    analysisId: string,
    stage: StageName,
    status: "running" | "completed" | "failed" | "skipped",
    safeErrorCode: string | null = null
  ): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = db
      .prepare("SELECT id FROM analysis_stages WHERE analysis_id = ? AND name = ?")
      .get(analysisId, stage) as { id: string } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE analysis_stages
        SET status = ?, finished_at = ?, safe_error_code = ?
        WHERE id = ?
      `).run(status, now, safeErrorCode, existing.id);
    } else {
      const stageId = `stg_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO analysis_stages
        (id, analysis_id, name, status, started_at, finished_at, attempt, safe_error_code)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(stageId, analysisId, stage, status, now, status === "running" ? null : now, safeErrorCode);
    }

    pipelineEvents.emitEvent({
      analysisId,
      stage,
      status: status === "running" ? "started" : status === "completed" ? "completed" : "failed",
      message: `Stage ${stage} status: ${status}`,
      timestamp: now,
      safeErrorCode: safeErrorCode || undefined,
    });
  }

  /**
   * Main asynchronous pipeline execution.
   */
  private static async runPipeline(analysisId: string, signal: AbortSignal): Promise<void> {
    const db = getDatabase();

    const analysis = db
      .prepare("SELECT * FROM analyses WHERE id = ?")
      .get(analysisId) as {
        id: string;
        workspace_id: string;
        owner_id: string;
        status: string;
        input_type: string;
        original_object_key: string | null;
        original_sha256: string | null;
        source_url: string | null;
        claim_text: string | null;
        consent_external: number;
      } | undefined;

    if (!analysis) return;

    if (signal.aborted) return;

    const consentExternal = Boolean(analysis.consent_external);
    const workspaceId = analysis.workspace_id;

    // Stage 1: Intake
    this.recordStage(analysisId, "intake", "running");
    let mediaBuffer: Buffer | null = null;
    if (analysis.original_object_key) {
      mediaBuffer = await ObjectStorage.getObject(analysis.original_object_key);
    }
    this.recordStage(analysisId, "intake", "completed");

    if (signal.aborted) return;

    // Stage 2: Metadata Extraction & Forensics
    this.recordStage(analysisId, "metadata_extraction", "running");
    let forensicsFindings: Array<any> = [];

    if (mediaBuffer) {
      const forensics = await MediaForensicsPipeline.analyzeBuffer(
        mediaBuffer,
        analysis.input_type === "image" ? "image/jpeg" : "application/octet-stream"
      );

      forensicsFindings = forensics.findings;

      // Save derived artifact
      const artifactId = `art_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO artifacts
        (id, analysis_id, parent_artifact_id, object_key, sha256, media_type, kind, tool_name, tool_version, created_at)
        VALUES (?, ?, NULL, ?, ?, ?, 'original', 'truthlens_forensics', '2026.1', ?)
      `).run(artifactId, analysisId, analysis.original_object_key || "none", forensics.sha256, forensics.mimeType, now);
    }
    this.recordStage(analysisId, "metadata_extraction", "completed");

    if (signal.aborted) return;

    // Stage 3: Provenance Check
    this.recordStage(analysisId, "provenance_check", "running");
    // Already extracted in forensicsFindings; record stage complete
    this.recordStage(analysisId, "provenance_check", "completed");

    if (signal.aborted) return;

    // Stage 4: Media Signals
    this.recordStage(analysisId, "media_signals", "running");
    const mediaProviderResult = await ProviderRouter.executeMediaAnalysis(
      workspaceId,
      consentExternal,
      {
        taskId: analysisId,
        inputType: analysis.input_type as any,
        claimText: analysis.claim_text || undefined,
      }
    );
    this.recordStage(analysisId, "media_signals", "completed");

    if (signal.aborted) return;

    // Stage 5: Source Retrieval & Claim Corroboration
    this.recordStage(analysisId, "source_retrieval", "running");
    const claimResult = await ClaimVerificationPipeline.verifyClaim(
      analysisId,
      analysis.claim_text || "Unspecified media claim",
      analysis.source_url
    );
    this.recordStage(analysisId, "source_retrieval", "completed");

    if (signal.aborted) return;

    this.recordStage(analysisId, "claim_corroboration", "running");
    const claimProviderResult = await ProviderRouter.executeClaimVerification(
      workspaceId,
      consentExternal,
      {
        taskId: analysisId,
        inputType: analysis.input_type as any,
        claimText: analysis.claim_text || undefined,
        sources: claimResult.sources.map((s) => ({
          publisher: s.publisher,
          title: s.title,
          url: s.url,
          excerpt: s.excerpt,
        })),
      }
    );
    this.recordStage(analysisId, "claim_corroboration", "completed");

    if (signal.aborted) return;

    // Stage 6: Synthesis
    this.recordStage(analysisId, "synthesis", "running");
    const combinedFindingsForSynthesis = [
      ...forensicsFindings,
      ...mediaProviderResult.findings,
      ...claimResult.findings,
      ...claimProviderResult.findings,
    ];

    const synthesisResult = await ProviderRouter.executeSynthesis(
      workspaceId,
      consentExternal,
      {
        taskId: analysisId,
        inputType: analysis.input_type as any,
        claimText: analysis.claim_text || undefined,
      },
      combinedFindingsForSynthesis
    );

    // Persist all findings into DB
    const now = new Date().toISOString();
    const sourceIdMap = new Map<string, string>();

    // Insert sources
    for (const src of claimResult.sources) {
      db.prepare(`
        INSERT INTO sources
        (id, analysis_id, url, canonical_url, publisher, title, published_at, updated_at, accessed_at, excerpt, source_type, retrieval_metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        src.id,
        analysisId,
        src.url,
        src.canonicalUrl,
        src.publisher,
        src.title,
        src.publishedAt,
        src.updatedAt,
        src.accessedAt,
        src.excerpt,
        src.sourceType,
        JSON.stringify(src.retrievalMetadata)
      );
      sourceIdMap.set(src.url, src.id);
    }

    // Insert findings
    for (const f of combinedFindingsForSynthesis) {
      const findingId = `fnd_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO findings
        (id, analysis_id, domain, finding_type, label, score, calibration_ref, explanation, evidence_refs, provider, model, version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        findingId,
        analysisId,
        f.domain,
        f.findingType,
        f.label,
        f.score,
        f.calibrationRef,
        f.explanation,
        JSON.stringify(f.evidenceRefs || []),
        f.provider || mediaProviderResult.provider,
        f.model || mediaProviderResult.model,
        f.version || "1.0",
        now
      );

      // Create citations if matched
      for (const citation of claimResult.citations) {
        if (citation.findingLabel === f.label) {
          const matchedSourceId = sourceIdMap.get(citation.sourceUrl);
          if (matchedSourceId) {
            const citId = `cit_${crypto.randomUUID()}`;
            const excerptHash = crypto.createHash("sha256").update(citation.excerpt).digest("hex");
            db.prepare(`
              INSERT INTO citations
              (id, finding_id, source_id, relation, excerpt_hash, locator)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(citId, findingId, matchedSourceId, citation.relation, excerptHash, citation.sourceUrl);
          }
        }
      }
    }

    this.recordStage(analysisId, "synthesis", "completed");

    // Mark analysis completed
    db.prepare(`
      UPDATE analyses
      SET status = 'completed', completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, analysisId);

    // Emit terminal SSE event
    pipelineEvents.emitEvent({
      analysisId,
      stage: "synthesis",
      status: "completed",
      message: "Analysis completed with calibrated assessment.",
      timestamp: now,
    });
  }
}
