import { describe, it, expect } from "vitest";
import { MediaForensicsPipeline } from "@/lib/pipeline/forensics";

describe("Media Forensics Pipeline", () => {
  it("detects JPEG magic bytes and parses container features", async () => {
    // Construct valid JPEG SOI and APP0 headers
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const dummyPayload = Buffer.alloc(100, 0x42);
    const jpegBuffer = Buffer.concat([jpegHeader, dummyPayload]);

    const report = await MediaForensicsPipeline.analyzeBuffer(jpegBuffer, "image/jpeg");
    expect(report.detectedFormat).toBe("image/jpeg");
    expect(report.sha256).toHaveLength(64);
    expect(report.hasC2paSignature).toBe(false);
    expect(report.findings.length).toBeGreaterThan(0);

    const c2paFinding = report.findings.find((f) => f.findingType === "c2pa_provenance");
    expect(c2paFinding).toBeDefined();
    expect(c2paFinding?.domain).toBe("media_authenticity");
  });

  it("detects C2PA provenance manifest if signature bytes present", async () => {
    const c2paBuffer = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.from("urn:uuid:c2pa:test-manifest-jumbf-container"),
    ]);

    const report = await MediaForensicsPipeline.analyzeBuffer(c2paBuffer, "image/jpeg");
    expect(report.hasC2paSignature).toBe(true);
    const c2paFinding = report.findings.find((f) => f.findingType === "c2pa_provenance");
    expect(c2paFinding?.score).toBe(0.95);
  });

  it("detects MP4 video container and computes audio-visual coherence signal", async () => {
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp
      0x69, 0x73, 0x6f, 0x6d,
    ]);
    const mp4Buffer = Buffer.concat([mp4Header, Buffer.alloc(200, 0x11)]);

    const report = await MediaForensicsPipeline.analyzeBuffer(mp4Buffer, "video/mp4");
    expect(report.detectedFormat).toBe("video/mp4");
    expect(report.audioVisualSyncScore).toBeDefined();
  });
});
