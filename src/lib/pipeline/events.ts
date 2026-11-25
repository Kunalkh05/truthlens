import { EventEmitter } from "node:events";

export interface AnalysisPipelineEvent {
  analysisId: string;
  stage: string;
  status: "started" | "progress" | "completed" | "failed";
  message: string;
  timestamp: string;
  safeErrorCode?: string;
}

class PipelineEventEmitter extends EventEmitter {
  emitEvent(event: AnalysisPipelineEvent): void {
    this.emit(`analysis:${event.analysisId}`, event);
  }

  subscribe(analysisId: string, listener: (event: AnalysisPipelineEvent) => void): () => void {
    const eventName = `analysis:${analysisId}`;
    this.on(eventName, listener);
    return () => {
      this.off(eventName, listener);
    };
  }
}

export const pipelineEvents = new PipelineEventEmitter();
