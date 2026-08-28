const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const nodeRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(nodeRoot, '..');
const modelRoot = path.join(nodeRoot, 'models', 'kokoro');
const targetRoot = path.join(repositoryRoot, 'unity', 'Assets', 'StreamingAssets', 'NexusVoice');
const voicesRoot = path.join(nodeRoot, 'node_modules', 'kokoro-js', 'voices');
const voices = ['af_heart', 'af_bella', 'af_nicole', 'am_michael', 'am_fenrir', 'bf_emma', 'bm_george'];

function copy(source, destination) {
  if (!fs.existsSync(source)) throw new Error(`Required NexusVoice file is missing: ${source}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

const modelSource = path.join(modelRoot, 'onnx', 'model_quantized.onnx');
const modelTarget = path.join(targetRoot, 'model_quantized.onnx');
copy(modelSource, modelTarget);

for (const filename of ['config.json', 'tokenizer.json', 'tokenizer_config.json']) {
  copy(path.join(modelRoot, filename), path.join(targetRoot, filename));
}

const voiceEntries = voices.map(id => {
  const source = path.join(voicesRoot, `${id}.bin`);
  const destination = path.join(targetRoot, 'voices', `${id}.bin`);
  copy(source, destination);
  return { id, file: `voices/${id}.bin`, sha256: sha256(destination) };
});

const manifest = {
  id: 'kokoro-82m-q8',
  sampleRate: 24000,
  modelFile: 'model_quantized.onnx',
  modelSha256: sha256(modelTarget),
  defaultVoice: 'af_heart',
  voices: voiceEntries
};

fs.writeFileSync(
  path.join(targetRoot, 'model-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
);

console.log(`Installed NexusVoice model pack at ${targetRoot}`);
