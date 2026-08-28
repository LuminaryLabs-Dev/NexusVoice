# Models and voices

The preview uses the quantized Kokoro-82M ONNX model at 24 kHz.

Validated voice ids:

- `af_heart`
- `af_bella`
- `af_nicole`
- `am_michael`
- `am_fenrir`
- `bf_emma`
- `bm_george`

Commands:

```bash
cd node
npm run model:download
npm run unity:model
npm run unity:model:verify
```

The model, voice embeddings, and generated WAV files are intentionally excluded
from ordinary Git history. `model-manifest.json` records expected SHA-256 hashes.
