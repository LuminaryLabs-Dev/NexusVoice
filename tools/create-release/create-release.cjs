const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

require('../validate-package/validate-package.cjs');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const version = '0.0.1-preview.1';
const distRoot = path.join(repositoryRoot, 'dist');
const packageName = 'com.luminarylabs.nexusvoice';
const packageArchive = path.join(distRoot, `NexusVoice-UPM-${version}.tgz`);
const itchArchive = path.join(distRoot, `NexusVoice-Itch-${version}.zip`);
const stagingName = `NexusVoice-${version}`;
const stagingRoot = path.join(distRoot, stagingName);

fs.rmSync(distRoot, { recursive: true, force: true });
fs.mkdirSync(distRoot, { recursive: true });

function run(command, args, workingDirectory = repositoryRoot) {
  const result = spawnSync(command, args, { cwd: workingDirectory, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

run('tar', [
  '-czf', packageArchive,
  '-C', path.join(repositoryRoot, 'unity', 'Packages'),
  packageName
]);

fs.mkdirSync(stagingRoot, { recursive: true });
fs.cpSync(
  path.join(repositoryRoot, 'unity', 'Packages', packageName),
  path.join(stagingRoot, 'UnityPackage'),
  { recursive: true }
);
fs.cpSync(path.join(repositoryRoot, 'node'), path.join(stagingRoot, 'NodeEngine'), {
  recursive: true,
  filter: source => !source.includes(`${path.sep}node_modules`)
    && !source.includes(`${path.sep}output`)
    && !source.includes('model_quantized.onnx')
});
fs.cpSync(path.join(repositoryRoot, 'docs'), path.join(stagingRoot, 'Documentation'), { recursive: true });
for (const file of ['README.md', 'CHANGELOG.md', 'LICENSE.md', 'THIRD_PARTY_NOTICES.md']) {
  fs.copyFileSync(path.join(repositoryRoot, file), path.join(stagingRoot, file));
}

run('zip', ['-qr', itchArchive, stagingName], distRoot);

const checksumLines = [packageArchive, itchArchive].map(file => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  return `${digest}  ${path.basename(file)}`;
});
fs.writeFileSync(path.join(distRoot, 'SHA256SUMS.txt'), `${checksumLines.join('\n')}\n`);

console.log(`Release archives created in ${distRoot}`);
