"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { Loader2, CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, Activity } from "lucide-react";

interface ProgressViewerProps {
  analysisId: string;
  onCompleted: () => void;
  onCancel: () => void;
}

interface StageItem {
  id: string;
  name: string;
  label: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
}

const STAGES: Array<Omit<StageItem, "status" | "id">> = [
  { name: "intake", label: "Intake & Sandbox Validation", description: "Verifying container MIME, byte safety, and computing SHA-256 digest." },
  { name: "metadata_extraction", label: "Metadata & Container Parsing", description: "Parsing EXIF sensor headers, container codecs, and frame sequences." },
  { name: "provenance_check", label: "Provenance & C2PA Trust", description: "Checking cryptographic content credentials and author signatures." },
  { name: "media_signals", label: "Media Forensics Analysis", description: "Evaluating compression variance, frequency spectrum, and audio-visual coherence." },
  { name: "source_retrieval", label: "Safe Source Retrieval", description: "Querying news registries and primary sources via SSRF-safe gateway." },
  { name: "claim_corroboration", label: "Claim Corroboration", description: "Mapping atomic factual propositions against corroborated reports." },
  { name: "synthesis", label: "Calibrated Evidence Synthesis", description: "Synthesizing signals, uncertainty boundaries, and evidence citations." },
];

export const ProgressViewer: React.FC<ProgressViewerProps> = ({ analysisId, onCompleted, onCancel }) => {
  const [currentStageName, setCurrentStageName] = useState<string>("intake");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [stagesState, setStagesState] = useState<Record<string, "pending" | "running" | "completed" | "failed">>({
    intake: "running",
  });
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Connect to Server-Sent Events stream
    const eventSource = new EventSource(apiUrl("/api/v1/analyses/" + analysisId + "/events"));

    eventSource.addEventListener("stage_update", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const { stage, status, safeErrorCode } = payload;

        setCurrentStageName(stage);
        setStagesState((prev) => {
          const next = { ...prev };
          if (status === "started") next[stage] = "running";
          if (status === "completed") next[stage] = "completed";
          if (status === "failed") next[stage] = "failed";
          return next;
        });

        if (stage === "synthesis" && status === "completed") {
          setTimeout(() => {
            eventSource.close();
            onCompleted();
          }, 800);
        }

        if (status === "failed") {
          setErrorNotice(safeErrorCode || "Analysis encountered an unrecoverable stage error.");
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });

    // Fallback polling every 2 seconds in case SSE disconnects
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl("/api/v1/analyses/" + analysisId));
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" || data.status === "partial") {
            clearInterval(pollInterval);
            eventSource.close();
            onCompleted();
          } else if (data.status === "failed") {
            clearInterval(pollInterval);
            setErrorNotice("Analysis execution failed.");
          }
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, [analysisId, onCompleted]);

  return (
    <div className="workspace-section progress-layout w-full max-w-3xl mx-auto bg-surface border border-surface-border rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" aria-hidden="true" />
            <h2 className="text-2xl font-medium text-foreground">Analysis in progress</h2>
          </div>
          <p className="text-xs text-foreground/65 mt-1 font-mono">
            Job ID: <span className="font-semibold text-foreground">{analysisId}</span> · Elapsed: {elapsedSeconds}s
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/30 self-stretch sm:self-auto text-center"
        >
          Cancel Analysis
        </button>
      </div>

      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite">
        Current stage: {currentStageName}, elapsed time {elapsedSeconds} seconds.
      </div>

      {/* Error state */}
      {errorNotice && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">{errorNotice}</span>
        </div>
      )}

      {/* Real Pipeline Stages List */}
      <div role="list" aria-label="Analysis stages" className="space-y-3">
        {STAGES.map((stg, idx) => {
          const state = stagesState[stg.name] || (idx === 0 ? "running" : "pending");
          return (
            <div
              key={stg.name}
              role="listitem"
              className={`progress-stage flex items-start gap-3.5 p-3.5 rounded-lg border transition-all ${
                state === "running"
                  ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-sm"
                  : state === "completed"
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : state === "failed"
                  ? "bg-rose-500/5 border-rose-500/40"
                  : "bg-surface-muted/20 border-surface-border/60 opacity-60"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {state === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                ) : state === "running" ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" aria-hidden="true" />
                ) : state === "failed" ? (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                ) : (
                  <Clock className="w-4 h-4 text-foreground/40" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{stg.label}</p>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      state === "completed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : state === "running"
                        ? "bg-primary/15 text-primary"
                        : state === "failed"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-surface-muted text-foreground/50"
                    }`}
                  >
                    {state}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/65 mt-0.5 leading-relaxed">{stg.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-center text-xs text-foreground/55 border-t border-surface-border/50">
        Observed technical media signals and independent factual corroborations are evaluated in isolated sandboxes.
      </div>
    </div>
  );
};
