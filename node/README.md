# NexusVoice Node reference engine

This is the validated Kokoro implementation and temporary Unity authoring bridge.

It is versioned with the Unity package. The current release is `0.0.1-preview.1`.

```bash
npm install
npm run model:download
npm run smoke
npm run serve
```

The checked-in `.npmrc` keeps ONNX Runtime on the CPU path. The preview does not
download CUDA libraries during installation.

Available scripts:

- `npm run generate:joke` — generate the reference joke WAV.
- `npm run smoke` — start the bridge and validate health plus WAV synthesis.
- `npm run unity:model` — install the model and seven selected voices into the Unity demo project.
- `npm run unity:model:verify` — verify every installed model-pack SHA-256 hash.
- `npm run serve` — listen on `127.0.0.1:47831`.
- `npm run validate:source` — validate the UPM structure and public API.
- `npm run release:preview` — build local UPM and itch preview archives with checksums.

Node remains a reference and authoring tool. It is not the intended dependency for a final standalone Unity release.
