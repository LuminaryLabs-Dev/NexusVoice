const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const nativeRoot = path.join(repositoryRoot, 'native');
const buildRoot = path.join(nativeRoot, 'build');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

const cmake = spawnSync('cmake', ['--version'], { stdio: 'ignore' });
if (cmake.status === 0) {
  run('cmake', ['-S', nativeRoot, '-B', buildRoot]);
  run('cmake', ['--build', buildRoot]);
  run('ctest', ['--test-dir', buildRoot, '--output-on-failure']);
  process.exit(0);
}

if (process.platform !== 'linux') {
  throw new Error('CMake 3.20 or newer is required to build NexusVoice native code.');
}

fs.mkdirSync(buildRoot, { recursive: true });
const libraryPath = path.join(buildRoot, 'libnexusvoice.so');
const smokePath = path.join(buildRoot, 'nexusvoice_native_smoke');

run('g++', [
  '-std=c++17',
  '-fPIC',
  '-shared',
  'native/src/nexusvoice.cpp',
  'native/src/kokoro_runtime.cpp',
  '-I', 'native/include',
  '-I', 'native/src',
  '-o', libraryPath
]);
run('g++', [
  '-std=c++17',
  'native/tests/native_smoke.cpp',
  '-I', 'native/include',
  '-L', buildRoot,
  '-lnexusvoice',
  '-Wl,-rpath,$ORIGIN',
  '-o', smokePath
]);
run(smokePath, []);
