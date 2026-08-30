import type { StudioTake } from "../lib/types";
import { downloadWav, formatDuration, formatGenerationTime, makeWavFilename } from "../lib/wav-export";

type AudioPlayerProps = {
  take: StudioTake | null;
  busy: boolean;
};

const WAITING_BARS = Array.from({ length: 96 }, (_, index) => {
  const wave = Math.sin(index * 0.42) * 0.22 + Math.sin(index * 0.13) * 0.12;
  return 0.12 + Math.abs(wave);
});

export function AudioPlayer({ take, busy }: AudioPlayerProps) {
  const bars = take?.envelope ?? WAITING_BARS;

  return (
    <section className={`monitor ${busy ? "monitor--busy" : ""}`} aria-label="Generated voice monitor">
      <div className="monitor__topline">
        <span className="eyebrow">Current take</span>
        <span className="monitor__format">24 KHZ · MONO · WAV</span>
      </div>

      <div className="waveform" aria-label={take ? "Waveform for the current generated take" : "No take generated yet"}>
        {bars.map((height, index) => (
          <span
            key={index}
            className={take ? "waveform__bar waveform__bar--active" : "waveform__bar"}
            style={{ height: `${Math.max(8, height * 100)}%` }}
          />
        ))}
        {busy && <span className="waveform__playhead" aria-hidden="true" />}
      </div>

      {take ? (
        <>
          <div className="take-title">
            <div>
              <h2>{take.voiceName}</h2>
              <p>{take.text}</p>
            </div>
            <div className="take-title__time">
              <strong>{formatDuration(take.duration)}</strong>
              <span>{formatGenerationTime(take.elapsedMs)} render</span>
            </div>
          </div>
          <audio className="audio-control" controls src={take.url} preload="metadata">
            Your browser does not support WAV playback.
          </audio>
          <button
            className="download-button"
            type="button"
            onClick={() => downloadWav(take.url, makeWavFilename(take.voice, take.createdAt))}
          >
            <span>Download WAV</span>
            <span aria-hidden="true">↓</span>
          </button>
        </>
      ) : (
        <div className="monitor__empty">
          <span>01</span>
          <div>
            <h2>{busy ? "Building your first take" : "Your voice lands here"}</h2>
            <p>{busy ? "The first run downloads and caches the model." : "Write a line, choose a performer, and generate."}</p>
          </div>
        </div>
      )}
    </section>
  );
}
