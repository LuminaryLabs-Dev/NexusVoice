"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { NexusVoiceBrowserEngine } from "../lib/nexus-voice";
import type { ComputePreference, EngineStatus, StudioTake } from "../lib/types";
import { getVoice } from "../lib/voices";
import { formatDuration, formatGenerationTime } from "../lib/wav-export";
import { AudioPlayer } from "./AudioPlayer";
import { ModelStatus } from "./ModelStatus";
import { VoiceSelector } from "./VoiceSelector";

const DEFAULT_LINE = "The dragon filed a complaint. Apparently the treasure was not emotionally fulfilling.";
const MAX_CHARACTERS = 600;

const INITIAL_STATUS: EngineStatus = {
  phase: "idle",
  label: "Ready when you are",
  progress: 0
};

export function Studio() {
  const [text, setText] = useState(DEFAULT_LINE);
  const [voice, setVoice] = useState("af_heart");
  const [speed, setSpeed] = useState(0.96);
  const [compute, setCompute] = useState<ComputePreference>("wasm");
  const [status, setStatus] = useState<EngineStatus>(INITIAL_STATUS);
  const [takes, setTakes] = useState<StudioTake[]>([]);
  const [currentTakeId, setCurrentTakeId] = useState<string | null>(null);
  const [webGpuAvailable, setWebGpuAvailable] = useState(false);
  const engineRef = useRef<NexusVoiceBrowserEngine | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    setWebGpuAvailable("gpu" in navigator);
    const engine = new NexusVoiceBrowserEngine(setStatus);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
    };
  }, []);

  const currentTake = useMemo(
    () => takes.find((take) => take.id === currentTakeId) ?? takes[0] ?? null,
    [currentTakeId, takes]
  );
  const isBusy = status.phase === "loading" || status.phase === "generating";
  const computeLocked = status.phase !== "idle" && status.phase !== "error";

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) {
      setStatus({ phase: "error", label: "Write a line before generating.", progress: 0 });
      return;
    }
    if (!engineRef.current || isBusy) return;

    try {
      setStatus({ phase: "loading", label: "Preparing the local voice model", progress: 1 });
      const result = await engineRef.current.generate({ text: cleaned, voice, speed, compute });
      const createdAt = new Date().toISOString();
      const url = URL.createObjectURL(new Blob([result.wav], { type: "audio/wav" }));
      urlsRef.current.push(url);
      const selected = getVoice(voice);
      const take: StudioTake = {
        ...result,
        id: crypto.randomUUID(),
        voice,
        voiceName: selected.name,
        text: cleaned,
        speed,
        url,
        createdAt
      };
      setTakes((previous) => {
        const allTakes = [take, ...previous];
        for (const discarded of allTakes.slice(8)) {
          URL.revokeObjectURL(discarded.url);
          urlsRef.current = urlsRef.current.filter((url) => url !== discarded.url);
        }
        return allTakes.slice(0, 8);
      });
      setCurrentTakeId(take.id);
    } catch (error) {
      setStatus({
        phase: "error",
        label: error instanceof Error ? error.message : "NexusVoice could not generate this take.",
        progress: 0
      });
    }
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="NexusVoice Studio home">
          <span className="brand__mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>NexusVoice</span>
          <em>Studio</em>
        </a>
        <div className="header-status">
          <span className="header-status__dot" />
          LOCAL · PRIVATE · PREVIEW
        </div>
        <a className="repo-link" href="https://github.com/LuminaryLabs-Dev/NexusVoice" target="_blank" rel="noreferrer">
          View source <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero__index">NV / 001</div>
        <div className="hero__copy">
          <p className="kicker">A local voice instrument for games</p>
          <h1>Give the line<br />a <span>voice.</span></h1>
          <p className="hero__intro">
            Write dialogue, direct a performer, and leave with a production-ready WAV.
            Your text and audio never leave this browser.
          </p>
        </div>
        <div className="hero__stamp" aria-hidden="true">
          <span>82M</span>
          <small>KOKORO<br />PARAMETERS</small>
        </div>
      </section>

      <section className="studio-grid" aria-label="NexusVoice generator">
        <form className="composer" onSubmit={generate}>
          <div className="panel-heading">
            <div>
              <span className="panel-number">01</span>
              <div>
                <span className="eyebrow">Compose</span>
                <h2>Direct the performance</h2>
              </div>
            </div>
            <span className="character-count">{text.length} / {MAX_CHARACTERS}</span>
          </div>

          <label className="sr-only" htmlFor="dialogue">Dialogue</label>
          <textarea
            id="dialogue"
            value={text}
            maxLength={MAX_CHARACTERS}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write the next line…"
            disabled={isBusy}
          />

          <div className="direction-grid">
            <VoiceSelector value={voice} onChange={setVoice} disabled={isBusy} />
            <div className="speed-field">
              <div className="field-label-row">
                <label htmlFor="speed">Pace</label>
                <output htmlFor="speed">{speed.toFixed(2)}×</output>
              </div>
              <input
                id="speed"
                type="range"
                min="0.70"
                max="1.25"
                step="0.01"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                disabled={isBusy}
              />
              <div className="range-labels"><span>Measured</span><span>Urgent</span></div>
            </div>
          </div>

          <fieldset className="compute-field" disabled={computeLocked || isBusy}>
            <legend>Compute</legend>
            <label className={compute === "wasm" ? "compute-option compute-option--selected" : "compute-option"}>
              <input type="radio" name="compute" value="wasm" checked={compute === "wasm"} onChange={() => setCompute("wasm")} />
              <span><strong>Compatible</strong><small>Q8 · about 100 MB · every modern browser</small></span>
            </label>
            <label className={compute === "webgpu" ? "compute-option compute-option--selected" : "compute-option"}>
              <input type="radio" name="compute" value="webgpu" checked={compute === "webgpu"} onChange={() => setCompute("webgpu")} />
              <span><strong>WebGPU</strong><small>{webGpuAvailable ? "FP32 · faster on a capable GPU" : "Not detected · automatic WASM fallback"}</small></span>
            </label>
          </fieldset>

          <ModelStatus status={status} compute={compute} webGpuAvailable={webGpuAvailable} />

          <button className="generate-button" type="submit" disabled={isBusy || !text.trim()}>
            <span>{status.phase === "loading" ? `Loading model · ${status.progress}%` : status.phase === "generating" ? "Rendering voice…" : "Generate voice"}</span>
            <span className="generate-button__icon" aria-hidden="true">▶</span>
          </button>
          <p className="first-run-note">First generation downloads the selected model. Later takes use the browser cache.</p>
        </form>

        <div className="output-panel">
          <div className="panel-heading panel-heading--output">
            <div>
              <span className="panel-number">02</span>
              <div>
                <span className="eyebrow">Monitor</span>
                <h2>Listen to the take</h2>
              </div>
            </div>
          </div>
          <AudioPlayer take={currentTake} busy={isBusy} />
        </div>
      </section>

      <section className="takes-section" aria-labelledby="takes-heading">
        <div className="takes-heading">
          <div>
            <span className="panel-number">03</span>
            <div>
              <span className="eyebrow">Compare</span>
              <h2 id="takes-heading">Voice takes</h2>
            </div>
          </div>
          <span>{takes.length ? `${takes.length} in this session` : "Generate multiple voices to compare"}</span>
        </div>

        {takes.length ? (
          <div className="take-list">
            {takes.map((take, index) => (
              <button
                key={take.id}
                type="button"
                className={take.id === currentTake?.id ? "take-row take-row--active" : "take-row"}
                onClick={() => setCurrentTakeId(take.id)}
              >
                <span className="take-row__index">{String(takes.length - index).padStart(2, "0")}</span>
                <span className="take-row__voice"><strong>{take.voiceName}</strong><small>{take.voice} · {take.speed.toFixed(2)}×</small></span>
                <span className="take-row__line">“{take.text}”</span>
                <span className="take-row__metric"><strong>{formatDuration(take.duration)}</strong><small>{formatGenerationTime(take.elapsedMs)}</small></span>
                <span className="take-row__arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="take-list-empty">
            <span>NO TAKES YET</span>
            <p>Try the same line with Heart, Fenrir, and Emma. Every result stays available until this tab closes.</p>
          </div>
        )}
      </section>

      <section className="privacy-strip">
        <div className="privacy-strip__mark" aria-hidden="true">◎</div>
        <div>
          <span className="eyebrow">Private by architecture</span>
          <h2>Speech happens here.<br />Not on our server.</h2>
        </div>
        <p>
          Kokoro runs through ONNX Runtime Web on your device. Model files are cached by your browser;
          dialogue and generated audio are never uploaded by NexusVoice Studio.
        </p>
      </section>

      <footer>
        <span>NEXUSVOICE STUDIO · 0.1.0-PREVIEW.1</span>
        <span>Technical preview · evaluation only · <a href="https://github.com/LuminaryLabs-Dev/NexusVoice/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">third-party notices</a></span>
        <span>© 2026 LUMINARY LABS</span>
      </footer>
    </main>
  );
}
