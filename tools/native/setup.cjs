const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const downloadsRoot = path.join(repositoryRoot, 'native', 'vendor', 'downloads');
const licensesRoot = path.join(repositoryRoot, 'native', 'vendor', 'licenses');

const assets = [
  {
    name: 'sherpa-onnx-linux-x64-full.tar.bz2',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.6/sherpa-onnx-v1.13.6-linux-x64-shared.tar.bz2',
    sha256: '58cc7d360fdedf9702954e8b585eb400bbee8668484bf25e4461d5d22ba439d8',
    output: path.join(repositoryRoot, 'native', 'vendor', 'sherpa-onnx-full')
  },
  {
    name: 'kokoro-int8-multi-lang-v1_0.tar.bz2',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-int8-multi-lang-v1_0.tar.bz2',
    sha256: '75654a84864be26f345f020f4070c2c019e96dd1b7f9bf6e2ffd59efac6aa5a3',
    output: path.join(repositoryRoot, 'native', 'models', 'kokoro-int8-multi-lang-v1_0')
  }
];

const licenses = [
  {
    name: 'SHERPA-ONNX-APACHE-2.0.txt',
    url: 'https://raw.githubusercontent.com/k2-fsa/sherpa-onnx/v1.13.6/LICENSE',
    sha256: 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'
  },
  {
    name: 'ONNXRUNTIME-MIT.txt',
    url: 'https://raw.githubusercontent.com/microsoft/onnxruntime/v1.27.1/LICENSE',
    sha256: '2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c'
  },
  {
    name: 'ESPEAK-NG-GPL-3.0-OR-LATER.txt',
    url: 'https://raw.githubusercontent.com/espeak-ng/espeak-ng/1.52.0/COPYING',
    sha256: '8ceb4b9ee5adedde47b31e975c1d90c73ad27b6b165a1dcd80c7c545eb65b903'
  }
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

if (process.platform !== 'linux' || process.arch !== 'x64') {
  throw new Error('The validated setup target is currently Linux x64.');
}

fs.mkdirSync(downloadsRoot, { recursive: true });
for (const asset of assets) {
  const archive = path.join(downloadsRoot, asset.name);
  if (!fs.existsSync(archive) || sha256(archive) !== asset.sha256) {
    run('curl', ['-L', '--fail', '--retry', '3', '-o', archive, asset.url]);
  }
  if (sha256(archive) !== asset.sha256) {
    throw new Error(`SHA-256 verification failed for ${asset.name}`);
  }

  fs.rmSync(asset.output, { recursive: true, force: true });
  fs.mkdirSync(asset.output, { recursive: true });
  run('tar', [
    '--no-same-owner',
    '-xjf', archive,
    '-C', asset.output,
    '--strip-components=1'
  ]);
}

fs.mkdirSync(licensesRoot, { recursive: true });
for (const license of licenses) {
  const destination = path.join(licensesRoot, license.name);
  if (!fs.existsSync(destination) || sha256(destination) !== license.sha256) {
    run('curl', ['-L', '--fail', '--retry', '3', '-o', destination, license.url]);
  }
  if (sha256(destination) !== license.sha256) {
    throw new Error(`SHA-256 verification failed for ${license.name}`);
  }
}

console.log('Pinned Sherpa-ONNX runtime and Kokoro support assets are ready.');
