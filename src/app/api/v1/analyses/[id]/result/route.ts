import { NextRequest, NextResponse } from "next/server";
import { ReportGenerator } from "@/lib/reports/generator";
import crypto from "node:crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await ReportGenerator.generateReport(id);
    return NextResponse.json(report.reportData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: {
          code: "RESULT_NOT_AVAILABLE",
          message: errorMsg,
          requestId: crypto.randomUUID(),
        },
      },
      { status: 404 }
    );
  }
}
