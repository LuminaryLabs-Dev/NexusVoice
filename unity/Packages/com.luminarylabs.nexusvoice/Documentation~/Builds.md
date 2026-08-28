# Build guidance

The first preview is an authoring package and must remain in Node Bridge mode.

Before a customer player build can be described as offline:

1. Bundle the matching native ONNX Runtime and phonemizer.
2. Bundle the Kokoro model and selected voices under `StreamingAssets/NexusVoice`.
3. Configure plugin import settings for the target architecture.
4. Run the package tests in a clean project.
5. Build and launch the player on the advertised platform.
6. Verify repeated generation, cancellation, queueing, focus, and memory behavior.

Native inference is planned for `0.1.0-preview.1` and is not claimed by this release.
