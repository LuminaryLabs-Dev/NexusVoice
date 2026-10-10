/** Stable cross-repository browser ESM adapter for NexusVoice Kokoro. */
export const NEXUSVOICE_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";

export class NexusVoiceBrowser {
  constructor({ voice = "af_heart", speed = 0.96, backend = "auto", workerFactory } = {}) {
    this.voice = voice;
    this.speed = speed;
    this.backend = backend;
    this.workerFactory = workerFactory;
    this.callbacks = new Map();
    this.pending = new Map();
    this.sequence = 0;
    this.active = null;
    this.loaded = false;
    this.disposed = false;
  }
  on(event, callback) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    this.callbacks.get(event).add(callback);
    return () => this.callbacks.get(event)?.delete(callback);
  }
  emit(event, data) { for (const cb of this.callbacks.get(event) || []) cb(data); }
  ensureWorker() {
    if (this.worker) return;
    if (this.disposed) throw new Error("NexusVoiceBrowser disposed");
    if (this.workerFactory) this.worker = this.workerFactory();
    else {
      if (typeof Worker === "undefined") throw new Error("Browser Worker unavailable");
      // Workers instantiated from a cross-origin jsDelivr ESM URL must be same-origin:
      // a Blob bootstrap imports the versioned worker module from the CDN.
      const url = new URL("./tts-worker.js", import.meta.url).href;
      const bootstrap = URL.createObjectURL(new Blob([
        "import " + JSON.stringify(url) + ";"
      ], { type: "text/javascript" }));
      try { this.worker = new Worker(bootstrap, { type: "module" }); }
      finally { URL.revokeObjectURL(bootstrap); }
    }
    this.worker.onmessage = event => {
      const message = event.data;
      if (message.type === "status") { this.emit("status", message); return; }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.type === "error") pending.reject(new Error(message.message));
      else pending.resolve(message);
    };
    this.worker.onerror = event => {
      const error = new Error(event.message || "NexusVoice worker failed");
      this.emit("error", error);
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    };
  }
  request(type, params = {}) {
    this.ensureWorker();
    const id = String(++this.sequence);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, ...params });
    });
  }
  async load() {
    if (this.loaded) return;
    if (this.loading) return this.loading;
    this.loading = this.request("load", { backend: this.backend }).then(result => {
      this.loaded = true; this.emit("ready", result); return result;
    }).catch(error => { this.loading = null; throw error; });
    return this.loading;
  }
  async generate(text, { voice = this.voice, speed = this.speed } = {}) {
    if (!text || !text.trim()) throw new Error("Speech text required");
    await this.load();
    const result = await this.request("generate", { text, voice, speed });
    return result.wav;
  }
  async speak(text, options = {}) {
    this.stop();
    const token = ++this.sequence;
    this.emit("generating", { text });
    try {
      const wav = await this.generate(text, options);
      if (token !== this.sequence || this.disposed) return false;
      if (typeof Audio === "undefined") throw new Error("HTMLAudioElement unavailable");
      const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
      const player = new Audio(url);
      this.active = { player, url, finish: null };
      return await new Promise((resolve, reject) => {
        const active = this.active;
        const finish = (error = null) => {
          if (active.finished) return;
          active.finished = true;
          player.onended = player.onerror = null;
          player.pause();
          URL.revokeObjectURL(url);
          if (this.active === active) this.active = null;
          if (error) { this.emit("error", error); reject(error); }
          else { this.emit("finished"); resolve(true); }
        };
        active.finish = finish;
        player.onended = () => finish();
        player.onerror = () => finish(new Error("Audio playback failed"));
        player.play().then(() => {
          if (!active.finished) this.emit("started");
        }).catch(error => finish(error));
      });
    } catch (error) {
      if (token === this.sequence) this.emit("error", error);
      throw error;
    }
  }
  stop() {
    ++this.sequence;
    if (this.active) {
      // Cancellation has a separate event; resolve any current speak() promise.
      const active = this.active;
      active.player.pause();
      active.player.onended = active.player.onerror = null;
      URL.revokeObjectURL(active.url);
      this.active = null;
      active.cancel?.();
      this.emit("cancelled");
    }
  }
  isSpeaking() { return Boolean(this.active); }
  dispose() {
    this.stop();
    this.disposed = true;
    for (const pending of this.pending.values()) pending.reject(new Error("NexusVoice disposed"));
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
    this.callbacks.clear();
  }
}
