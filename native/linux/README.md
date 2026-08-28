# Linux runtime

Linux x64 is the first validated native target in `0.1.0-preview.1`.

Run `npm run native:all` from `node/` to download the pinned Sherpa-ONNX runtime,
prepare the Kokoro model pack, compile the NexusVoice C ABI, run real synthesis,
compare its signal with the Node reference, and install the generated files into
the Unity package. Generated binaries and model assets stay out of ordinary Git
history and are assembled into local release archives.
