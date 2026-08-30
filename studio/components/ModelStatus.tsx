import type { ComputePreference, EngineStatus } from "../lib/types";

type ModelStatusProps = {
  status: EngineStatus;
  compute: ComputePreference;
  webGpuAvailable: boolean;
};

export function ModelStatus({ status, compute, webGpuAvailable }: ModelStatusProps) {
  const isActive = status.phase === "loading" || status.phase === "generating";
  const displayProgress = status.phase === "generating" ? 100 : status.progress;

  return (
    <section className={`model-status model-status--${status.phase}`} aria-live="polite">
      <div className="model-status__head">
        <span className="model-status__signal" aria-hidden="true" />
        <div>
          <span className="eyebrow">Local model</span>
          <strong>{status.label}</strong>
        </div>
        <span className="model-status__percent">
          {status.phase === "idle" ? "WAITING" : status.phase === "error" ? "ERROR" : isActive ? `${displayProgress}%` : "READY"}
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${status.phase === "idle" ? 0 : displayProgress}%` }} />
      </div>
      <div className="model-status__meta">
        <span>{status.backend ?? (compute === "wasm" ? "WASM · Q8" : "WebGPU · FP32")}</span>
        <span>{compute === "webgpu" && !webGpuAvailable ? "Will fall back to WASM" : "Text stays on this device"}</span>
      </div>
    </section>
  );
}
