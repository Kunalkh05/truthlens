"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Download,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileBadge,
  Layers,
  Clock,
  PlusCircle,
  Shield,
  FileText,
  Scale,
  Sparkles,
} from "lucide-react";
import type { AnalysisResultResponse } from "@/types/domain";
import { formatDate, getAssessmentColor } from "@/lib/utils";
import { apiUrl } from "@/lib/api-url";

interface ResultViewProps {
  data: AnalysisResultResponse;
  onNewAnalysis: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ data, onNewAnalysis }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "media" | "claims" | "sources" | "timeline">("overview");
  const [isExporting, setIsExporting] = useState(false);

  const colors = getAssessmentColor(data.assessment);
  const isSampleReport = data.id === "sample_demo_analysis";
  const assessmentTone: Record<string, string> = {
    Supported: "var(--status-supported)",
    Mixed: "var(--status-mixed)",
    Contradicted: "var(--status-contradicted)",
    Unverified: "var(--status-unverified)",
    "Insufficient evidence": "var(--status-insufficient)",
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(apiUrl("/api/v1/analyses/" + data.id + "/reports"), { method: "POST" });
      if (res.ok) {
        const report = await res.json();
        if (report.downloadUrl) {
          window.open(apiUrl(report.downloadUrl), "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="report-shell space-y-6">
      {/* Sample Report Alert Banner */}
      {isSampleReport && (
        <div
          role="status"
          className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm sample-notice"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-bold">
                Illustrative Sample Report (Pre-recorded Fixture Data)
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                This verification result demonstrates TruthLens forensics and source citation capabilities using local test data. No live external models or APIs were queried.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNewAnalysis}
            className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-surface border border-surface-border text-foreground hover:bg-surface-muted text-xs font-bold shrink-0 transition-colors shadow-sm self-stretch sm:self-auto text-center"
          >
            Start New Analysis
          </button>
        </div>
      )}

      {/* Top Header & Export Bar */}
      <div className="report-topline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Analysis Dossier
            </span>
            <span className="text-xs font-mono text-foreground/50">#{data.id}</span>
          </div>
          <p className="text-xs text-foreground/70 mt-1.5">
            Verified on <span className="font-semibold text-foreground">{formatDate(data.completedAt || data.createdAt)}</span> · Input Mode:{" "}
            <span className="font-bold uppercase text-foreground">{data.inputType}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-muted text-xs font-bold text-foreground flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{isExporting ? "Generating PDF…" : "Export Traceable Report"}</span>
          </button>

          <button
            type="button"
            onClick={onNewAnalysis}
            className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Primary Assessment Dossier Card */}
      <div
        className="assessment-panel p-6 sm:p-7 rounded-xl border space-y-4 shadow-sm"
        style={{ "--assessment-color": assessmentTone[data.assessment] || "var(--primary)" } as React.CSSProperties}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${colors.dot} shrink-0`} aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${colors.text}`}>
                  {data.assessment}
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${colors.badge}`}>
                  Synthesized assessment
                </span>
              </div>
              <p className="text-xs text-foreground/70 mt-0.5">{colors.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-surface/80 dark:bg-surface/50 border border-surface-border px-3 py-1.5 rounded-lg shadow-2xs self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="text-foreground/70">Coverage Score:</span>
            <span className="font-bold text-foreground">{Math.round(data.confidenceCoverage.coverageScore * 100)}%</span>
            <span className="text-foreground/50">({data.confidenceCoverage.calibratedUncertainty} uncertainty)</span>
          </div>
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed font-normal">
          {data.summary}
        </p>

        <div className="pt-3 border-t border-surface-border/50 flex flex-wrap items-center gap-4 text-xs text-foreground/65">
          <span className="font-semibold text-foreground/80">{data.mediaFindings.length} technical signals inspected</span>
          <span>•</span>
          <span className="font-semibold text-foreground/80">{data.sources.length} sources and registries consulted</span>
          <span>•</span>
          <span>
            Attribution: <strong className="font-medium text-foreground">{data.providerAttribution.primaryProvider}</strong> ({data.providerAttribution.model})
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Result details"
        className="report-tabs flex border-b border-surface-border bg-surface-muted/30 p-1 rounded-lg gap-1 overflow-x-auto"
      >
        <button
          type="button"
          role="tab"
          id="tab-res-overview"
          aria-selected={activeTab === "overview"}
          aria-controls="panel-res-overview"
          onClick={() => setActiveTab("overview")}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-md transition-all ${
            activeTab === "overview"
              ? "bg-surface text-primary shadow-sm border border-surface-border"
              : "text-foreground/70 hover:text-foreground hover:bg-surface/40"
          }`}
        >
          Comprehensive Overview
        </button>

        <button
          type="button"
          role="tab"
          id="tab-res-media"
          aria-selected={activeTab === "media"}
          aria-controls="panel-res-media"
          onClick={() => setActiveTab("media")}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "media"
              ? "bg-surface text-primary shadow-sm border border-surface-border"
              : "text-foreground/70 hover:text-foreground hover:bg-surface/40"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Media Signals ({data.mediaFindings.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-res-claims"
          aria-selected={activeTab === "claims"}
          aria-controls="panel-res-claims"
          onClick={() => setActiveTab("claims")}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "claims"
              ? "bg-surface text-primary shadow-sm border border-surface-border"
              : "text-foreground/70 hover:text-foreground hover:bg-surface/40"
          }`}
        >
          <FileBadge className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Claim Corroboration ({data.claimFindings.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-res-sources"
          aria-selected={activeTab === "sources"}
          aria-controls="panel-res-sources"
          onClick={() => setActiveTab("sources")}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "sources"
              ? "bg-surface text-primary shadow-sm border border-surface-border"
              : "text-foreground/70 hover:text-foreground hover:bg-surface/40"
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Sources & Citations ({data.sources.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-res-timeline"
          aria-selected={activeTab === "timeline"}
          aria-controls="panel-res-timeline"
          onClick={() => setActiveTab("timeline")}
          className={`min-h-[40px] px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-md transition-all flex items-center gap-1.5 ${
            activeTab === "timeline"
              ? "bg-surface text-primary shadow-sm border border-surface-border"
              : "text-foreground/70 hover:text-foreground hover:bg-surface/40"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Milestone Ledger</span>
        </button>
      </div>

      {/* Tab 1: Comprehensive Dual-Track Overview */}
      {activeTab === "overview" && (
        <div id="panel-res-overview" role="tabpanel" aria-labelledby="tab-res-overview" className="report-panel grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Technical Media Authenticity Signals */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Media Authenticity Signals</span>
              </h3>
              <span className="text-[11px] text-foreground/60 font-mono">Sensors & Codecs</span>
            </div>

            <div className="space-y-3.5">
              {data.mediaFindings.map((finding) => (
                <div key={finding.id} className="evidence-item p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">{finding.label}</span>
                    {finding.score !== null ? (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-surface-border font-semibold">
                        Anomaly: {Math.round(finding.score * 100)}%
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-foreground/60">
                        Structural
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{finding.explanation}</p>
                  <div className="flex items-center justify-between text-[10px] text-foreground/50 font-mono pt-1">
                    <span>Ref: {finding.calibrationRef || "Internal"}</span>
                    <span>{finding.provider}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Factual Claim Corroboration */}
          <div className="bg-surface border border-surface-border rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileBadge className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Factual Claim Corroboration</span>
              </h3>
              <span className="text-[11px] text-foreground/60 font-mono">News Registries</span>
            </div>

            <div className="space-y-3.5">
              {data.claimFindings.map((finding) => (
                <div key={finding.id} className="evidence-item p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">{finding.label}</span>
                    {finding.score !== null && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold">
                        Agreement: {Math.round(finding.score * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{finding.explanation}</p>
                  <div className="flex items-center justify-between text-[10px] text-foreground/50 font-mono pt-1">
                    <span>Ref: {finding.calibrationRef}</span>
                    <span>{finding.provider}</span>
                  </div>
                </div>
              ))}

              {/* Source Highlights in Overview */}
              <div className="pt-2 border-t border-surface-border/60">
                <p className="text-xs font-bold text-foreground mb-2">Corroborating Primary Sources:</p>
                <div className="space-y-2">
                  {data.sources.slice(0, 2).map((s) => (
                    <div key={s.id} className="p-2.5 rounded bg-surface border border-surface-border text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">{s.publisher}</span>
                        <a
                          href={s.canonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>Inspect source</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                      <p className="text-foreground/70 text-[11px] mt-1 line-clamp-2 italic">
                        "{s.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Media Authenticity Signals */}
      {activeTab === "media" && (
        <div id="panel-res-media" role="tabpanel" aria-labelledby="tab-res-media" className="report-panel bg-surface border border-surface-border rounded-xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Observed Technical Media Signals</h3>
              <p className="text-xs text-foreground/65 mt-0.5">
                Physical sensor indicators, quantization matrices, frequency spectra, and container metadata.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-surface-muted border border-surface-border">
              {data.mediaFindings.length} checks executed
            </span>
          </div>

          {/* C2PA Provenance Educational Note */}
          <div className="p-3.5 rounded-lg border border-primary/25 bg-primary/5 text-xs text-foreground/80 leading-relaxed flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="font-bold text-foreground">Content Provenance (C2PA) Notice:</strong> Absence of an embedded cryptographic C2PA manifest does not prove manipulation. Most consumer devices and social media platforms recompress files and strip container metadata during upload.
            </div>
          </div>

          <div className="space-y-4">
            {data.mediaFindings.map((finding) => (
              <div key={finding.id} className="evidence-item p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <h4 className="text-xs font-bold text-foreground">{finding.label}</h4>
                  <span className="text-xs font-mono text-foreground/60">
                    Engine: {finding.provider} ({finding.model} v{finding.version})
                  </span>
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">{finding.explanation}</p>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-border/50 text-[11px] text-foreground/60 font-mono">
                  <span><strong>Calibration Standard:</strong> {finding.calibrationRef || "Standard Baseline"}</span>
                  <span>•</span>
                  <span><strong>Evidence Refs:</strong> {finding.evidenceRefs.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Claim Corroboration */}
      {activeTab === "claims" && (
        <div id="panel-res-claims" role="tabpanel" aria-labelledby="tab-res-claims" className="report-panel bg-surface border border-surface-border rounded-xl p-6 space-y-5 shadow-sm">
          <div className="border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Proposition Analysis & Cross-Referencing</h3>
            <p className="text-xs text-foreground/65 mt-0.5">
              Evaluation of factual statements against wire reports, press registries, and primary meteorological/governmental advisories.
            </p>
          </div>

          <div className="space-y-4">
            {data.claimFindings.map((finding) => (
              <div key={finding.id} className="evidence-item p-4 rounded-lg border border-surface-border bg-surface-muted/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground">{finding.label}</h4>
                  {finding.score !== null && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Corroboration Match: {Math.round(finding.score * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">{finding.explanation}</p>
                <div className="text-[11px] text-foreground/60 font-mono pt-1">
                  Matched via {finding.provider} ({finding.model}) · Ref: {finding.calibrationRef}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Sources & Citations */}
      {activeTab === "sources" && (
        <div id="panel-res-sources" role="tabpanel" aria-labelledby="tab-res-sources" className="report-panel bg-surface border border-surface-border rounded-xl p-6 space-y-5 shadow-sm">
          <div className="border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Corroborated Sources & Archival Records</h3>
            <p className="text-xs text-foreground/65 mt-0.5">
              Direct citations and quotes retrieved through SSRF-safe egress from trusted registries.
            </p>
          </div>

          <div className="space-y-4">
            {data.sources.map((source) => (
              <div key={source.id} className="evidence-item p-5 rounded-lg border border-surface-border bg-surface-muted/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {source.sourceType} registry
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1.5">{source.title}</h4>
                    <p className="text-xs text-foreground/65 mt-0.5">
                      Publisher: <strong>{source.publisher}</strong> · Published: {formatDate(source.publishedAt)} · Accessed: {formatDate(source.accessedAt)}
                    </p>
                  </div>
                  <a
                    href={source.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-muted text-foreground/70 hover:text-foreground transition-colors self-start flex items-center gap-1.5 text-xs font-semibold"
                    aria-label={`Open source article from ${source.publisher} in new tab`}
                  >
                    <span>View Article</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>

                <div className="p-3.5 rounded-lg bg-surface border border-surface-border text-xs text-foreground/85 italic leading-relaxed">
                  "{source.excerpt}"
                </div>

                {source.citations.length > 0 && (
                  <div className="text-[11px] text-foreground/60 font-mono flex items-center gap-2 pt-1 border-t border-surface-border/40">
                    <span>Excerpt Digest: {source.citations[0].excerptHash}</span>
                    <span>•</span>
                    <span>Relation: <strong className="text-emerald-700 dark:text-emerald-400 uppercase">{source.citations[0].relation}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Verification Timeline */}
      {activeTab === "timeline" && (
        <div id="panel-res-timeline" role="tabpanel" aria-labelledby="tab-res-timeline" className="report-panel bg-surface border border-surface-border rounded-xl p-6 space-y-5 shadow-sm">
          <div className="border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Execution Milestone Ledger</h3>
            <p className="text-xs text-foreground/65 mt-0.5">
              Auditable record of intake validation, cryptographic checks, signal extraction, and synthesis.
            </p>
          </div>

          <div className="relative border-l-2 border-surface-border ml-3 pl-6 space-y-6">
            {data.timeline.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface" aria-hidden="true" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">{step.stage}</p>
                  <span className="text-[10px] font-mono text-foreground/50">{formatDate(step.timestamp)}</span>
                </div>
                <p className="text-xs text-foreground/80 mt-1">{step.event}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methods & Known Limitations */}
      <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-3.5 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Forensic Methodology & Known Limitations</span>
        </h4>

        <ul className="list-disc list-inside text-xs text-foreground/75 space-y-2 leading-relaxed">
          {data.methodsAndLimitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>

        <div className="pt-3 border-t border-surface-border/60 text-[11px] text-foreground/60 leading-relaxed">
          <strong className="text-foreground/80 font-bold">Investigation Disclaimer: </strong>
          {data.disclaimer}
        </div>
      </div>
    </div>
  );
};
