const fs = require('node:fs');
const path = require('node:path');
const { KokoroTTS } = require('kokoro-js');
const WavEncoder = require('wav-encoder');

const root = path.resolve(__dirname, '..');
const modelPath = path.join(root, 'models', 'kokoro');
const outputPath = path.join(root, 'output', 'nexusvoice-kokoro-joke.wav');

const joke = [
  'I asked my computer to tell me a joke.',
  'It said, “I would, but I’m still processing my feelings.”',
  'So I gave it a moment.',
  'Now it has a twenty-minute software update and a therapist named Gary.'
].join(' ');

async function main() {
  if (!fs.existsSync(path.join(modelPath, 'onnx', 'model_quantized.onnx'))) {
    throw new Error(`Missing Kokoro model: ${path.join(modelPath, 'onnx', 'model_quantized.onnx')}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log('Loading local Kokoro quantized ONNX model...');
  const tts = await KokoroTTS.from_pretrained(modelPath, {
    dtype: 'q8',
    device: 'cpu',
    progress_callback: (progress) => {
      if (progress?.status === 'progress' && progress?.progress != null) {
        process.stdout.write(`\rLoading: ${progress.progress.toFixed(1)}%`);
      }
    },
  });
  process.stdout.write('\n');

  console.log('Generating natural speech with voice af_heart...');
  const audio = await tts.generate(joke, {
    voice: 'af_heart',
    speed: 0.96,
  });

  const wav = await WavEncoder.encode({
    sampleRate: audio.sampling_rate,
    channelData: [audio.audio],
  });
  fs.writeFileSync(outputPath, Buffer.from(wav));

  console.log(`Wrote ${outputPath}`);
  console.log(`Voice: af_heart | Sample rate: ${audio.sampling_rate} Hz | Samples: ${audio.audio.length}`);
  console.log(`Text: ${joke}`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
