const fs = require('node:fs');
const path = require('node:path');
const { KokoroTTS } = require('kokoro-js');
const WavEncoder = require('wav-encoder');

const root = path.resolve(__dirname);
const modelPath = path.join(root, 'models', 'kokoro');
let modelPromise;

function loadModel() {
  if (!modelPromise) {
    modelPromise = KokoroTTS.from_pretrained(modelPath, { dtype: 'q8', device: 'cpu' });
  }
  return modelPromise;
}

async function synthesize({ text, voice = 'af_heart', speed = 0.96 }) {
  if (typeof text !== 'string' || text.trim().length === 0) throw new Error('text is required');
  const tts = await loadModel();
  const audio = await tts.generate(text, { voice, speed: Number(speed) });
  const wav = await WavEncoder.encode({ sampleRate: audio.sampling_rate, channelData: [audio.audio] });
  return { wav: Buffer.from(wav), sampleRate: audio.sampling_rate, samples: audio.audio.length };
}

function modelInfo() {
  const model = path.join(modelPath, 'onnx', 'model_quantized.onnx');
  return {
    id: 'kokoro-82m-q8',
    modelPath: path.relative(root, model),
    modelBytes: fs.existsSync(model) ? fs.statSync(model).size : 0,
    voices: ['af_heart', 'af_bella', 'af_nicole', 'am_michael', 'am_fenrir', 'bf_emma', 'bm_george'],
  };
}

module.exports = { loadModel, modelInfo, synthesize };
