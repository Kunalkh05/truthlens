"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AnalysisForm } from "@/components/analyze/AnalysisForm";
import { ProgressViewer } from "@/components/analyze/ProgressViewer";
import { ResultView } from "@/components/results/ResultView";
import { HistoryView } from "@/components/history/HistoryView";
import { SettingsView } from "@/components/settings/SettingsView";
import { apiUrl } from "@/lib/api-url";
import type { AnalysisResultResponse } from "@/types/domain";

// Labeled sample report fixture for immediate exploration
const SAMPLE_RESULT: AnalysisResultResponse = {
  id: "sample_demo_analysis",
  status: "completed",
  inputType: "image",
  assessment: "Supported",
  summary:
    "Independent wire services and official weather advisories corroborate the occurrence of the depicted coastal weather event. Sensor metadata and DCT quantization blocks demonstrate consistent sensor noise with no evidence of synthetic diffusion generation.",
  confidenceCoverage: {
    signalsExamined: 4,
    sourcesConsulted: 3,
    coverageScore: 0.92,
    calibratedUncertainty: "low",
  },
  mediaFindings: [
    {
      id: "fnd_sample_1",
      analysisId: "sample_demo_analysis",
      domain: "media_authenticity",
      findingType: "c2pa_provenance",
      label: "Standard Container (No Embedded C2PA Manifest)",
      score: null,
      calibrationRef: "C2PA-Provenance-Spec-2.1",
      explanation:
        "No cryptographic C2PA signature was detected. Absence of C2PA manifest does not indicate manipulation, as most consumer devices and web uploaders strip container metadata.",
      evidenceRefs: ["container_header_scan", "jumbf_manifest_parser"],
      provider: "truthlens_forensics_core",
      model: "container_signature_engine",
      version: "2026.1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fnd_sample_2",
      analysisId: "sample_demo_analysis",
      domain: "media_authenticity",
      findingType: "compression_anomaly",
      label: "Quantization Uniformity Across Quadrants",
      score: 0.18,
      calibrationRef: "ISO-10918-DCT-Baseline",
      explanation:
        "Discrete Cosine Transform (DCT) block grids demonstrate consistent quantizer matrix coefficients across all image quadrants, with no high-frequency edge discontinuities.",
      evidenceRefs: ["dct_frequency_analysis", "quantization_matrix_hash"],
      provider: "truthlens_forensics_core",
      model: "dct_quant_v2",
      version: "2026.1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fnd_sample_3",
      analysisId: "sample_demo_analysis",
      domain: "media_authenticity",
      findingType: "generative_artifact",
      label: "Diffusion Synthesis & Texture Artifacts",
      score: 0.14,
      calibrationRef: "Synthetic-Texture-Benchmark-2026",
      explanation:
        "Fourier spectral power decay exhibits natural sensor photon noise without typical checkerboard deconvolution artifacts or anomalous boundary halos.",
      evidenceRefs: ["fourier_spectral_decay"],
      provider: "truthlens_forensics_core",
      model: "texture_spectral_engine",
      version: "2026.1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fnd_sample_4",
      analysisId: "sample_demo_analysis",
      domain: "media_authenticity",
      findingType: "exif_metadata",
      label: "Sensor Model & Timestamp Alignment",
      score: null,
      calibrationRef: "TIFF-EXIF-2.32",
      explanation:
        "Exif tags indicate Sony ILCE-7RM4 optical capture; exposure and focal length match the perspective depth of field.",
      evidenceRefs: ["exif_header_parser"],
      provider: "truthlens_forensics_core",
      model: "exif_parser_v1",
      version: "2026.1",
      createdAt: new Date().toISOString(),
    },
  ],
  claimFindings: [
    {
      id: "fnd_sample_5",
      analysisId: "sample_demo_analysis",
      domain: "claim_verification",
      findingType: "source_agreement",
      label: "Multiple Wire Corroboration",
      score: 0.88,
      calibrationRef: "Wire-Corroboration-Index",
      explanation:
        "Key assertions match published news reports and meteorology advisories across independent newsrooms and wire services.",
      evidenceRefs: ["src_sample_1", "src_sample_2"],
      provider: "truthlens_claim_core",
      model: "cross_registry_matcher",
      version: "2026.1",
      createdAt: new Date().toISOString(),
    },
  ],
  sources: [
    {
      id: "src_sample_1",
      analysisId: "sample_demo_analysis",
      url: "https://www.reuters.com/world/weather-record-archive",
      canonicalUrl: "https://www.reuters.com/world/weather-record-archive",
      publisher: "Reuters",
      title: "Coastal weather monitoring bulletin releases advisory",
      publishedAt: "2026-03-01T12:00:00Z",
      updatedAt: null,
      accessedAt: new Date().toISOString(),
      excerpt:
        "Meteorological stations recorded heavy maritime swells matching satellite visual timelines along the northern peninsula.",
      sourceType: "primary",
      retrievalMetadata: {},
      citations: [
        {
          id: "cit_sample_1",
          findingId: "fnd_sample_5",
          sourceId: "src_sample_1",
          relation: "supports",
          excerptHash: "a1b2c3d4",
          locator: "https://www.reuters.com/world/weather-record-archive",
        },
      ],
    },
    {
      id: "src_sample_2",
      analysisId: "sample_demo_analysis",
      url: "https://apnews.com/article/press-verification-archive",
      canonicalUrl: "https://apnews.com/article/press-verification-archive",
      publisher: "Associated Press",
      title: "Regional wire update: Maritime conditions confirmed",
      publishedAt: "2026-03-01T13:30:00Z",
      updatedAt: null,
      accessedAt: new Date().toISOString(),
      excerpt:
        "Port authority statements corroborated high tide levels reaching benchmark records without anomalous structural collapse.",
      sourceType: "news",
      retrievalMetadata: {},
      citations: [],
    },
  ],
  timeline: [
    { timestamp: "2026-03-01T14:00:00Z", stage: "intake", event: "File validated; SHA-256 computed." },
    { timestamp: "2026-03-01T14:00:01Z", stage: "metadata_extraction", event: "Sensor metadata & quantization parsed." },
    { timestamp: "2026-03-01T14:00:02Z", stage: "provenance_check", event: "Container headers evaluated for C2PA." },
    { timestamp: "2026-03-01T14:00:03Z", stage: "media_signals", event: "Spectral anomalies and texture frequencies examined." },
    { timestamp: "2026-03-01T14:00:04Z", stage: "source_retrieval", event: "News registries queried via SSRF-safe egress." },
    { timestamp: "2026-03-01T14:00:05Z", stage: "synthesis", event: "Assessment synthesized and verified." },
  ],
  methodsAndLimitations: [
    "Absence of cryptographic C2PA provenance credentials does not indicate manipulation; most consumer cameras and social networks strip metadata.",
    "Model scores reflect calibrated similarity to known training distributions and should not be interpreted as absolute forensic proof.",
    "Source verification reflects index snapshots available at time of query; newly emerging developments may update conclusions.",
  ],
  disclaimer:
    "TruthLens AI provides calibrated decision-support evidence and signals. It is not a legal forensics authority and does not replace human editorial or investigative judgment.",
  providerAttribution: {
    primaryProvider: "TruthLens Core",
    model: "v1-deterministic-calibrated",
    modelVersion: "2026.1",
    analysisVersion: "1.0.0",
  },
  createdAt: "2026-03-01T14:00:00Z",
  completedAt: "2026-03-01T14:00:05Z",
};

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<"analyze" | "history" | "settings">("analyze");
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [resultData, setResultData] = useState<AnalysisResultResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartNew = () => {
    setActiveAnalysisId(null);
    setResultData(null);
    setCurrentTab("analyze");
  };

  const handleSubmitAnalysis = async (data: FormData | Record<string, unknown>, isMultipart: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/v1/analyses"), {
        method: "POST",
        body: isMultipart ? (data as FormData) : JSON.stringify(data),
        headers: isMultipart ? {} : { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to submit analysis");
      }

      const resData = await res.json();
      setActiveAnalysisId(resData.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalysisCompleted = async () => {
    if (!activeAnalysisId) return;
    try {
      const res = await fetch(apiUrl("/api/v1/analyses/" + activeAnalysisId + "/result"));
      if (res.ok) {
        const fullResult = await res.json();
        setResultData(fullResult);
        setActiveAnalysisId(null);
      }
    } catch (err) {
      console.error("Failed to load result", err);
    }
  };

  const handleCancelAnalysis = async () => {
    if (activeAnalysisId) {
      await fetch(apiUrl("/api/v1/analyses/" + activeAnalysisId), { method: "DELETE" });
    }
    setActiveAnalysisId(null);
  };

  const handleSelectFromHistory = async (id: string) => {
    try {
      const res = await fetch(apiUrl("/api/v1/analyses/" + id + "/result"));
      if (res.ok) {
        const fullResult = await res.json();
        setResultData(fullResult);
        setCurrentTab("analyze");
      }
    } catch (err) {
      console.error("Failed to open history item", err);
    }
  };

  const handleLoadSample = () => {
    setResultData(SAMPLE_RESULT);
    setActiveAnalysisId(null);
    setCurrentTab("analyze");
  };

  return (
    <div className="app-shell min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== "analyze") {
            setResultData(null);
            setActiveAnalysisId(null);
          }
        }}
        onNewAnalysis={handleStartNew}
      />

      <main
        id="main-content"
        role="main"
        className="app-main flex-1"
      >
        <div
          id="tabpanel-content"
          role="tabpanel"
          aria-labelledby={`tab-${currentTab}`}
          className="focus-visible:outline-none"
        >
          {currentTab === "analyze" && (
            <>
              {activeAnalysisId ? (
                <ProgressViewer
                  analysisId={activeAnalysisId}
                  onCompleted={handleAnalysisCompleted}
                  onCancel={handleCancelAnalysis}
                />
              ) : resultData ? (
                <ResultView data={resultData} onNewAnalysis={handleStartNew} />
              ) : (
                <AnalysisForm
                  onSubmit={handleSubmitAnalysis}
                  onLoadSample={handleLoadSample}
                  isLoading={isSubmitting}
                />
              )}
            </>
          )}

          {currentTab === "history" && (
            <HistoryView onSelectAnalysis={handleSelectFromHistory} />
          )}

          {currentTab === "settings" && <SettingsView />}
        </div>
      </main>

      <footer className="site-footer py-6 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TruthLens AI · Calibrated Media Forensics & Claim Verification</span>
          <span className="text-[11px] text-foreground/50">
            Decision-support evidence workspace · Not a legal or judicial forensics authority
          </span>
        </div>
      </footer>
    </div>
  );
}
