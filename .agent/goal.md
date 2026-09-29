# Goal

NexusVoice should become a fully local, production-ready neural voice system for Unity with one simple public emitter component, reliable offline inference, clear runtime ownership, cross-platform native support, useful authoring/reference tooling, and commercial redistribution clearance.

## Success conditions

- `NexusVoiceEmitter` remains a small, stable public Unity API
- native offline inference is the production-default path
- queue, focus, interruption, fades, cancellation and bounded caching behave predictably
- models and generated runtime assets remain locally owned and reproducible
- C ABI memory/buffer ownership is explicit and safe
- Linux, Windows, macOS and Android/Quest native targets gain matching evidence
- Unity Editor, EditMode, PlayMode and standalone-player gates are exercised
- Node Bridge remains a reliable reference/authoring fallback rather than a hidden production dependency
- Studio remains a useful local browser companion without being confused with native runtime proof
- releases keep package manifests, archives, changelogs and tags synchronized
- third-party/model/phonemizer licensing is cleared for intended commercial distribution

## Current milestone boundary

- Linux x64 native inference: validated
- Unity Editor/runtime evidence: pending
- Windows native: pending
- macOS native: pending
- Android/Quest native: pending
- commercial licensing: pending
