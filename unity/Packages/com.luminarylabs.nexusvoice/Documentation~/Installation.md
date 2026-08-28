# Installation

## Repository preview

1. Open `unity/` in Unity 2022.3 LTS or newer.
2. In a terminal, open `node/`.
3. Run `npm install`.
4. Run `npm run model:download`.
5. Run `npm run serve`.
6. Add `NexusVoiceEmitter` to a GameObject. Unity adds the required `AudioSource`.

The package is embedded at `unity/Packages/com.luminarylabs.nexusvoice`.

## Model files

The Node bridge uses `node/models/kokoro/onnx/model_quantized.onnx`. To prepare
the future native path, run `npm run unity:model`, then verify it with
`npm run unity:model:verify`.

## Preview limitation

`0.0.1-preview.1` requires the local Node bridge during authoring. It is not an
offline standalone customer runtime.
