"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { KeyRound, Shield, Database, RefreshCw, CheckCircle2, AlertCircle, Lock, ShieldCheck } from "lucide-react";

interface ProviderStatus {
  provider: string;
  configured: boolean;
  status: string;
  source: string | null;
  label?: string;
  keyVersion?: number;
}

export const SettingsView: React.FC = () => {
  const cloudMode = process.env.NEXT_PUBLIC_TRUTHLENS_CLOUD_API === "true";
  const [geminiStatus, setGeminiStatus] = useState<ProviderStatus | null>(null);
  const [openrouterStatus, setOpenrouterStatus] = useState<ProviderStatus | null>(null);
  const [geminiInputKey, setGeminiInputKey] = useState("");
  const [openrouterInputKey, setOpenrouterInputKey] = useState("");
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [isSavingOpenrouter, setIsSavingOpenrouter] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadProviderStatuses = async () => {
    try {
      const [gRes, oRes] = await Promise.all([
        fetch(apiUrl("/api/v1/settings/providers/gemini")),
        fetch(apiUrl("/api/v1/settings/providers/openrouter")),
      ]);
      if (gRes.ok) setGeminiStatus(await gRes.json());
      if (oRes.ok) setOpenrouterStatus(await oRes.json());
    } catch (err) {
      console.error("Failed to load provider statuses", err);
    }
  };

  useEffect(() => {
    loadProviderStatuses();
  }, []);

  const handleSaveKey = async (provider: "gemini" | "openrouter", key: string) => {
    setNotice(null);
    if (!key.trim()) return;

    if (provider === "gemini") setIsSavingGemini(true);
    else setIsSavingOpenrouter(true);

    try {
      const res = await fetch(apiUrl("/api/v1/settings/providers/" + provider), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key.trim() }),
      });

      if (res.ok) {
        setNotice({ text: `${provider.toUpperCase()} credential securely encrypted in server SKM vault.`, type: "success" });
        if (provider === "gemini") setGeminiInputKey("");
        else setOpenrouterInputKey("");
        loadProviderStatuses();
      } else {
        const data = await res.json();
        setNotice({ text: data.error?.message || "Failed to save key.", type: "error" });
      }
    } catch {
      setNotice({ text: "Network communication error while saving key.", type: "error" });
    } finally {
      setIsSavingGemini(false);
      setIsSavingOpenrouter(false);
    }
  };

  const handleRevokeKey = async (provider: "gemini" | "openrouter") => {
    setNotice(null);
    try {
      const res = await fetch(apiUrl("/api/v1/settings/providers/" + provider), { method: "DELETE" });
      if (res.ok) {
        setNotice({ text: `${provider.toUpperCase()} credential successfully revoked from vault.`, type: "success" });
        loadProviderStatuses();
      }
    } catch {
      setNotice({ text: "Key revocation failed.", type: "error" });
    }
  };

  return (
    <div className="workspace-section settings-layout w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-heading border-b border-surface-border pb-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-2xl sm:text-3xl font-medium text-foreground">Provider connections</h2>
        </div>
        <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed max-w-2xl">
          {cloudMode
            ? "Provider credentials are managed as Cloudflare Worker Secrets and never returned to the browser."
            : "Provider credentials are encrypted by the local server and never returned to the browser."}
        </p>
      </div>

      {notice && (
        <div
          role={notice.type === "success" ? "status" : "alert"}
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 font-medium shadow-sm ${
            notice.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="provider-grid">
      {/* Primary Provider: Google Gemini */}
      <section className="provider-panel bg-surface border border-surface-border rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground">Google Gemini <span className="provider-role">Primary</span></h3>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border self-start sm:self-auto ${
              geminiStatus?.configured
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-surface-muted text-foreground/60 border-surface-border"
            }`}
          >
            {geminiStatus?.configured ? (cloudMode ? "Cloudflare Secret" : "Vault Configured") : "Not Configured"}
          </span>
        </div>

        {geminiStatus?.configured && (
          <div className="p-4 rounded-lg bg-surface-muted/30 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-foreground">{geminiStatus.label || "Gemini Credential"}</p>
              <p className="text-foreground/65 text-[11px] mt-0.5 font-mono">
                Storage: {geminiStatus.source} · Key Version: v{geminiStatus.keyVersion || 1}
              </p>
            </div>
            {!cloudMode && <button
              type="button"
              onClick={() => handleRevokeKey("gemini")}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/30 self-start sm:self-auto"
            >
              Revoke Credential
            </button>}
          </div>
        )}

        {cloudMode ? (
          <p className="text-xs text-foreground/65 leading-relaxed">
            {geminiStatus?.configured
              ? "Gemini is configured on the backend. Rotate or remove its key through Cloudflare Worker Secrets."
              : "Add the Gemini key to the Cloudflare Worker Secrets before running provider analysis."}
          </p>
        ) : <div className="space-y-2">
          <label htmlFor="gemini-key-input" className="block text-xs font-bold text-foreground/80">
            {geminiStatus?.configured ? "Rotate Gemini API Key" : "Enter Gemini API Key"}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="gemini-key-input"
              name="geminiKey"
              type="password"
              value={geminiInputKey}
              onChange={(e) => setGeminiInputKey(e.target.value)}
              placeholder="AIzaSy…"
              autoComplete="off"
              className="flex-1 px-3.5 py-2.5 text-xs bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono"
            />
            <button
              type="button"
              onClick={() => handleSaveKey("gemini", geminiInputKey)}
              disabled={isSavingGemini || !geminiInputKey.trim()}
              className="min-h-[40px] px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSavingGemini ? "Encrypting…" : "Save to Vault"}
            </button>
          </div>
        </div>}
      </section>

      {/* Secondary Fallback Provider: OpenRouter */}
      <section className="provider-panel bg-surface border border-surface-border rounded-xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground">OpenRouter <span className="provider-role">Fallback</span></h3>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border self-start sm:self-auto ${
              openrouterStatus?.configured
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-surface-muted text-foreground/60 border-surface-border"
            }`}
          >
            {openrouterStatus?.configured ? (cloudMode ? "Cloudflare Secret" : "Vault Configured") : "Not Configured"}
          </span>
        </div>

        {openrouterStatus?.configured && (
          <div className="p-4 rounded-lg bg-surface-muted/30 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-foreground">{openrouterStatus.label || "OpenRouter Credential"}</p>
              <p className="text-foreground/65 text-[11px] mt-0.5 font-mono">
                Storage: {openrouterStatus.source} · Key Version: v{openrouterStatus.keyVersion || 1}
              </p>
            </div>
            {!cloudMode && <button
              type="button"
              onClick={() => handleRevokeKey("openrouter")}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/30 self-start sm:self-auto"
            >
              Revoke Credential
            </button>}
          </div>
        )}

        {cloudMode ? (
          <p className="text-xs text-foreground/65 leading-relaxed">
            {openrouterStatus?.configured
              ? "OpenRouter is configured as the fallback provider. Rotate or remove its key through Cloudflare Worker Secrets."
              : "Add the OpenRouter key to the Cloudflare Worker Secrets to enable fallback analysis."}
          </p>
        ) : <div className="space-y-2">
          <label htmlFor="openrouter-key-input" className="block text-xs font-bold text-foreground/80">
            {openrouterStatus?.configured ? "Rotate OpenRouter Key" : "Enter OpenRouter API Key"}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="openrouter-key-input"
              name="openrouterKey"
              type="password"
              value={openrouterInputKey}
              onChange={(e) => setOpenrouterInputKey(e.target.value)}
              placeholder="sk-or-v1-…"
              autoComplete="off"
              className="flex-1 px-3.5 py-2.5 text-xs bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono"
            />
            <button
              type="button"
              onClick={() => handleSaveKey("openrouter", openrouterInputKey)}
              disabled={isSavingOpenrouter || !openrouterInputKey.trim()}
              className="min-h-[40px] px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSavingOpenrouter ? "Encrypting…" : "Save to Vault"}
            </button>
          </div>
        </div>}
      </section>
      </div>

      {/* Workspace & Lifecycle Policy */}
      <div className="policy-panel bg-surface border border-surface-border rounded-xl p-6 sm:p-7 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">Workspace & Data Lifecycle Policy</h3>
        </div>
        <p className="text-xs text-foreground/75 leading-relaxed">
          The project retention target is 30 days. Cloudflare automatic expiry is not configured yet; delete analyses from History to remove their database records and stored objects.
        </p>
      </div>
    </div>
  );
};
