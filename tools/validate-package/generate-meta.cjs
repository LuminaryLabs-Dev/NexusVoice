const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const packageRoot = path.join(repositoryRoot, 'unity', 'Packages', 'com.luminarylabs.nexusvoice');
const fixedGuids = new Map([
  ['Samples~/BasicDemo/NexusVoiceDemo.cs', '115c9ed24be44943a45c1c35688f1632']
]);

function guidFor(relativePath) {
  return fixedGuids.get(relativePath)
    || crypto.createHash('sha256').update(`nexusvoice:${relativePath}`).digest('hex').slice(0, 32);
}

function folderMeta(guid) {
  return `fileFormatVersion: 2\nguid: ${guid}\nfolderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n  userData:\n  assetBundleName:\n  assetBundleVariant:\n`;
}

function fileMeta(guid, extension) {
  if (extension === '.cs') {
    return `fileFormatVersion: 2\nguid: ${guid}\nMonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n  icon: {instanceID: 0}\n  userData:\n  assetBundleName:\n  assetBundleVariant:\n`;
  }
  if (extension === '.asmdef') {
    return `fileFormatVersion: 2\nguid: ${guid}\nAssemblyDefinitionImporter:\n  externalObjects: {}\n  userData:\n  assetBundleName:\n  assetBundleVariant:\n`;
  }
  if (['.dll', '.so', '.dylib'].includes(extension)) {
    const editorOs = extension === '.dll' ? 'Windows' : extension === '.dylib' ? 'OSX' : 'Linux';
    return `fileFormatVersion: 2\nguid: ${guid}\nPluginImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  iconMap: {}\n  executionOrder: {}\n  defineConstraints: []\n  isPreloaded: 0\n  isOverridable: 0\n  isExplicitlyReferenced: 0\n  validateReferences: 1\n  platformData:\n  - first:\n      Any: \n    second:\n      enabled: 0\n      settings: {}\n  - first:\n      Editor: Editor\n    second:\n      enabled: 1\n      settings:\n        CPU: x86_64\n        OS: ${editorOs}\n  - first:\n      Standalone: Standalone\n    second:\n      enabled: 1\n      settings:\n        CPU: x86_64\n        OS: ${editorOs}\n  userData:\n  assetBundleName:\n  assetBundleVariant:\n`;
  }
  return `fileFormatVersion: 2\nguid: ${guid}\nDefaultImporter:\n  externalObjects: {}\n  userData:\n  assetBundleName:\n  assetBundleVariant:\n`;
}

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.endsWith('.meta')) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(packageRoot, absolutePath).split(path.sep).join('/');
    if (entry.isDirectory()) {
      fs.writeFileSync(`${absolutePath}.meta`, folderMeta(guidFor(relativePath)));
      visit(absolutePath);
      continue;
    }
    if (relativePath === 'package.json') continue;
    fs.writeFileSync(
      `${absolutePath}.meta`,
      fileMeta(guidFor(relativePath), path.extname(entry.name).toLowerCase())
    );
  }
}

visit(packageRoot);
console.log('NexusVoice deterministic package metadata generated');
