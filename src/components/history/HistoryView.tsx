"use client";

import React, { useEffect, useState } from "react";
import { History as HistoryIcon, Trash2, ArrowUpRight, Search, AlertCircle, RefreshCw, Filter, FileSearch } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiUrl } from "@/lib/api-url";

interface AnalysisItem {
  id: string;
  workspace_id: string;
  owner_id: string;
  status: string;
  input_type: string;
  original_sha256: string | null;
  source_url: string | null;
  claim_text: string | null;
  created_at: string;
  completed_at: string | null;
}

interface HistoryViewProps {
  onSelectAnalysis: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectAnalysis }) => {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/analyses?limit=50"));
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Keyboard escape listener for delete modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && deleteTargetId) {
        setDeleteTargetId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTargetId]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(apiUrl("/api/v1/analyses/" + id), { method: "DELETE" });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
        setDeleteTargetId(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = analyses.filter((a) => {
    const text = (a.claim_text || a.source_url || a.id).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="workspace-section history-layout w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-heading flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-black text-foreground">Analysis History & Dossiers</h2>
          </div>
          <p className="text-xs text-foreground/65 mt-1 leading-relaxed">
            Search, reopen, or purge previous verification jobs and their derived spectral artifacts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={isLoading}
          className="min-h-[40px] px-3.5 py-2 rounded-lg border border-surface-border bg-surface hover:bg-surface-muted transition-colors text-foreground/80 hover:text-foreground flex items-center gap-2 text-xs font-bold shadow-sm"
          aria-label="Refresh analysis records"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <label htmlFor="history-search-input" className="sr-only">
          Filter analyses by claim text, URL, or job ID
        </label>
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-foreground/45 pointer-events-none" aria-hidden="true" />
        <input
          id="history-search-input"
          name="searchQuery"
          type="text"
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by claim text, URL, or job ID…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-foreground/45 shadow-sm"
        />
      </div>

      {/* Analyses Table / Card List */}
      <div className="bg-surface border border-surface-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-foreground/50 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" aria-hidden="true" />
            <p>Loading historical records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-foreground/40 border border-surface-border">
              <FileSearch className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No analyses found</p>
              <p className="text-xs text-foreground/60 mt-1 max-w-sm mx-auto">
                {searchTerm ? "No records match your filter query." : "Submit an image, video, audio file, public link, or statement to start your first analysis."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="history-row p-4 sm:p-5 hover:bg-surface-muted/30 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {item.input_type}
                    </span>
                    <span className="text-xs font-mono text-foreground/50 font-medium">#{item.id}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        item.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : item.status === "failed"
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground truncate max-w-xl">
                    {item.claim_text || item.source_url || "Media verification inspection"}
                  </p>

                  <p className="text-[11px] text-foreground/60 font-mono">
                    Created: {formatDate(item.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto self-stretch sm:self-center">
                  <button
                    type="button"
                    onClick={() => onSelectAnalysis(item.id)}
                    className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 rounded-lg bg-surface border border-surface-border hover:bg-surface-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(item.id)}
                    className="min-h-[38px] min-w-[38px] p-2 rounded-lg hover:bg-rose-500/10 text-foreground/45 hover:text-rose-600 transition-colors flex items-center justify-center border border-transparent hover:border-rose-500/30"
                    aria-label={`Delete analysis ${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accessible Delete Confirmation Modal */}
      {deleteTargetId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overscroll-contain"
        >
          <div className="bg-surface border border-surface-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 id="delete-dialog-title" className="text-lg font-bold text-foreground">
                Purge Analysis Data
              </h3>
            </div>

            <p id="delete-dialog-desc" className="text-xs text-foreground/75 leading-relaxed">
              This action permanently removes the stored media binary, derived frequency spectra, findings, and citations for dossier{" "}
              <span className="font-mono font-bold text-foreground">#{deleteTargetId}</span>. This operation cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="min-h-[38px] px-4 py-2 text-xs font-bold text-foreground/80 hover:bg-surface-muted rounded-lg transition-colors border border-surface-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTargetId)}
                disabled={isDeleting}
                className="min-h-[38px] px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? "Purging…" : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
