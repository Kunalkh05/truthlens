// Core Domain Types for TruthLens AI

export type AssessmentBand =
  | "Supported"
  | "Mixed"
  | "Unverified"
  | "Contradicted"
  | "Insufficient evidence";

export type AnalysisStatus =
  | "queued"
  | "extracting"
  | "checking_provenance"
  | "searching_sources"
  | "synthesizing"
  | "completed"
  | "partial"
  | "failed";

export type StageName =
  | "intake"
  | "metadata_extraction"
  | "provenance_check"
  | "media_signals"
  | "source_retrieval"
  | "claim_corroboration"
  | "synthesis";

export type StageStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type InputType = "image" | "video" | "audio" | "url" | "claim";

export type FindingDomain = "media_authenticity" | "claim_verification";

export type FindingType =
  | "exif_metadata"
  | "c2pa_provenance"
  | "compression_anomaly"
  | "audio_visual_sync"
  | "generative_artifact"
  | "source_agreement"
  | "source_contradiction"
  | "temporal_inconsistency"
  | "contextual_manipulation";

export type CitationRelation = "supports" | "refutes" | "contextualizes" | "inconclusive";

export type UserRole = "admin" | "member" | "viewer";

export interface User {
  id: string;
  authSubject: string;
  createdAt: string;
  status: "active" | "suspended";
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  retentionPolicyDays: number;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
}

export interface Analysis {
  id: string;
  workspaceId: string;
  ownerId: string;
  status: AnalysisStatus;
  inputType: InputType;
  originalObjectKey: string | null;
  originalSha256: string | null;
  sourceUrl: string | null;
  claimText: string | null;
  consentExternal: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deleteAfter: string | null;
}

export interface AnalysisStage {
  id: string;
  analysisId: string;
  name: StageName;
  status: StageStatus;
  startedAt: string | null;
  finishedAt: string | null;
  attempt: number;
  safeErrorCode: string | null;
}

export interface Artifact {
  id: string;
  analysisId: string;
  parentArtifactId: string | null;
  objectKey: string;
  sha256: string;
  mediaType: string;
  kind: "original" | "keyframe" | "waveform" | "transcript" | "report";
  toolName: string;
  toolVersion: string;
  createdAt: string;
  deleteAfter: string | null;
}

export interface Finding {
  id: string;
  analysisId: string;
  domain: FindingDomain;
  findingType: FindingType;
  label: string;
  score: number | null; // Calibrated 0.0 - 1.0 or null
  calibrationRef: string | null;
  explanation: string;
  evidenceRefs: string[];
  provider: string;
  model: string;
  version: string;
  createdAt: string;
}

export interface Source {
  id: string;
  analysisId: string;
  url: string;
  canonicalUrl: string;
  publisher: string;
  title: string;
  publishedAt: string | null;
  updatedAt: string | null;
  accessedAt: string;
  excerpt: string;
  sourceType: "primary" | "news" | "factcheck" | "official" | "archived" | "general";
  retrievalMetadata: Record<string, unknown>;
}

export interface Citation {
  id: string;
  findingId: string;
  sourceId: string;
  relation: CitationRelation;
  excerptHash: string;
  locator: string | null;
}

export interface ProviderSecret {
  id: string;
  workspaceId: string | null;
  provider: "gemini" | "openrouter";
  label: string;
  ciphertext: string;
  nonce: string;
  wrappedDek: string;
  kekId: string;
  keyVersion: number;
  status: "active" | "revoked";
  createdAt: string;
  rotatedAt: string | null;
}

export interface AuditEvent {
  id: string;
  workspaceId: string | null;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadataRedacted: Record<string, unknown>;
  createdAt: string;
}

export interface AnalysisResultResponse {
  id: string;
  status: AnalysisStatus;
  inputType: InputType;
  assessment: AssessmentBand;
  summary: string;
  confidenceCoverage: {
    signalsExamined: number;
    sourcesConsulted: number;
    coverageScore: number; // 0.0 - 1.0 coverage completeness
    calibratedUncertainty: "low" | "moderate" | "high";
  };
  mediaFindings: Finding[];
  claimFindings: Finding[];
  sources: (Source & { citations: Citation[] })[];
  timeline: {
    timestamp: string;
    stage: string;
    event: string;
  }[];
  methodsAndLimitations: string[];
  disclaimer: string;
  providerAttribution: {
    primaryProvider: string;
    model: string;
    modelVersion: string;
    analysisVersion: string;
  };
  createdAt: string;
  completedAt: string | null;
}
