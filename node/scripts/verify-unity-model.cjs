const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const modelRoot = path.join(
  repositoryRoot,
  'unity',
  'Assets',
  'StreamingAssets',
  'NexusVoice',
  'Model'
);
const manifestPath = path.join(modelRoot, 'model-manifest.json');

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Native Unity model manifest is missing. Run npm run native:all.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const [relativePath, expected] of Object.entries(manifest.files)) {
  const filename = path.join(modelRoot, relativePath);
  if (!fs.existsSync(filename)) throw new Error(`Missing model-pack file: ${relativePath}`);
  const actual = sha256(filename);
  if (actual !== expected.sha256 || fs.statSync(filename).size !== expected.bytes) {
    throw new Error(`Model-pack verification failed for ${relativePath}`);
  }
}
if (!fs.existsSync(path.join(modelRoot, 'espeak-ng-data', 'phontab'))) {
  throw new Error('Native model pack is missing espeak-ng-data/phontab.');
}
if (!fs.existsSync(path.join(modelRoot, 'KOKORO-SUPPORT-APACHE-2.0.txt'))) {
  throw new Error('Native model pack is missing its Kokoro support license.');
}

console.log(
  `Verified NexusVoice Unity model pack: ${manifest.id}, ${manifest.voices.length} voices`
);
