# Build guidance

Before describing a player build as supported:

1. Install the matching native plugin and dependencies.
2. Install the prepared model under `StreamingAssets/NexusVoice/Model`.
3. Configure Unity plugin import settings for the target architecture.
4. Run Edit Mode and Play Mode package tests.
5. Build and launch the player on the advertised platform.
6. Test repeated generation, cancellation, queueing, focus and shutdown.
7. Measure generation latency and memory on a clean machine.

Linux x64 C++ synthesis passes in `0.1.0-preview.1`. Unity player behavior and
other platforms remain unverified until their platform checks pass.

