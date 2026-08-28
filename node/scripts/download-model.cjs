const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const url = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx';
const destination = path.resolve(__dirname, '..', 'models', 'kokoro', 'onnx', 'model_quantized.onnx');

function download(source, target, redirects = 0) {
  if (redirects > 8) throw new Error('Too many redirects while downloading Kokoro model');
  https.get(source, response => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      response.resume();
      download(response.headers.location, target, redirects + 1);
      return;
    }
    if (response.statusCode !== 200) {
      throw new Error(`Model download failed with HTTP ${response.statusCode}`);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.partial`;
    const stream = fs.createWriteStream(temporary);
    response.pipe(stream);
    stream.on('finish', () => {
      stream.close();
      fs.renameSync(temporary, target);
      console.log(`Downloaded Kokoro model to ${target}`);
    });
  }).on('error', error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

if (fs.existsSync(destination) && fs.statSync(destination).size > 80_000_000) {
  console.log(`Kokoro model already present at ${destination}`);
} else {
  download(url, destination);
}
