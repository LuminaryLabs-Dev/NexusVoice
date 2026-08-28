const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const nodeRoot = path.join(repositoryRoot, 'node');
const sourceModel = path.join(
  nodeRoot,
  'models',
  'kokoro',
  'onnx',
  'model_quantized.onnx'
);
const voicesRoot = path.join(nodeRoot, 'node_modules', 'kokoro-js', 'voices');
const supportRoot = path.join(
  repositoryRoot,
  'native',
  'models',
  'kokoro-int8-multi-lang-v1_0'
);
const outputRoot = path.join(
  repositoryRoot,
  'native',
  'models',
  'nexusvoice-kokoro-v1_0'
);

const voiceIds = [
  'af_alloy', 'af_aoede', 'af_bella', 'af_heart', 'af_jessica', 'af_kore',
  'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky', 'am_adam',
  'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael', 'am_onyx',
  'am_puck', 'am_santa', 'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily',
  'bm_daniel', 'bm_fable', 'bm_george', 'bm_lewis', 'ef_dora', 'em_alex',
  'ff_siwis', 'hf_alpha', 'hf_beta', 'hm_omega', 'hm_psi', 'if_sara',
  'im_nicola', 'jf_alpha', 'jf_gongitsune', 'jf_nezumi', 'jf_tebukuro',
  'jm_kumo', 'pf_dora', 'pm_alex', 'pm_santa', 'zf_xiaobei', 'zf_xiaoni',
  'zf_xiaoxiao', 'zf_xiaoyi', 'zm_yunjian', 'zm_yunxi', 'zm_yunxia',
  'zm_yunyang'
];

function requireFile(filename) {
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    throw new Error(`Required NexusVoice file is missing: ${filename}`);
  }
}

function requireDirectory(directory) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`Required NexusVoice directory is missing: ${directory}`);
  }
}

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

function writeAtomic(filename, data) {
  const temporary = `${filename}.partial`;
  fs.writeFileSync(temporary, data);
  fs.renameSync(temporary, filename);
}

function prepareModel() {
  requireFile(sourceModel);
  const schemaPath = path.join(
    nodeRoot,
    'node_modules',
    'onnxruntime-web',
    'lib',
    'onnxjs',
    'ort-schema',
    'protobuf',
    'onnx.js'
  );
  requireFile(schemaPath);

  const { onnx } = require(schemaPath);
  const model = onnx.ModelProto.decode(fs.readFileSync(sourceModel));
  const metadata = {
    sample_rate: '24000',
    version: '2',
    n_speakers: String(voiceIds.length),
    has_espeak: '1',
    voice: 'en-us',
    style_dim: '510,1,256',
    speaker_names: voiceIds.join(','),
    speaker2id: voiceIds.map((id, index) => `${id}->${index}`).join(',')
  };

  const retained = (model.metadataProps || []).filter(entry => !(entry.key in metadata));
  model.metadataProps = retained.concat(
    Object.entries(metadata).map(([key, value]) => ({ key, value }))
  );

  fs.mkdirSync(outputRoot, { recursive: true });
  writeAtomic(
    path.join(outputRoot, 'model.onnx'),
    onnx.ModelProto.encode(model).finish()
  );
}

function prepareVoices() {
  requireDirectory(voicesRoot);
  const buffers = voiceIds.map(id => {
    const filename = path.join(voicesRoot, `${id}.bin`);
    requireFile(filename);
    const buffer = fs.readFileSync(filename);
    if (buffer.length !== 510 * 256 * Float32Array.BYTES_PER_ELEMENT) {
      throw new Error(`Voice embedding has the wrong size: ${filename}`);
    }
    return buffer;
  });

  writeAtomic(path.join(outputRoot, 'voices.bin'), Buffer.concat(buffers));
  writeAtomic(
    path.join(outputRoot, 'voices.json'),
    `${JSON.stringify(
      voiceIds.map((id, index) => ({ id, speakerId: index })),
      null,
      2
    )}\n`
  );
}

function prepareFrontend() {
  requireDirectory(supportRoot);
  for (const filename of ['tokens.txt', 'lexicon-us-en.txt']) {
    const source = path.join(supportRoot, filename);
    requireFile(source);
    fs.copyFileSync(source, path.join(outputRoot, filename));
  }

  const sourceData = path.join(supportRoot, 'espeak-ng-data');
  requireDirectory(sourceData);
  fs.cpSync(sourceData, path.join(outputRoot, 'espeak-ng-data'), {
    recursive: true,
    force: true
  });

  const supportLicense = path.join(supportRoot, 'LICENSE');
  requireFile(supportLicense);
  fs.copyFileSync(
    supportLicense,
    path.join(outputRoot, 'KOKORO-SUPPORT-APACHE-2.0.txt')
  );
}

function writeManifest() {
  const files = ['model.onnx', 'voices.bin', 'tokens.txt', 'lexicon-us-en.txt'];
  const manifest = {
    id: 'nexusvoice-kokoro-v1_0-q8',
    runtime: 'sherpa-onnx-1.13.6',
    sampleRate: 24000,
    defaultVoice: 'af_heart',
    voices: voiceIds,
    files: Object.fromEntries(
      files.map(filename => [filename, {
        bytes: fs.statSync(path.join(outputRoot, filename)).size,
        sha256: sha256(path.join(outputRoot, filename))
      }])
    )
  };

  writeAtomic(
    path.join(outputRoot, 'model-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

prepareModel();
prepareVoices();
prepareFrontend();
writeManifest();
console.log(`Prepared native NexusVoice model at ${outputRoot}`);
