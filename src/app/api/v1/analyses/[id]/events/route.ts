import { NextRequest } from "next/server";
import { pipelineEvents } from "@/lib/pipeline/events";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  writer.write(
    encoder.encode(`event: connected\ndata: ${JSON.stringify({ analysisId: id, connectedAt: new Date().toISOString() })}\n\n`)
  );

  const unsubscribe = pipelineEvents.subscribe(id, (event) => {
    writer.write(encoder.encode(`event: stage_update\ndata: ${JSON.stringify(event)}\n\n`));
    if (event.status === "completed" || event.status === "failed") {
      writer.close();
      unsubscribe();
    }
  });

  req.signal.addEventListener("abort", () => {
    unsubscribe();
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
