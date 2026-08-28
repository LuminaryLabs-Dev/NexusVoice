const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const nativeRoot = path.join(repositoryRoot, 'native');
const buildRoot = path.join(nativeRoot, 'build');
const sherpaRoot = path.join(nativeRoot, 'vendor', 'sherpa-onnx-full');
const sherpaInclude = path.join(sherpaRoot, 'include');
const sherpaLib = path.join(sherpaRoot, 'lib');
const modelRoot = path.join(nativeRoot, 'models', 'nexusvoice-kokoro-v1_0');
const smokeWav = path.join(buildRoot, 'nexusvoice-native-smoke.wav');

function requirePath(target, type) {
  if (!fs.existsSync(target)) {
    throw new Error(`Required NexusVoice ${type} is missing: ${target}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: { ...process.env, ...options.env }
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

requirePath(path.join(sherpaInclude, 'sherpa-onnx', 'c-api', 'c-api.h'), 'header');
requirePath(path.join(sherpaLib, 'libsherpa-onnx-c-api.so'), 'library');
requirePath(path.join(modelRoot, 'model.onnx'), 'model');
fs.mkdirSync(buildRoot, { recursive: true });

const cmake = spawnSync('cmake', ['--version'], { stdio: 'ignore' });
if (cmake.status === 0) {
  run('cmake', [
    '-S', nativeRoot,
    '-B', buildRoot,
    `-DNEXUSVOICE_SHERPA_ROOT=${sherpaRoot}`
  ]);
  run('cmake', ['--build', buildRoot]);
  run('ctest', ['--test-dir', buildRoot, '--output-on-failure']);
  process.exit(0);
}

if (process.platform !== 'linux') {
  throw new Error('CMake 3.20 or newer is required outside the Linux fallback build.');
}

const libraryPath = path.join(buildRoot, 'libnexusvoice.so');
const smokePath = path.join(buildRoot, 'nexusvoice_native_smoke');
for (const filename of fs.readdirSync(sherpaLib)) {
  if (filename.endsWith('.so') || filename.includes('.so.')) {
    fs.copyFileSync(path.join(sherpaLib, filename), path.join(buildRoot, filename));
  }
}

run('g++', [
  '-std=c++17',
  '-O2',
  '-fPIC',
  '-shared',
  '-DNEXUSVOICE_BUILDING=1',
  'native/src/nexusvoice.cpp',
  'native/src/kokoro_runtime.cpp',
  '-I', 'native/include',
  '-I', 'native/src',
  '-I', sherpaInclude,
  '-L', sherpaLib,
  '-lsherpa-onnx-c-api',
  '-Wl,-rpath,$ORIGIN',
  '-o', libraryPath
]);
run('g++', [
  '-std=c++17',
  '-O2',
  'native/tests/native_smoke.cpp',
  '-I', 'native/include',
  '-L', buildRoot,
  '-lnexusvoice',
  '-Wl,-rpath,$ORIGIN',
  '-o', smokePath
]);
run(smokePath, [modelRoot, smokeWav], {
  env: { LD_LIBRARY_PATH: buildRoot }
});

