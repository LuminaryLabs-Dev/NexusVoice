# Third-party notices

NexusVoice depends on third-party software and model data. Their licenses apply independently of the NexusVoice source license.

## Kokoro-82M

- Purpose: text-to-speech model.
- Project: `hexgrad/Kokoro-82M` and ONNX community conversions.
- Declared model license: Apache License 2.0.
- The model is downloaded separately and is not stored as an ordinary Git blob in this repository.

## kokoro-js

- Purpose: validated Node reference implementation.
- Package: `kokoro-js`.
- Declared package license: Apache License 2.0.

## phonemizer

- Purpose: eSpeak NG-backed phonemization used by the Node reference engine.
- Package: `phonemizer`.
- Declared package license: Apache License 2.0.

## ONNX Runtime

- Purpose: ONNX model execution used by the Node reference engine and planned native runtime.
- Project: Microsoft ONNX Runtime.
- Declared project license: MIT.

Before publishing a customer bundle, retain the complete license texts supplied with every included model, package, runtime library, and voice file. Native phonemizer redistribution remains a release gate and is not represented as complete by the preview package.
