const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const packageRoot = path.join(repositoryRoot, 'unity', 'Packages', 'com.luminarylabs.nexusvoice');
const expectedVersion = '0.1.0-preview.1';

function fail(message) {
  throw new Error(`NexusVoice package validation failed: ${message}`);
}

function readJson(relativePath) {
  const absolutePath = path.join(packageRoot, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`missing ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

const requiredFiles = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE.md',
  'THIRD_PARTY_NOTICES.md',
  'Runtime/NexusVoice.Runtime.asmdef',
  'Runtime/Public/NexusVoiceEmitter.cs',
  'Runtime/Public/NexusVoiceOptions.cs',
  'Runtime/Public/NexusVoiceResult.cs',
  'Runtime/Internal/INexusVoiceBackend.cs',
  'Runtime/Internal/NexusVoiceRuntime.cs',
  'Runtime/Backends/NodeBridgeBackend.cs',
  'Runtime/Backends/NativeBackend.cs',
  'Editor/NexusVoice.Editor.asmdef',
  'Tests/EditMode/NexusVoice.Tests.EditMode.asmdef',
  'Tests/PlayMode/NexusVoice.Tests.PlayMode.asmdef',
  'Samples~/BasicDemo/NexusVoice.Samples.asmdef',
  'Samples~/BasicDemo/NexusVoiceDemo.unity',
  'Documentation~/Installation.md',
  'Documentation~/QuickStart.md',
  'Documentation~/API.md',
  'Documentation~/Models.md',
  'Documentation~/Platforms.md',
  'Documentation~/Builds.md',
  'Documentation~/Troubleshooting.md',
  'Documentation~/Privacy.md',
  'Documentation~/Versioning.md',
  'Documentation~/Upgrading.md'
];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(packageRoot, relativePath))) fail(`missing ${relativePath}`);
}

const packageJson = readJson('package.json');
if (packageJson.version !== expectedVersion) fail(`expected ${expectedVersion}, found ${packageJson.version}`);
for (const field of ['name', 'displayName', 'version', 'unity', 'unityRelease', 'author', 'description']) {
  if (!packageJson[field]) fail(`package.json is missing ${field}`);
}
if (packageJson.unity !== '2022.3') fail(`unexpected Unity baseline ${packageJson.unity}`);

const assemblyExpectations = new Map([
  ['Runtime/NexusVoice.Runtime.asmdef', 'LuminaryLabs.NexusVoice.Runtime'],
  ['Editor/NexusVoice.Editor.asmdef', 'LuminaryLabs.NexusVoice.Editor'],
  ['Tests/EditMode/NexusVoice.Tests.EditMode.asmdef', 'LuminaryLabs.NexusVoice.Tests.EditMode'],
  ['Tests/PlayMode/NexusVoice.Tests.PlayMode.asmdef', 'LuminaryLabs.NexusVoice.Tests.PlayMode'],
  ['Samples~/BasicDemo/NexusVoice.Samples.asmdef', 'LuminaryLabs.NexusVoice.Samples']
]);

for (const [relativePath, expectedName] of assemblyExpectations) {
  const definition = readJson(relativePath);
  if (definition.name !== expectedName) fail(`${relativePath} has unexpected assembly name`);
}

const runtimeFiles = walk(path.join(packageRoot, 'Runtime')).filter(file => file.endsWith('.cs'));
const runtimeSource = runtimeFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const componentDeclarations = runtimeSource.match(/class\s+\w+\s*:\s*MonoBehaviour/g) || [];
if (componentDeclarations.length !== 1
    || componentDeclarations[0] !== 'class NexusVoiceEmitter : MonoBehaviour') {
  fail(`expected one runtime MonoBehaviour, found ${componentDeclarations.join(', ')}`);
}

const emitter = fs.readFileSync(path.join(packageRoot, 'Runtime/Public/NexusVoiceEmitter.cs'), 'utf8');
const requiredApi = [
  'public void Speak(string text)',
  'public void Queue(string text)',
  'public Task<AudioClip> GenerateAsync(string text)',
  'public void Focus()',
  'public void ReleaseFocus()',
  'public void Skip()',
  'public void Stop()',
  'AudioClipEventWrapper OnClipReady',
  'AudioClipEventWrapper OnPlaybackStarted',
  'AudioClipEventWrapper OnPlaybackFinished',
  'StringEventWrapper OnError'
];
for (const fragment of requiredApi) {
  if (!emitter.includes(fragment)) fail(`missing API fragment: ${fragment}`);
}

const nativeBackend = fs.readFileSync(path.join(packageRoot, 'Runtime/Backends/NativeBackend.cs'), 'utf8');
for (const fragment of [
  'nexusvoice_create',
  'nexusvoice_synthesize',
  'nexusvoice_reset_cancel',
  'nexusvoice_cancel',
  'nexusvoice_free_buffer',
  'nexusvoice_destroy'
]) {
  if (!nativeBackend.includes(fragment)) fail(`native backend is missing ${fragment}`);
}

const linuxPluginRoot = path.join(packageRoot, 'Runtime', 'Plugins', 'Linux', 'x86_64');
if (fs.existsSync(path.join(linuxPluginRoot, 'libnexusvoice.so'))) {
  for (const filename of [
    'libnexusvoice.so',
    'libsherpa-onnx-c-api.so',
    'libonnxruntime.so'
  ]) {
    if (!fs.existsSync(path.join(linuxPluginRoot, filename))) {
      fail(`installed Linux plugin is missing ${filename}`);
    }
    if (!fs.existsSync(path.join(linuxPluginRoot, `${filename}.meta`))) {
      fail(`installed Linux plugin is missing ${filename}.meta`);
    }
  }

  const licensesRoot = path.join(packageRoot, 'ThirdPartyLicenses~');
  for (const filename of [
    'SHERPA-ONNX-APACHE-2.0.txt',
    'ONNXRUNTIME-MIT.txt',
    'ESPEAK-NG-GPL-3.0-OR-LATER.txt'
  ]) {
    if (!fs.existsSync(path.join(licensesRoot, filename))) {
      fail(`installed native package is missing license ${filename}`);
    }
  }
}

for (const relativePath of [
  'native/include/nexusvoice.h',
  'native/src/nexusvoice.cpp',
  'native/src/kokoro_runtime.cpp',
  'native/tests/native_smoke.cpp',
  'tools/native/setup.cjs',
  'tools/native/prepare-model.cjs',
  'tools/native/install-unity.cjs',
  'tools/native/validate-audio.cjs'
]) {
  if (!fs.existsSync(path.join(repositoryRoot, relativePath))) fail(`missing ${relativePath}`);
}

const assetExtensions = new Set(['.cs', '.asmdef', '.unity']);
for (const file of walk(packageRoot)) {
  if (assetExtensions.has(path.extname(file)) && !fs.existsSync(`${file}.meta`)) {
    fail(`missing metadata for ${path.relative(packageRoot, file)}`);
  }
}

const packageBytes = walk(packageRoot).reduce((total, file) => total + fs.statSync(file).size, 0);
if (packageBytes > 700 * 1024 * 1024) fail('package exceeds the 700 MB UPM limit');

console.log(`NexusVoice ${expectedVersion} package validation passed`);
console.log(`Runtime components: ${componentDeclarations.length}`);
console.log(`Package bytes: ${packageBytes}`);
