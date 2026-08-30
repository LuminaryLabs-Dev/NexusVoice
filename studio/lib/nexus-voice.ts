import type { EngineStatus, GenerateRequest, GeneratedAudio } from "./types";

type WorkerStatusMessage = { type: "status"; status: EngineStatus };
type WorkerResultMessage = { type: "result"; id: string; result: GeneratedAudio };
type WorkerErrorMessage = { type: "error"; id?: string; message: string };
type WorkerMessage = WorkerStatusMessage | WorkerResultMessage | WorkerErrorMessage;

type PendingGeneration = {
  resolve: (audio: GeneratedAudio) => void;
  reject: (error: Error) => void;
};

export class NexusVoiceBrowserEngine {
  private readonly worker: Worker;
  private readonly pending = new Map<string, PendingGeneration>();
  private readonly onStatus: (status: EngineStatus) => void;

  constructor(onStatus: (status: EngineStatus) => void) {
    this.onStatus = onStatus;
    this.worker = new Worker(new URL("../workers/tts.worker.ts", import.meta.url), {
      type: "module",
      name: "nexusvoice-tts"
    });
    this.worker.addEventListener("message", this.handleMessage);
    this.worker.addEventListener("error", this.handleWorkerError);
  }

  generate(request: GenerateRequest): Promise<GeneratedAudio> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type: "generate", id, request });
    });
  }

  dispose(): void {
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.removeEventListener("error", this.handleWorkerError);
    this.worker.terminate();
    for (const pending of this.pending.values()) {
      pending.reject(new Error("NexusVoice Studio closed the speech worker."));
    }
    this.pending.clear();
  }

  private readonly handleMessage = (event: MessageEvent<WorkerMessage>): void => {
    const message = event.data;
    if (message.type === "status") {
      this.onStatus(message.status);
      return;
    }

    if (message.type === "result") {
      const pending = this.pending.get(message.id);
      if (pending) {
        this.pending.delete(message.id);
        pending.resolve(message.result);
      }
      return;
    }

    const error = new Error(message.message);
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (pending) {
        this.pending.delete(message.id);
        pending.reject(error);
      }
    } else {
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    }
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    const error = new Error(event.message || "The NexusVoice speech worker stopped unexpectedly.");
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
    this.onStatus({ phase: "error", label: error.message, progress: 0 });
  };
}
