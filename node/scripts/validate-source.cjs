const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const runtimeRoot = path.join(repositoryRoot, 'unity', 'Packages', 'com.luminarylabs.nexusvoice', 'Runtime');
const emitterPath = path.join(runtimeRoot, 'NexusVoiceEmitter.cs');
const emitter = fs.readFileSync(emitterPath, 'utf8');

const required = [
  'class NexusVoiceEmitter : MonoBehaviour',
  'void Speak(string text)',
  'void Queue(string text)',
  'Task<AudioClip> GenerateAsync',
  'void Focus()',
  'void ReleaseFocus()',
  'void Skip()',
  'void Stop()',
  'AudioClipEventWrapper OnAudioClipReady',
  'NexusVoiceEmitterEventWrapper OnFocusGained',
  'NexusVoiceEmitterEventWrapper OnFocusLost'
];

for (const fragment of required) {
  if (!emitter.includes(fragment)) throw new Error(`Missing NexusVoiceEmitter API fragment: ${fragment}`);
}

const componentDeclarations = fs.readdirSync(runtimeRoot)
  .filter(filename => filename.endsWith('.cs'))
  .flatMap(filename => fs.readFileSync(path.join(runtimeRoot, filename), 'utf8').match(/class\s+\w+\s*:\s*MonoBehaviour/g) || []);

if (componentDeclarations.length !== 1 || componentDeclarations[0] !== 'class NexusVoiceEmitter : MonoBehaviour') {
  throw new Error(`Expected one runtime MonoBehaviour, found: ${componentDeclarations.join(', ')}`);
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'unity', 'Packages', 'com.luminarylabs.nexusvoice', 'package.json'))
);
if (packageJson.version !== '0.2.0-preview.1') throw new Error(`Unexpected Unity package version: ${packageJson.version}`);

console.log('NexusVoice source validation passed: one public Unity component');
