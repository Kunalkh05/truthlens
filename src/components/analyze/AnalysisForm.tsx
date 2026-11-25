"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Info,
  Clock,
  Layers,
  FileSearch,
} from "lucide-react";

interface AnalysisFormProps {
  onSubmit: (formData: FormData | Record<string, unknown>, isMultipart: boolean) => Promise<void>;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, onLoadSample, isLoading }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "claim">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [claim, setClaim] = useState("");
  const [externalConsent, setExternalConsent] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setErrorMsg(null);
    const maxBytes = 50 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setErrorMsg("The selected file exceeds the 50 MB limit. Please choose a smaller media file.");
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeTab === "upload") {
      if (!file) {
        setErrorMsg("Please select or drop an image, video, or audio file to inspect.");
        return;
      }
      const data = new FormData();
      data.append("file", file);
      data.append("inputType", file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "image");
      if (claim) data.append("claim", claim.trim());
      data.append("externalProcessingConsent", String(externalConsent));
      data.append("retentionDays", String(retentionDays));
      await onSubmit(data, true);
    } else if (activeTab === "url") {
      if (!url.trim()) {
        setErrorMsg("Please enter a valid HTTP or HTTPS URL.");
        return;
      }
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setErrorMsg("Only HTTP and HTTPS URLs are supported.");
          return;
        }
      } catch {
        setErrorMsg("Invalid URL format. Please include http:// or https://.");
        return;
      }
      await onSubmit(
        {
          inputType: "url",
          url: url.trim(),
          claim: claim.trim() || undefined,
          externalProcessingConsent: externalConsent,
          retentionDays,
        },
        false
      );
    } else {
      if (!claim.trim()) {
        setErrorMsg("Please enter a factual statement or proposition to verify.");
        return;
      }
      await onSubmit(
        {
          inputType: "claim",
          claim: claim.trim(),
          externalProcessingConsent: externalConsent,
          retentionDays,
        },
        false
      );
    }
  };

  return (
    <div className="intake-layout">
      <section className="intake-intro" aria-labelledby="intake-title">
        <h1 id="intake-title">Check the media. Then check the story.</h1>
        <p className="intake-intro-copy">
          Inspect an image, video, or recording. Add the claim attached to it and read technical signals beside independent sources.
        </p>
        <div className="intro-rule" aria-hidden="true" />
        <h2 className="text-sm font-semibold mb-3">What the review can include</h2>
        <ul className="inspection-list">
          <li>
            <span className="inspection-mark"><Layers aria-hidden="true" /></span>
            <span><strong>Media integrity</strong><span>Container, metadata, compression, and provenance signals</span></span>
          </li>
          <li>
            <span className="inspection-mark"><FileSearch aria-hidden="true" /></span>
            <span><strong>Claim context</strong><span>The statement or public link circulating with the media</span></span>
          </li>
          <li>
            <span className="inspection-mark"><Shield aria-hidden="true" /></span>
            <span><strong>Independent sources</strong><span>Corroboration and citations, where available</span></span>
          </li>
        </ul>
        <button type="button" onClick={onLoadSample} className="sample-link">
          <Info className="w-4 h-4" aria-hidden="true" />
          <span>Open the sample report</span>
          <span aria-hidden="true">↗</span>
        </button>
      </section>

      <section className="intake-panel" aria-label="New investigation">
        <div className="intake-panel-heading">
          <p>Start with a piece of evidence</p>
          <p>External model processing stays off until you opt in below.</p>
        </div>
        {/* Input Mode Tabs */}
        <div
          role="tablist"
          aria-label="Input modes"
          className="intake-tabs flex border-b border-surface-border bg-surface-muted/40 p-1 gap-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-mode-upload"
            aria-selected={activeTab === "upload"}
            aria-controls="panel-mode-upload"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors ${
              activeTab === "upload"
                ? "bg-surface text-primary shadow-sm border border-surface-border"
                : "text-foreground/70 hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            <span>Media File</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-mode-url"
            aria-selected={activeTab === "url"}
            aria-controls="panel-mode-url"
            onClick={() => setActiveTab("url")}
            className={`flex-1 min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors ${
              activeTab === "url"
                ? "bg-surface text-primary shadow-sm border border-surface-border"
                : "text-foreground/70 hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <LinkIcon className="w-4 h-4" aria-hidden="true" />
            <span>Public URL</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-mode-claim"
            aria-selected={activeTab === "claim"}
            aria-controls="panel-mode-claim"
            onClick={() => setActiveTab("claim")}
            className={`flex-1 min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors ${
              activeTab === "claim"
                ? "bg-surface text-primary shadow-sm border border-surface-border"
                : "text-foreground/70 hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>Factual Claim</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Panel 1: Upload */}
          {activeTab === "upload" && (
            <div id="panel-mode-upload" role="tabpanel" aria-labelledby="tab-mode-upload" className="space-y-4">
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload media file. Drop an image, video, or audio file here, or press enter to browse files."
                  className="upload-dropzone border-2 border-dashed border-surface-border hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors bg-surface-muted/30 hover:bg-surface-muted/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/mp4,audio/mpeg,audio/ogg"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <div className="upload-mark">
                    <UploadCloud className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Drop media file here or click to browse
                  </p>
                  <p className="text-xs text-foreground/65 mt-1.5 max-w-sm mx-auto">
                    Supported formats: JPEG, PNG, WebP, MP4, MP3, OGG (Maximum 50 MB)
                  </p>
                </div>
              ) : (
                <div className="border border-surface-border rounded-xl p-4 bg-surface-muted/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Selected media preview"
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-lg object-cover border border-surface-border shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                        {file.type.split("/")[1] || "media"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-foreground/65 mt-0.5 font-mono">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "binary"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="min-h-[36px] min-w-[36px] p-2 rounded-lg hover:bg-surface-border text-foreground/60 hover:text-foreground transition-colors flex items-center justify-center"
                    aria-label="Remove selected file"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              )}

              <div>
                <label htmlFor="upload-claim-context" className="block text-xs font-bold text-foreground/80 mb-1.5">
                  Context or circulating assertion (Optional)
                </label>
                <input
                  id="upload-claim-context"
                  name="claimContext"
                  type="text"
                  autoComplete="off"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="e.g., Image claimed to depict coastal storm surge on March 1…"
                  className="w-full px-3.5 py-2.5 text-sm bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-foreground/45 transition-colors"
                />
                <p className="text-[11px] text-foreground/60 mt-1">
                  Adding the contextual claim allows TruthLens to cross-reference news registries alongside technical DCT and EXIF checks.
                </p>
              </div>
            </div>
          )}

          {/* Panel 2: URL */}
          {activeTab === "url" && (
            <div id="panel-mode-url" role="tabpanel" aria-labelledby="tab-mode-url" className="space-y-4">
              <div>
                <label htmlFor="url-input-field" className="block text-xs font-bold text-foreground/80 mb-1.5">
                  Public URL to inspect
                </label>
                <input
                  id="url-input-field"
                  name="sourceUrl"
                  type="url"
                  autoComplete="off"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article-or-clip"
                  className="w-full px-3.5 py-2.5 text-sm bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-foreground/45 transition-colors"
                />
                <div className="text-[11px] text-foreground/65 mt-2 flex items-start gap-1.5 p-2.5 rounded-lg bg-surface-muted/50 border border-surface-border/60">
                  <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Protected egress:</strong> Internal subnets (RFC 1918), cloud metadata endpoints (169.254.169.254), and loopback targets are blocked by SSRF defense filters.
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="url-claim-field" className="block text-xs font-bold text-foreground/80 mb-1.5">
                  Specific proposition to verify (Optional)
                </label>
                <input
                  id="url-claim-field"
                  name="urlClaimContext"
                  type="text"
                  autoComplete="off"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="e.g., Did the regional port authority confirm this statement?"
                  className="w-full px-3.5 py-2.5 text-sm bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-foreground/45 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Panel 3: Claim */}
          {activeTab === "claim" && (
            <div id="panel-mode-claim" role="tabpanel" aria-labelledby="tab-mode-claim" className="space-y-4">
              <div>
                <label htmlFor="claim-textarea" className="block text-xs font-bold text-foreground/80 mb-1.5">
                  Factual proposition or circulating statement
                </label>
                <textarea
                  id="claim-textarea"
                  name="claimStatement"
                  rows={4}
                  autoComplete="off"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Enter the exact statement or proposition you want corroborated across independent news registries, primary archives, and fact-checking datasets…"
                  className="w-full px-3.5 py-2.5 text-sm bg-surface border border-surface-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-foreground/45 transition-colors leading-relaxed"
                />
                <p className="text-right text-xs text-foreground/60 font-mono mt-1">
                  {claim.length} characters
                </p>
              </div>
            </div>
          )}

          {/* Privacy, Processing Consent & Retention Settings */}
          <div className="pt-4 border-t border-surface-border space-y-4">
            <div className="p-4 rounded-xl border border-surface-border bg-surface-muted/30 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={externalConsent}
                  onChange={(e) => setExternalConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                />
                <div className="text-xs text-foreground/80 leading-relaxed">
                  <span className="font-bold text-foreground">Allow external AI model synthesis</span> (Google Gemini / OpenRouter).
                  <br />
                  <span className="text-foreground/65">
                    When unchecked, TruthLens operates in strict local offline mode: local container inspection, DCT quantization blocks, EXIF validation, and offline corroboration without external data egress.
                  </span>
                </div>
              </label>

              <div className="pt-2 border-t border-surface-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-foreground/70">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>Data retention period:</span>
                </div>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs bg-surface border border-surface-border rounded-md text-foreground focus:outline-none focus:border-primary"
                >
                  <option value={7}>7 days (Minimal retention)</option>
                  <option value={30}>30 days (Default)</option>
                  <option value={90}>90 days (Archival investigation)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span>Submitting analysis…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {activeTab === "upload" ? "Run Forensic Verification" : activeTab === "url" ? "Analyze URL" : "Verify Claim"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
