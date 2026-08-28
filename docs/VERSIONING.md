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
- `0.1.0-preview.1` — embedded Windows inference.
- `0.2.0-preview.1` — macOS and Linux inference.
- `0.3.0-preview.1` — Android and Quest inference.
- `1.0.0` — tested offline commercial release.

Published versions are immutable and never reused or decreased. A release updates
the Unity manifest, Node manifest, package and root changelogs, archive names,
release notes, and Git tag.
