# Workflow

## Before editing

1. verify exact remote `main` and version surfaces
2. read `AGENTS.md`, `.agent/start-here.md`, and the specialist README/docs
3. identify which surface is changing: Unity, native, Node, Studio, release/tooling
4. preserve ABI/package/version synchronization and licensing boundaries
5. keep generated models/binaries/WAVs out of Git

## Native/reference path

```bash
cd node
npm ci --onnxruntime-node-install-cuda=skip
npm run model:download
npm run smoke
npm run native:all
npm run validate:source
```

## Node Bridge

```bash
cd node
npm run serve
```

## Studio

```bash
cd studio
npm ci --onnxruntime-node-install-cuda=skip
npm run validate
npm run preview
```

## Release tooling

```bash
cd node
npm run release:preview
```

## Evidence tiers

- docs only → source/path/version/authority audit + documentation-only diff
- Node reference → model download/reference smoke/service behavior
- native Linux → setup/prepare/build/audio validation/install comparison
- Unity package structure → `validate:source` plus package/tool checks
- Unity Editor import/compile → actual Unity Editor evidence
- EditMode/PlayMode → actual Unity test execution
- standalone player → clean built-player execution
- Windows/macOS/Android/Quest → target-specific native + Unity/player evidence
- Studio → typecheck/build/export validation
- Pages → workflow/deployment evidence
- commercial release → license approval, store material, packaging and target-platform validation

Never substitute one tier for another.

## Closeout

Race-check `main`, use `force=false`, re-read changed docs from live GitHub, and keep runtime/platform/license findings in `.agent/feedback.md`.
