# NexusVoice agent operating contract

NexusVoice is a multi-surface local text-to-speech toolkit whose public Unity API is intentionally small while native, Node-reference, browser-Studio, release, and tooling surfaces remain separately testable.

## Read order

1. `AGENTS.md`
2. `.agent/start-here.md`
3. `.agent/repository-profile.md`
4. `.agent/memory.md`
5. `.agent/workflow.md`
6. `README.md`
7. the specialist authority for the surface being changed
8. `docs/RELEASE_CHECKLIST.md` before platform/release claims
9. `THIRD_PARTY_NOTICES.md` before redistribution/commercial claims

## Hard boundaries

- Current release line: `0.1.0-preview.1`.
- Unity package ID: `com.luminarylabs.nexusvoice`; `NexusVoiceEmitter` is the required public component.
- Native C++ is the intended standalone Unity inference path.
- Node is a known-good reference engine and optional authoring fallback, not the intended final standalone dependency.
- NexusVoice Studio validates browser voice/model UX; it does not execute or certify the Unity native C++ runtime.
- Generated models, vendor runtimes, native binaries, archives and WAV outputs do not belong in ordinary Git history.
- Preserve the C ABI ownership contract: runtime creation/destruction, caller-visible PCM buffer ownership, explicit `nexusvoice_free_buffer`, cancellation and deterministic status codes.
- Do not claim a platform as validated without matching build/runtime evidence.
- Commercial distribution remains blocked pending eSpeak NG/phonemizer and full dependency/model license review.
- Published versions are immutable; Unity, Node, release archives, changelogs/notes and tags must remain synchronized when a release is cut.

## Validation discipline

Linux native, Unity Editor, Unity EditMode, Unity PlayMode, standalone player, Windows, macOS, Android/Quest, Studio static export/Pages, and commercial distribution are separate evidence tiers. Never substitute one for another.

## Scope discipline

Documentation defects may be fixed during Upkeep. Runtime, build, dependency, platform, Unity, security, licensing, Studio, or release findings belong in `.agent/feedback.md` unless separately authorized.
