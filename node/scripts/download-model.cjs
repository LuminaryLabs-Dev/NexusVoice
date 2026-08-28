const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const crypto = require('node:crypto');

const url = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx';
const destination = path.resolve(__dirname, '..', 'models', 'kokoro', 'onnx', 'model_quantized.onnx');
const expectedSha256 = 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478';

function sha256(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

function isValid(filename) {
  return fs.existsSync(filename)
    && fs.statSync(filename).size > 80_000_000
    && sha256(filename) === expectedSha256;
}

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
      if (!isValid(temporary)) {
        fs.rmSync(temporary, { force: true });
        console.error('Downloaded Kokoro model failed SHA-256 validation');
        process.exitCode = 1;
        return;
      }
      fs.renameSync(temporary, target);
      console.log(`Downloaded and verified Kokoro model at ${target}`);
    });
  }).on('error', error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

if (isValid(destination)) {
  console.log(`Verified Kokoro model at ${destination}`);
} else {
  download(url, destination);
}
