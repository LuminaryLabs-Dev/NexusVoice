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

type Panel = "compose" | "monitor" | "takes";

export function Studio() {
  const [text, setText] = useState(DEFAULT_LINE);
  const [voice, setVoice] = useState("af_heart");
  const [speed, setSpeed] = useState(0.96);
  const [compute, setCompute] = useState<ComputePreference>("wasm");
  const [status, setStatus] = useState<EngineStatus>(INITIAL_STATUS);
  const [takes, setTakes] = useState<StudioTake[]>([]);
  const [currentTakeId, setCurrentTakeId] = useState<string | null>(null);
  const [webGpuAvailable, setWebGpuAvailable] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("compose");
  const [aboutOpen, setAboutOpen] = useState(false);
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

  useEffect(() => {
    function closeOverlay(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (aboutOpen) {
        setAboutOpen(false);
      } else if (activePanel === "takes") {
        setActivePanel("compose");
      }
    }

    document.addEventListener("keydown", closeOverlay);
    return () => document.removeEventListener("keydown", closeOverlay);
  }, [aboutOpen, activePanel]);

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

    setActivePanel("monitor");

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
          urlsRef.current = urlsRef.current.filter((item) => item !== discarded.url);
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

  function showPanel(panel: Panel) {
    setAboutOpen(false);
    setActivePanel(panel);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => showPanel("compose")} aria-label="Open NexusVoice composer">
          <span className="brand__mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>NexusVoice</span>
          <em>Studio</em>
        </button>

        <div className="header-status" aria-live="polite">
          <span className={status.phase === "error" ? "header-status__dot header-status__dot--error" : "header-status__dot"} />
          <span>LOCAL · PRIVATE</span>
          <strong>{status.phase === "idle" ? "READY" : status.phase.toUpperCase()}</strong>
        </div>

        <nav className="header-actions" aria-label="Studio utilities">
          <button
            className={activePanel === "takes" ? "header-action header-action--active" : "header-action"}
            type="button"
            onClick={() => showPanel(activePanel === "takes" ? "compose" : "takes")}
            aria-expanded={activePanel === "takes"}
            aria-controls="takes-panel"
          >
            Takes <span>{takes.length}</span>
          </button>
          <button className="header-action" type="button" onClick={() => setAboutOpen(true)}>
            About
          </button>
          <a className="header-action repo-link" href="https://github.com/LuminaryLabs-Dev/NexusVoice" target="_blank" rel="noreferrer">
            Source <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <nav className="panel-tabs" role="tablist" aria-label="Studio panels">
        {(["compose", "monitor", "takes"] as Panel[]).map((panel) => (
          <button
            key={panel}
            type="button"
            role="tab"
            aria-selected={activePanel === panel}
            aria-controls={`${panel}-panel`}
            className={activePanel === panel ? "panel-tab panel-tab--active" : "panel-tab"}
            onClick={() => showPanel(panel)}
          >
            {panel === "takes" ? `Takes · ${takes.length}` : panel}
          </button>
        ))}
      </nav>

      <section className="workspace" data-active-panel={activePanel} aria-label="NexusVoice generator">
        <form id="compose-panel" className="workspace-panel composer" onSubmit={generate}>
          <div className="panel-heading">
            <div>
              <span className="panel-number">01</span>
              <div>
                <span className="eyebrow">Compose</span>
                <h1>Direct the performance</h1>
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
              <span><strong>Compatible</strong><small>Q8 · about 100 MB · modern browsers</small></span>
            </label>
            <label className={compute === "webgpu" ? "compute-option compute-option--selected" : "compute-option"}>
              <input type="radio" name="compute" value="webgpu" checked={compute === "webgpu"} onChange={() => setCompute("webgpu")} />
              <span><strong>WebGPU</strong><small>{webGpuAvailable ? "FP32 · capable GPU" : "WASM fallback"}</small></span>
            </label>
          </fieldset>

          <ModelStatus status={status} compute={compute} webGpuAvailable={webGpuAvailable} />

          <button className="generate-button" type="submit" disabled={isBusy || !text.trim()}>
            <span>{status.phase === "loading" ? `Loading model · ${status.progress}%` : status.phase === "generating" ? "Rendering voice…" : "Generate voice"}</span>
            <span className="generate-button__icon" aria-hidden="true">▶</span>
          </button>
          <p className="first-run-note">The first generation downloads the model. Later takes use the browser cache.</p>
        </form>

        <section id="monitor-panel" className="workspace-panel output-panel">
          <div className="panel-heading panel-heading--output">
            <div>
              <span className="panel-number">02</span>
              <div>
                <span className="eyebrow">Monitor</span>
                <h2>Listen to the take</h2>
              </div>
            </div>
            <span className="panel-format">24 KHZ · WAV</span>
          </div>
          <AudioPlayer take={currentTake} busy={isBusy} />
        </section>

        {activePanel === "takes" && (
          <aside id="takes-panel" className="takes-drawer" aria-labelledby="takes-heading">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">Session</span>
                <h2 id="takes-heading">Voice takes</h2>
              </div>
              <button className="close-button" type="button" onClick={() => showPanel("compose")} aria-label="Close voice takes">×</button>
            </div>

            <p className="drawer-intro">
              {takes.length ? `${takes.length} generated take${takes.length === 1 ? "" : "s"} in this session.` : "Generate multiple voices to compare them here."}
            </p>

            {takes.length ? (
              <div className="take-list">
                {takes.map((take, index) => (
                  <button
                    key={take.id}
                    type="button"
                    className={take.id === currentTake?.id ? "take-row take-row--active" : "take-row"}
                    onClick={() => {
                      setCurrentTakeId(take.id);
                      setActivePanel("monitor");
                    }}
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
                <p>Try the same line with Heart, Fenrir, and Emma. Results remain available until this tab closes.</p>
              </div>
            )}
          </aside>
        )}
      </section>

      {aboutOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAboutOpen(false)}>
          <section
            className="about-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">NexusVoice Studio</span>
                <h2 id="about-title">Private by architecture.</h2>
              </div>
              <button className="close-button" type="button" onClick={() => setAboutOpen(false)} aria-label="Close About">×</button>
            </div>
            <p>Kokoro runs through ONNX Runtime Web on your device. Model files are cached by your browser; dialogue and generated audio are never uploaded by NexusVoice Studio.</p>
            <dl className="about-details">
              <div><dt>Model</dt><dd>Kokoro 82M</dd></div>
              <div><dt>Audio</dt><dd>24 kHz · mono · WAV</dd></div>
              <div><dt>Version</dt><dd>0.1.0-preview.1</dd></div>
            </dl>
            <div className="about-links">
              <a href="https://github.com/LuminaryLabs-Dev/NexusVoice" target="_blank" rel="noreferrer">View source ↗</a>
              <a href="https://github.com/LuminaryLabs-Dev/NexusVoice/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">Third-party notices ↗</a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
