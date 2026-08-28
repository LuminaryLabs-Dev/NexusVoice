const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const buildRoot = path.join(repositoryRoot, 'native', 'build');
const licensesRoot = path.join(repositoryRoot, 'native', 'vendor', 'licenses');
const modelRoot = path.join(
  repositoryRoot,
  'native',
  'models',
  'nexusvoice-kokoro-v1_0'
);
const pluginRoot = path.join(
  repositoryRoot,
  'unity',
  'Packages',
  'com.luminarylabs.nexusvoice',
  'Runtime',
  'Plugins',
  'Linux',
  'x86_64'
);
const unityModelRoot = path.join(
  repositoryRoot,
  'unity',
  'Assets',
  'StreamingAssets',
  'NexusVoice',
  'Model'
);
const packageLicensesRoot = path.join(
  repositoryRoot,
  'unity',
  'Packages',
  'com.luminarylabs.nexusvoice',
  'ThirdPartyLicenses~'
);

function copyRequired(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Required NexusVoice build asset is missing: ${source}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

if (process.platform !== 'linux' || process.arch !== 'x64') {
  throw new Error('The validated Unity native installer target is currently Linux x64.');
}

fs.mkdirSync(pluginRoot, { recursive: true });
for (const filename of [
  'libnexusvoice.so',
  'libsherpa-onnx-c-api.so',
  'libonnxruntime.so'
]) {
  copyRequired(path.join(buildRoot, filename), path.join(pluginRoot, filename));
}

if (!fs.existsSync(path.join(modelRoot, 'model-manifest.json'))) {
  throw new Error('Prepared native model is missing. Run npm run native:prepare first.');
}
fs.rmSync(unityModelRoot, { recursive: true, force: true });
fs.mkdirSync(unityModelRoot, { recursive: true });
fs.cpSync(modelRoot, unityModelRoot, { recursive: true, force: true });

if (!fs.existsSync(licensesRoot)) {
  throw new Error('Pinned native licenses are missing. Run npm run native:setup first.');
}
fs.rmSync(packageLicensesRoot, { recursive: true, force: true });
fs.cpSync(licensesRoot, packageLicensesRoot, { recursive: true, force: true });

console.log(`Installed Linux x64 native plugin at ${pluginRoot}`);
console.log(`Installed Unity runtime model at ${unityModelRoot}`);
console.log(`Installed native licenses at ${packageLicensesRoot}`);
