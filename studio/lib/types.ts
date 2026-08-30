export type ComputePreference = "wasm" | "webgpu";

export type EnginePhase = "idle" | "loading" | "ready" | "generating" | "error";

export type EngineStatus = {
  phase: EnginePhase;
  label: string;
  progress: number;
  backend?: string;
};

export type GenerateRequest = {
  text: string;
  voice: string;
  speed: number;
  compute: ComputePreference;
};

export type GeneratedAudio = {
  wav: ArrayBuffer;
  duration: number;
  sampleRate: number;
  envelope: number[];
  elapsedMs: number;
  backend: string;
};

export type StudioTake = GeneratedAudio & {
  id: string;
  voice: string;
  voiceName: string;
  text: string;
  speed: number;
  url: string;
  createdAt: string;
};
