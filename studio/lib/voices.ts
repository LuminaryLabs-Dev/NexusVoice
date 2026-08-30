export type StudioVoice = {
  id: string;
  name: string;
  accent: "American" | "British";
  gender: "Feminine" | "Masculine";
  character: string;
};

export const STUDIO_VOICES: readonly StudioVoice[] = [
  { id: "af_heart", name: "Heart", accent: "American", gender: "Feminine", character: "Warm · natural" },
  { id: "af_bella", name: "Bella", accent: "American", gender: "Feminine", character: "Bright · expressive" },
  { id: "af_nicole", name: "Nicole", accent: "American", gender: "Feminine", character: "Close · conversational" },
  { id: "am_michael", name: "Michael", accent: "American", gender: "Masculine", character: "Clear · grounded" },
  { id: "am_fenrir", name: "Fenrir", accent: "American", gender: "Masculine", character: "Animated · bold" },
  { id: "bf_emma", name: "Emma", accent: "British", gender: "Feminine", character: "Soft · composed" },
  { id: "bm_george", name: "George", accent: "British", gender: "Masculine", character: "Measured · direct" }
] as const;

export function getVoice(id: string): StudioVoice {
  return STUDIO_VOICES.find((voice) => voice.id === id) ?? STUDIO_VOICES[0];
}
