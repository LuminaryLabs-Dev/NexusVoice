# Models and voices

The native preview uses the quantized Kokoro-82M v1.0 ONNX graph at 24 kHz.
The native model builder adds runtime metadata without changing graph weights or
operators, combines 53 voice embeddings, and installs eSpeak-NG frontend data.

Curated voice ids:

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
npm run native:all
npm run unity:model:verify
```

Models, voice embeddings, native dependencies and generated WAV files are
excluded from ordinary Git history. The generated model manifest records sizes
and SHA-256 hashes.

