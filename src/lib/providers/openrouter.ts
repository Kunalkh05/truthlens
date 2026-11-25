import type { ProviderAdapter, ProviderAnalysisRequest, ProviderFindingResult, ProviderSynthesisResult } from "./types";
import { SkmVault } from "@/lib/security/skm";

export class OpenRouterProviderAdapter implements ProviderAdapter {
  readonly name = "openrouter";
  readonly defaultModel = "anthropic/claude-3.5-sonnet";

  async isAvailable(workspaceId: string | null): Promise<boolean> {
    const key = SkmVault.resolveKey(workspaceId, "openrouter");
    return Boolean(key && key.trim().length > 0);
  }

  private getKey(workspaceId: string | null = null): string {
    const key = SkmVault.resolveKey(workspaceId, "openrouter");
    if (!key) throw new Error("OpenRouter API key is not configured");
    return key;
  }

  async analyzeMedia(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]> {
    const key = this.getKey();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://truthlens.ai",
        "X-Title": "TruthLens AI",
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: "You are a forensic analyst. Output JSON array of findings only. Never accuse individuals.",
          },
          {
            role: "user",
            content: `Analyze media metadata: ${JSON.stringify(request.extractedMetadata)} for claim ${request.claimText || "None"}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter API error ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    return JSON.parse(content);
  }

  async verifyClaim(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]> {
    const key = this.getKey();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://truthlens.ai",
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: "You are a claim verifier. Output JSON array of claim verification findings only.",
          },
          {
            role: "user",
            content: `Verify claim: "${request.claimText}" with sources: ${JSON.stringify(request.sources)}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter API error ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    return JSON.parse(content);
  }

  async synthesizeAssessment(
    request: ProviderAnalysisRequest,
    findings: ProviderFindingResult[]
  ): Promise<ProviderSynthesisResult> {
    const key = this.getKey();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: "Synthesize calibrated assessment. Output JSON object.",
          },
          {
            role: "user",
            content: `Findings: ${JSON.stringify(findings)}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter synthesis failed: ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.choices?.[0]?.message?.content || "{}");
  }
}
