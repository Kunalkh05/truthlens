import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDatabase, closeDatabase } from "@/lib/db";
import { ClaimVerificationPipeline } from "@/lib/pipeline/claims";
import { ReportGenerator } from "@/lib/reports/generator";

describe("Claim Verification & Report Generation", () => {
  beforeEach(() => {
    process.env.TEST_DB = "memory";
  });

  afterEach(() => {
    closeDatabase();
  });

  it("evaluates claims against curated source registries and flags contradiction", async () => {
    const claim = "Circulating deepfake hoax claims event never happened";
    const res = await ClaimVerificationPipeline.verifyClaim("test_ans_1", claim, null);

    expect(res.sources.length).toBeGreaterThan(0);
    const contradiction = res.findings.find((f) => f.findingType === "source_contradiction");
    expect(contradiction).toBeDefined();
    expect(contradiction?.domain).toBe("claim_verification");
    expect(contradiction?.score).toBeGreaterThan(0.8);
  });

  it("generates an immutable report certificate with complete evidence separation", async () => {
    const db = getDatabase();
    const ansId = "ans_report_test_1";
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO analyses
      (id, workspace_id, owner_id, status, input_type, created_at, updated_at, completed_at)
      VALUES (?, 'ws_default_workspace', 'usr_default_admin', 'completed', 'claim', ?, ?, ?)
    `).run(ansId, now, now, now);

    db.prepare(`
      INSERT INTO findings
      (id, analysis_id, domain, finding_type, label, score, explanation, evidence_refs, provider, model, version, created_at)
      VALUES ('f1', ?, 'media_authenticity', 'c2pa_provenance', 'No C2PA manifest', NULL, 'Standard web container.', '[]', 'core', 'sig', '1.0', ?)
    `).run(ansId, now);

    db.prepare(`
      INSERT INTO findings
      (id, analysis_id, domain, finding_type, label, score, explanation, evidence_refs, provider, model, version, created_at)
      VALUES ('f2', ?, 'claim_verification', 'source_agreement', 'Wire Corroboration', 0.85, 'Corroborated by wire services.', '[]', 'core', 'sig', '1.0', ?)
    `).run(ansId, now);

    const report = await ReportGenerator.generateReport(ansId);
    expect(report.reportId).toBeDefined();
    expect(report.sha256).toHaveLength(64);
    expect(report.reportData.assessment).toBe("Supported");
    expect(report.reportData.mediaFindings.length).toBe(1);
    expect(report.reportData.claimFindings.length).toBe(1);
    expect(report.reportData.disclaimer).toContain("decision-support");
  });
});
