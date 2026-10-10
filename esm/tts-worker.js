// NexusVoice worker; model weights always loaded from Hugging Face.
const scope = self;
const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
let tts = null;
let loader = null;
let backendName = "";

async function setup(backend) {
  if (tts) return tts;
  if (loader) return loader;
  loader = (async () => {
    // esm.sh provides a transitive browser ESM bundle; don't use Node's native resolver.
    const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1?bundle");
    const webgpu = (backend !== "wasm" && "gpu" in navigator);
    if (webgpu) {
      try {
        scope.postMessage({ type: "status", phase: "loading", backend: "webgpu" });
        tts = await KokoroTTS.from_pretrained(MODEL, {
          device: "webgpu", dtype: "fp32"
        });
        backendName = "webgpu/fp32";
        return tts;
      } catch (error) {
        scope.postMessage({ type: "status", phase: "fallback", message: String(error) });
        if (backend === "webgpu") throw error;
      }
    }
    tts = await KokoroTTS.from_pretrained(MODEL, { device: "wasm", dtype: "q8" });
    backendName = "wasm/q8";
    return tts;
  })();
  try { return await loader; } catch (error) { loader = null; throw error; }
}

scope.onmessage = async event => {
  const { type, id, text, voice, speed, backend } = event.data;
  try {
    const model = await setup(backend || "auto");
    if (type === "load") {
      scope.postMessage({ type: "result", id, backend: backendName });
    } else if (type === "generate") {
      const audio = await model.generate(text, { voice, speed });
      const wav = audio.toWav();
      scope.postMessage({ type: "result", id, wav, backend: backendName }, [wav]);
    } else {
      scope.postMessage({ type: "error", id, message: "Unknown command" });
    }
  } catch (error) {
    scope.postMessage({ type: "error", id, message: String(error?.message || error) });
  }
};
