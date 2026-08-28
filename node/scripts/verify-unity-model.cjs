const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const modelRoot = path.join(repositoryRoot, 'unity', 'Assets', 'StreamingAssets', 'NexusVoice');
const manifestPath = path.join(modelRoot, 'model-manifest.json');

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

function verify(relativePath, expected) {
  const filename = path.join(modelRoot, relativePath);
  if (!fs.existsSync(filename)) throw new Error(`Missing model-pack file: ${relativePath}`);
  const actual = sha256(filename);
  if (actual !== expected) throw new Error(`SHA-256 mismatch for ${relativePath}: ${actual}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
verify(manifest.modelFile, manifest.modelSha256);
for (const voice of manifest.voices) verify(voice.file, voice.sha256);

console.log(`Verified NexusVoice Unity model pack: ${manifest.id}, ${manifest.voices.length} voices`);
