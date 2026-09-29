# Intention

## Keep the Unity API small

Most users should need one `NexusVoiceEmitter` component rather than direct awareness of inference runtimes, model files, queues, native buffers or bridge protocols.

## Make native inference the production direction

The stable C ABI isolates Unity from Sherpa-ONNX/ONNX Runtime/Kokoro implementation details and removes a Node process from the intended standalone player path.

## Keep Node as reference and authoring fallback

The Node engine provides known-good Kokoro behavior, local bridge testing and comparison tooling. It should not become an accidental production requirement.

## Keep Studio separate

Studio validates the browser voice experience through Kokoro.js/ONNX Runtime Web. It is a companion product surface, not a replacement for native Unity validation.

## Keep speech local

The product direction favors on-device/local inference rather than cloud speech dependencies.

## Make ownership explicit

The C ABI defines runtime and PCM buffer lifetime clearly; Unity copies samples into an `AudioClip` and frees native output promptly.

## Keep generated assets out of source history

Models, vendor runtimes, native binaries, archives and generated WAVs are build/runtime artifacts, not ordinary repository source.

## Keep release claims platform-specific

A Linux x64 synthesis pass cannot certify Unity Editor, Windows, macOS, Android/Quest, browser Studio or store distribution.

## Treat licensing as a hard gate

The current eSpeak NG path blocks commercial redistribution until formal review or replacement.
