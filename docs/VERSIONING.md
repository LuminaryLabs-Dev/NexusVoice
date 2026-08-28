# Versioning policy

NexusVoice starts at `0.0.1-preview.1`.

| Change | Next version | Example |
| --- | --- | --- |
| Small preview iteration | Increment preview | `0.0.1-preview.2` |
| Meaningful compatible revision | Increment patch, reset preview | `0.0.2-preview.1` |
| Major preview milestone | Increment minor, reset preview | `0.1.0-preview.1` |
| Stable commercial API | Release stable | `1.0.0` |

Milestones:

- `0.0.1-preview.1` — UPM package and Node authoring bridge.
- `0.0.2-preview.1` — reliability and documentation milestone.
- `0.1.0-preview.1` — embedded native inference, validated on Linux x64.
- `0.1.x-preview.N` — Linux reliability fixes and the first validated Windows x64 build.
- `0.2.0-preview.1` — validated macOS inference.
- `0.3.0-preview.1` — validated Android and Quest inference.
- `1.0.0` — tested offline commercial release.

Published versions are immutable and never reused or decreased. A release updates
the Unity manifest, Node manifest, package and root changelogs, archive names,
release notes, and Git tag.
