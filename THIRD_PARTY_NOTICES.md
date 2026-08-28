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

- Purpose: ONNX model execution used by the Node reference engine and native runtime.
- Project: Microsoft ONNX Runtime.
- Declared project license: MIT.

## sherpa-onnx

- Purpose: native Kokoro text frontend and inference API.
- Project: `k2-fsa/sherpa-onnx`.
- Pinned native version: `1.13.6`.
- Declared project license: Apache License 2.0.

## eSpeak NG

- Purpose: phonemization data and functionality included by the current Sherpa-ONNX Kokoro path.
- Project: `espeak-ng/espeak-ng`.
- Declared project license: GNU General Public License version 3 or later.
- Commercial and Unity Asset Store distribution is blocked pending formal legal review or replacement with a commercially compatible phonemizer path.

Before publishing a customer bundle, retain the complete license texts supplied with every included model, package, runtime library, phonemizer, and voice file. These notices summarize upstream declarations; they are not legal advice and do not mark commercial redistribution as approved.
