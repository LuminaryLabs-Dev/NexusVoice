import { KokoroTTS, type GenerateOptions } from "kokoro-js";
import type { ComputePreference, EngineStatus, GenerateRequest, GeneratedAudio } from "../lib/types";

type ProgressInfo = {
  status: "initiate" | "download" | "progress" | "done" | "ready";
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

type GenerateMessage = { type: "generate"; id: string; request: GenerateRequest };

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const scope = self as DedicatedWorkerGlobalScope;

let engine: KokoroTTS | null = null;
let backend = "";
let loadPromise: Promise<KokoroTTS> | null = null;

function postStatus(status: EngineStatus): void {
  scope.postMessage({ type: "status", status });
}

function makeEnvelope(samples: Float32Array, bars = 96): number[] {
  const values: number[] = [];
  const stride = Math.max(1, Math.floor(samples.length / bars));
  for (let bar = 0; bar < bars; bar += 1) {
    const start = bar * stride;
    const end = Math.min(samples.length, start + stride);
    let peak = 0;
    for (let index = start; index < end; index += 1) {
      peak = Math.max(peak, Math.abs(samples[index]));
    }
    values.push(Math.max(0.05, Math.min(1, peak)));
  }
  return values;
}

function progressReporter(info: ProgressInfo): void {
  if (info.status === "progress") {
    postStatus({
      phase: "loading",
      label: info.file ? `Downloading ${info.file}` : "Downloading the Kokoro model",
      progress: Math.max(0, Math.min(100, Math.round(info.progress ?? 0)))
    });
  } else if (info.status === "initiate" || info.status === "download") {
    postStatus({ phase: "loading", label: "Preparing the local voice model", progress: 2 });
  }
}

async function loadEngine(preference: ComputePreference): Promise<KokoroTTS> {
  if (engine) return engine;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const canUseWebGpu = preference === "webgpu" && "gpu" in navigator;
    if (canUseWebGpu) {
      try {
        postStatus({ phase: "loading", label: "Starting WebGPU voice engine", progress: 1 });
        const loaded = await KokoroTTS.from_pretrained(MODEL_ID, {
          device: "webgpu",
          dtype: "fp32",
          progress_callback: progressReporter
        });
        backend = "WebGPU · FP32";
        engine = loaded;
        postStatus({ phase: "ready", label: "Model cached and ready", progress: 100, backend });
        return loaded;
      } catch (error) {
        console.warn("NexusVoice WebGPU initialization failed; using WASM instead.", error);
        postStatus({ phase: "loading", label: "WebGPU unavailable — switching to WASM", progress: 1 });
      }
    }

    const loaded = await KokoroTTS.from_pretrained(MODEL_ID, {
      device: "wasm",
      dtype: "q8",
      progress_callback: progressReporter
    });
    backend = canUseWebGpu ? "WASM · Q8 fallback" : "WASM · Q8";
    engine = loaded;
    postStatus({ phase: "ready", label: "Model cached and ready", progress: 100, backend });
    return loaded;
  })();

  try {
    return await loadPromise;
  } catch (error) {
    loadPromise = null;
    throw error;
  }
}

scope.addEventListener("message", async (event: MessageEvent<GenerateMessage>) => {
  if (event.data.type !== "generate") return;
  const { id, request } = event.data;

  try {
    const tts = await loadEngine(request.compute);
    postStatus({ phase: "generating", label: `Rendering ${request.voice}`, progress: 100, backend });
    const started = performance.now();
    const audio = await tts.generate(request.text, {
      voice: request.voice as GenerateOptions["voice"],
      speed: request.speed
    });
    const wav = audio.toWav();
    const result: GeneratedAudio = {
      wav,
      duration: audio.audio.length / audio.sampling_rate,
      sampleRate: audio.sampling_rate,
      envelope: makeEnvelope(audio.audio),
      elapsedMs: performance.now() - started,
      backend
    };
    scope.postMessage({ type: "result", id, result }, [wav]);
    postStatus({ phase: "ready", label: "Model cached and ready", progress: 100, backend });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NexusVoice could not generate this take.";
    postStatus({ phase: "error", label: message, progress: 0, backend });
    scope.postMessage({ type: "error", id, message });
  }
});
