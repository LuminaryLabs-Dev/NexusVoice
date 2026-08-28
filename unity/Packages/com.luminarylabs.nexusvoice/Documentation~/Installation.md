# Installation

## Native Linux x64 preview

1. Open a terminal in `node/`.
2. Run `npm ci --onnxruntime-node-install-cuda=skip`.
3. Run `npm run model:download`.
4. Run `npm run native:all`.
5. Open `unity/` in Unity 2022.3 LTS or newer.
6. Add `NexusVoiceEmitter` to a GameObject.

The package is embedded at `unity/Packages/com.luminarylabs.nexusvoice`.
The native model is installed under
`Assets/StreamingAssets/NexusVoice/Model`.

## Node reference backend

Run `npm run serve` from `node/`, then select **Node Bridge** on the emitter.
Node is optional in the native player path.

## Preview limitation

Only Linux x64 native synthesis has been executed in the sandbox. Validate Unity
import and the target player before distributing a build.
