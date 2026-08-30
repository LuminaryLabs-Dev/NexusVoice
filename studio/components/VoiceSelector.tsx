import { STUDIO_VOICES, getVoice } from "../lib/voices";

type VoiceSelectorProps = {
  value: string;
  onChange: (voice: string) => void;
  disabled?: boolean;
};

export function VoiceSelector({ value, onChange, disabled = false }: VoiceSelectorProps) {
  const selected = getVoice(value);

  return (
    <div className="voice-field">
      <label htmlFor="voice">Voice</label>
      <div className="select-shell">
        <select
          id="voice"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {STUDIO_VOICES.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name} — {voice.accent} {voice.gender}
            </option>
          ))}
        </select>
        <span className="select-chevron" aria-hidden="true">⌄</span>
      </div>
      <div className="voice-note">
        <span>{selected.character}</span>
        <code>{selected.id}</code>
      </div>
    </div>
  );
}
