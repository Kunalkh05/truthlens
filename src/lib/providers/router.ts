import type { ProviderAdapter, ProviderAnalysisRequest, ProviderFindingResult, ProviderSynthesisResult } from "./types";
import { GeminiProviderAdapter } from "./gemini";
import { OpenRouterProviderAdapter } from "./openrouter";
import { MockProviderAdapter } from "./mock";

export class ProviderRouter {
  private static gemini = new GeminiProviderAdapter();
  private static openrouter = new OpenRouterProviderAdapter();
  private static mock = new MockProviderAdapter();

  /**
   * Dispatches analysis according to routing policy:
   * 1. If externalProcessingConsent is false -> Local Mock/Offline deterministic mode only.
   * 2. Try Gemini if available and configured.
   * 3. Fallback to OpenRouter on transient error if configured.
   * 4. Degrade gracefully to Mock provider if no external provider is configured or reachable.
   */
  static async executeMediaAnalysis(
    workspaceId: string | null,
    consentExternal: boolean,
    request: ProviderAnalysisRequest
  ): Promise<{ findings: ProviderFindingResult[]; provider: string; model: string }> {
    if (!consentExternal) {
      const findings = await this.mock.analyzeMedia(request);
      return { findings, provider: "local_forensics_offline", model: "v1-deterministic" };
    }

    if (await this.gemini.isAvailable(workspaceId)) {
      try {
        const findings = await this.gemini.analyzeMedia(request);
        if (findings && findings.length > 0) {
          return { findings, provider: this.gemini.name, model: this.gemini.defaultModel };
        }
      } catch (err) {
        console.warn("Primary provider (Gemini) failed, checking fallback:", err);
      }
    }

    if (await this.openrouter.isAvailable(workspaceId)) {
      try {
        const findings = await this.openrouter.analyzeMedia(request);
        if (findings && findings.length > 0) {
          return { findings, provider: this.openrouter.name, model: this.openrouter.defaultModel };
        }
      } catch (err) {
        console.warn("Secondary provider (OpenRouter) failed, falling back to local:", err);
      }
    }

    // Deterministic fallback
    const findings = await this.mock.analyzeMedia(request);
    return { findings, provider: this.mock.name, model: this.mock.defaultModel };
  }

  static async executeClaimVerification(
    workspaceId: string | null,
    consentExternal: boolean,
    request: ProviderAnalysisRequest
  ): Promise<{ findings: ProviderFindingResult[]; provider: string; model: string }> {
    if (!consentExternal) {
      const findings = await this.mock.verifyClaim(request);
      return { findings, provider: "local_news_offline", model: "v1-deterministic" };
    }

    if (await this.gemini.isAvailable(workspaceId)) {
      try {
        const findings = await this.gemini.verifyClaim(request);
        if (findings && findings.length > 0) {
          return { findings, provider: this.gemini.name, model: this.gemini.defaultModel };
        }
      } catch (err) {
        console.warn("Gemini claim verification failed, checking fallback:", err);
      }
    }

    if (await this.openrouter.isAvailable(workspaceId)) {
      try {
        const findings = await this.openrouter.verifyClaim(request);
        if (findings && findings.length > 0) {
          return { findings, provider: this.openrouter.name, model: this.openrouter.defaultModel };
        }
      } catch (err) {
        console.warn("OpenRouter claim verification failed:", err);
      }
    }

    const findings = await this.mock.verifyClaim(request);
    return { findings, provider: this.mock.name, model: this.mock.defaultModel };
  }

  static async executeSynthesis(
    workspaceId: string | null,
    consentExternal: boolean,
    request: ProviderAnalysisRequest,
    findings: ProviderFindingResult[]
  ): Promise<{ synthesis: ProviderSynthesisResult; provider: string; model: string }> {
    if (!consentExternal) {
      const synthesis = await this.mock.synthesizeAssessment(request, findings);
      return { synthesis, provider: "local_synthesis", model: "v1-calibrated" };
    }

    if (await this.gemini.isAvailable(workspaceId)) {
      try {
        const synthesis = await this.gemini.synthesizeAssessment(request, findings);
        return { synthesis, provider: this.gemini.name, model: this.gemini.defaultModel };
      } catch (err) {
        console.warn("Gemini synthesis failed, falling back:", err);
      }
    }

    const synthesis = await this.mock.synthesizeAssessment(request, findings);
    return { synthesis, provider: this.mock.name, model: this.mock.defaultModel };
  }
}
