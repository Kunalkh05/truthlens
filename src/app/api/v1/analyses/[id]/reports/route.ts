import { NextRequest, NextResponse } from "next/server";
import { ReportGenerator } from "@/lib/reports/generator";
import crypto from "node:crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportResult = await ReportGenerator.generateReport(id);

    return NextResponse.json({
      reportId: reportResult.reportId,
      objectKey: reportResult.objectKey,
      sha256: reportResult.sha256,
      downloadUrl: reportResult.downloadUrl,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: {
          code: "REPORT_GENERATION_FAILED",
          message: errorMsg,
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
