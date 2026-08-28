# Platform status

## `0.1.0-preview.1`

- Unity package source baseline: Unity 2022.3 LTS.
- Demo project baseline: Unity 6.0.
- Native Linux x64: C++ build and real Kokoro synthesis validated.
- Node Bridge: validated reference and authoring backend.
- Native Windows x64: source ready; binary and player unverified.
- Native macOS: source ready; binary and player unverified.
- Android and Quest: deferred; INT8 ARM requires an upstream reliability gate.

Do not advertise a platform until its native library, clean Unity import, player
build and launched-player checks pass.

