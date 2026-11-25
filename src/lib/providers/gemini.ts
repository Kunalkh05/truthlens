import type { ProviderAdapter, ProviderAnalysisRequest, ProviderFindingResult, ProviderSynthesisResult } from "./types";
import { SkmVault } from "@/lib/security/skm";

export class GeminiProviderAdapter implements ProviderAdapter {
  readonly name = "gemini";
  readonly defaultModel = "gemini-1.5-flash";

  async isAvailable(workspaceId: string | null): Promise<boolean> {
    const key = SkmVault.resolveKey(workspaceId, "gemini");
    return Boolean(key && key.trim().length > 0);
  }

  private getKey(workspaceId: string | null = null): string {
    const key = SkmVault.resolveKey(workspaceId, "gemini");
    if (!key) throw new Error("Gemini API key is not configured in SKM vault or environment");
    return key;
  }

  async analyzeMedia(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]> {
    // If external processing consent not granted or key absent, fail-safe fallback
    const key = SkmVault.resolveKey(null, "gemini");
    if (!key) {
      throw new Error("Gemini key unavailable for media analysis");
    }

    const prompt = `You are a forensic media analysis engine. Examine the following media metadata and description:
Input Type: ${request.inputType}
Extracted Metadata: ${JSON.stringify(request.extractedMetadata || {})}
Claim context: ${request.claimText || "None"}

Provide structured forensic findings separating media authenticity from claim verification.
Return JSON format matching:
[
  {
    "domain": "media_authenticity",
    "findingType": "c2pa_provenance" | "compression_anomaly" | "generative_artifact" | "exif_metadata",
    "label": string,
    "score": number between 0.0 and 1.0 (or null),
    "calibrationRef": string,
    "explanation": string,
    "evidenceRefs": string[]
  }
]
Do not accuse any person or claim certainty. Use calibrated forensic language.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return [];
      return JSON.parse(text) as ProviderFindingResult[];
    } catch {
      // Degrade gracefully with fallback
      return [];
    }
  }

  async verifyClaim(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]> {
    const key = SkmVault.resolveKey(null, "gemini");
    if (!key) {
      throw new Error("Gemini key unavailable for claim verification");
    }

    const sourcesSummary = (request.sources || [])
      .map((s, idx) => `[Source ${idx + 1}] ${s.publisher}: "${s.title}" - Excerpt: ${s.excerpt}`)
      .join("\n\n");

    const prompt = `You are a claim verification specialist. Analyze the claim against the retrieved source evidence.
Claim: "${request.claimText || ""}"

Retrieved Sources:
${sourcesSummary || "No direct sources available."}

Output a JSON array of claim verification findings:
[
  {
    "domain": "claim_verification",
    "findingType": "source_agreement" | "source_contradiction" | "temporal_inconsistency" | "contextual_manipulation",
    "label": string,
    "score": number between 0.0 and 1.0 (or null),
    "calibrationRef": string,
    "explanation": string,
    "evidenceRefs": string[]
  }
]`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return [];
      return JSON.parse(text) as ProviderFindingResult[];
    } catch {
      return [];
    }
  }

  async synthesizeAssessment(
    request: ProviderAnalysisRequest,
    findings: ProviderFindingResult[]
  ): Promise<ProviderSynthesisResult> {
    const key = SkmVault.resolveKey(null, "gemini");
    if (!key) {
      throw new Error("Gemini key unavailable for synthesis");
    }

    const prompt = `Synthesize an assessment for media verification.
Input Type: ${request.inputType}
Claim: ${request.claimText || "N/A"}
Findings: ${JSON.stringify(findings)}

Output JSON:
{
  "assessment": "Supported" | "Mixed" | "Unverified" | "Contradicted" | "Insufficient evidence",
  "summary": string (calibrated, 2-3 sentences),
  "coverageScore": number 0.0 - 1.0,
  "calibratedUncertainty": "low" | "moderate" | "high",
  "methodsAndLimitations": string[]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text) as ProviderSynthesisResult;
  }
}
