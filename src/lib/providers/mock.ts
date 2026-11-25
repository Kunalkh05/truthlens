import type { ProviderAdapter, ProviderAnalysisRequest, ProviderFindingResult, ProviderSynthesisResult } from "./types";

export class MockProviderAdapter implements ProviderAdapter {
  readonly name = "mock_offline";
  readonly defaultModel = "truthlens-deterministic-v1";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async analyzeMedia(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]> {
    const findings: ProviderFindingResult[] = [];

    // Media authenticity findings
    if (request.inputType === "image" || request.inputType === "video") {
      findings.push({
        domain: "media_authenticity",
        findingType: "c2pa_provenance",
        label: "Content Credentials / Provenance",
        score: null,
        calibrationRef: "C2PA-v2.1-Spec",
        explanation: "No cryptographically signed C2PA or Coalition for Content Provenance and Authenticity manifest found embedded in media container.",
        evidenceRefs: ["container_header_analysis", "exif_c2pa_manifest_scan"],
      });

      findings.push({
        domain: "media_authenticity",
        findingType: "compression_anomaly",
        label: "Compression & Quantization Uniformity",
        score: 0.22,
        calibrationRef: "ISO-10918-DCT-Quantization-Baseline",
        explanation: "Discrete Cosine Transform (DCT) block grids demonstrate consistent quantizer matrix coefficients across all image quadrants, with no high-frequency edge discontinuities.",
        evidenceRefs: ["dct_grid_analysis", "resampling_frequency_spectrum"],
      });

      findings.push({
        domain: "media_authenticity",
        findingType: "generative_artifact",
        label: "Diffusion Synthesis & Texture Artifacts",
        score: 0.18,
        calibrationRef: "Synthetic-Texture-Benchmark-2026",
        explanation: "Spectral frequency distribution exhibits natural sensor photon noise without typical checkerboard deconvolution artifacts or anomalous boundary halos.",
        evidenceRefs: ["frequency_domain_laplacian", "fourier_spectral_decay"],
      });
    }

    if (request.inputType === "video" || request.inputType === "audio") {
      findings.push({
        domain: "media_authenticity",
        findingType: "audio_visual_sync",
        label: "Acoustic Envelope & Lip Synchronization",
        score: 0.88,
        calibrationRef: "AV-Sync-Benchmark-v1",
        explanation: "Phonetic syllable transitions match observed labial movements within acceptable 40ms acoustic buffer.",
        evidenceRefs: ["phoneme_viseme_alignment", "waveform_spectral_flux"],
      });
    }

    return findings;
  }

  async verifyClaim(request: ProviderAnalysisRequest): Promise<ProviderFindingResult[]> {
    const findings: ProviderFindingResult[] = [];
    const claim = (request.claimText || "").toLowerCase();

    if (claim.includes("deepfake") || claim.includes("fake") || claim.includes("hoax")) {
      findings.push({
        domain: "claim_verification",
        findingType: "source_contradiction",
        label: "Multiple Independent Sources Refute Claim",
        score: 0.85,
        calibrationRef: "Claim-Corroboration-Index-v1",
        explanation: "Corroborated news registries and verifiable wire service archives contradict the proposition asserting this event never transpired.",
        evidenceRefs: ["source_reuters_2026", "source_ap_archive_2026"],
      });
    } else {
      findings.push({
        domain: "claim_verification",
        findingType: "source_agreement",
        label: "Verified Source Corroboration",
        score: 0.78,
        calibrationRef: "Wire-Corroboration-Benchmark",
        explanation: "Key propositions match contemporary reporting from multiple independent wire services and official documentation.",
        evidenceRefs: ["source_verified_wire_01", "source_verified_wire_02"],
      });
    }

    return findings;
  }

  async synthesizeAssessment(
    request: ProviderAnalysisRequest,
    findings: ProviderFindingResult[]
  ): Promise<ProviderSynthesisResult> {
    const hasContradiction = findings.some((f) => f.findingType === "source_contradiction");
    const hasAgreement = findings.some((f) => f.findingType === "source_agreement");
    const hasHighAnomaly = findings.some((f) => (f.score ?? 0) > 0.7 && f.domain === "media_authenticity");

    let assessment: "Supported" | "Mixed" | "Unverified" | "Contradicted" | "Insufficient evidence" = "Supported";

    if (hasContradiction) {
      assessment = "Contradicted";
    } else if (hasHighAnomaly && hasAgreement) {
      assessment = "Mixed";
    } else if (!hasAgreement && !hasContradiction) {
      assessment = "Unverified";
    }

    return {
      assessment,
      summary:
        assessment === "Contradicted"
          ? "Independent primary sources and archival records contradict the submitted claim. Technical media signals do not show evidence of AI synthesis, indicating potential out-of-context presentation."
          : assessment === "Mixed"
          ? "Analysis identified divergent signals: while factual reporting corroborates parts of the event, compression anomalies or visual inconsistencies suggest potential editing or splicing."
          : "Corroborating reporting from established news organizations supports the core claims, and media inspection exhibits authentic sensor noise characteristics.",
      coverageScore: 0.85,
      calibratedUncertainty: "low",
      methodsAndLimitations: [
        "Absence of cryptographic C2PA provenance credentials does not necessarily indicate manipulation, as many consumer cameras and social networks strip metadata.",
        "Model scores reflect calibrated similarity to known training distributions and should not be interpreted as absolute forensic proof.",
        "Source verification reflects index snapshots available at time of query; newly emerging developments may update conclusions.",
      ],
    };
  }
}
