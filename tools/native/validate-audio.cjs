const fs = require('node:fs');
const path = require('node:path');
const { synthesize } = require('../../node/engine.cjs');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const nativeWav = path.join(
  repositoryRoot,
  'native',
  'build',
  'nexusvoice-native-smoke.wav'
);
const nodeWav = path.join(repositoryRoot, 'native', 'build', 'nexusvoice-node-reference.wav');
const text = 'The voice engine asked for a raise. Apparently it has been working text to speech.';

function parseWave(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF'
      || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Expected a RIFF WAVE file.');
  }

  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') {
      format = {
        encoding: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bits: buffer.readUInt16LE(start + 14)
      };
    } else if (id === 'data') {
      data = buffer.subarray(start, Math.min(start + length, buffer.length));
    }
    offset = start + length + (length % 2);
  }
  if (!format || !data || format.channels !== 1) {
    throw new Error('Expected a mono WAVE file with fmt and data chunks.');
  }

  const samples = [];
  if (format.encoding === 1 && format.bits === 16) {
    for (let index = 0; index + 2 <= data.length; index += 2) {
      samples.push(data.readInt16LE(index) / 32768);
    }
  } else if (format.encoding === 3 && format.bits === 32) {
    for (let index = 0; index + 4 <= data.length; index += 4) {
      samples.push(data.readFloatLE(index));
    }
  } else {
    throw new Error(`Unsupported WAVE encoding ${format.encoding}/${format.bits}.`);
  }
  return { ...format, samples };
}

function metrics(name, wave) {
  let peak = 0;
  let sum = 0;
  let squared = 0;
  let rails = 0;
  for (const sample of wave.samples) {
    if (!Number.isFinite(sample)) throw new Error(`${name} contains non-finite audio.`);
    peak = Math.max(peak, Math.abs(sample));
    sum += sample;
    squared += sample * sample;
    if (Math.abs(sample) >= 0.9995) rails += 1;
  }
  const result = {
    sampleRate: wave.sampleRate,
    samples: wave.samples.length,
    duration: wave.samples.length / wave.sampleRate,
    peak,
    rms: Math.sqrt(squared / wave.samples.length),
    dc: Math.abs(sum / wave.samples.length),
    railRatio: rails / wave.samples.length
  };
  if (result.sampleRate !== 24000 || result.duration < 0.5
      || result.peak < 0.01 || result.peak > 1.01 || result.rms < 0.001
      || result.dc > 0.25 || result.railRatio > 0.25) {
    throw new Error(`${name} failed audio validation: ${JSON.stringify(result)}`);
  }
  return result;
}

async function main() {
  if (!fs.existsSync(nativeWav)) {
    throw new Error('Native smoke WAV is missing. Run npm run native:build first.');
  }
  const reference = await synthesize({ text, voice: 'af_heart', speed: 0.96 });
  fs.writeFileSync(nodeWav, reference.wav);

  const native = metrics('native', parseWave(fs.readFileSync(nativeWav)));
  const node = metrics('node', parseWave(fs.readFileSync(nodeWav)));
  const durationRatio = native.duration / node.duration;
  if (durationRatio < 0.5 || durationRatio > 2) {
    throw new Error(`Native/reference duration ratio is unreasonable: ${durationRatio}`);
  }

  console.log(JSON.stringify({ native, node, durationRatio }, null, 2));
  console.log('Native and Node Kokoro audio validation passed.');
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});

