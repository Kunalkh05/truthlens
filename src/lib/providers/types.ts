export interface ProviderAnalysisRequest {
  taskId: string;
  inputType: "image" | "video" | "audio" | "url" | "claim";
  claimText?: string;
  mediaBase64?: string;
  mediaMimeType?: string;
  extractedMetadata?: Record<string, unknown>;
  sources?: Array<{
    publisher: string;
    title: string;
    url: string;
    excerpt: string;
  }>;
}

export interface ProviderFindingResult {
  domain: "media_authenticity" | "claim_verification";
  findingType:
    | "exif_metadata"
    | "c2pa_provenance"
    | "compression_anomaly"
    | "audio_visual_sync"
    | "generative_artifact"
    | "source_agreement"
    | "source_contradiction"
    | "temporal_inconsistency"
    | "contextual_manipulation";
  label: string;
  score: number | null; // Calibrated 0.0 to 1.0 or null
  calibrationRef: string | null;
  explanation: string;
  evidenceRefs: string[];
}

export interface ProviderSynthesisResult {
  assessment: "Supported" | "Mixed" | "Unverified" | "Contradicted" | "Insufficient evidence";
  summary: string;
  coverageScore: number;
  calibratedUncertainty: "low" | "moderate" | "high";
  methodsAndLimitations: string[];
}

export interface ProviderAdapter {
  readonly name: string;
  readonly defaultModel: string;
  isAvailable(workspaceId: string | null): Promise<boolean>;
  analyzeMedia(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]>;
  verifyClaim(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]>;
  synthesizeAssessment(
    request: ProviderAnalysisRequest,
    findings: ProviderFindingResult[]
  ): Promise<ProviderSynthesisResult>;
}
