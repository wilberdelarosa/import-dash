const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');

const MAPPING = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function encodePlantUML(data) {
  let res = '';
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i];
    const b2 = i + 1 < data.length ? data[i+1] : 0;
    const b3 = i + 2 < data.length ? data[i+2] : 0;
    const c1 = (b1 >> 2) & 0x3F;
    const c2 = ((b1 & 0x3) << 4 | (b2 >> 4)) & 0x3F;
    const c3 = ((b2 & 0xF) << 2 | (b3 >> 6)) & 0x3F;
    const c4 = b3 & 0x3F;
    res += MAPPING[c1] + MAPPING[c2] + MAPPING[c3] + MAPPING[c4];
  }
  return res;
}

function deflateAndEncode(text) {
  const compressed = zlib.deflateRawSync(Buffer.from(text, 'utf8'));
  return encodePlantUML(compressed);
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const pumlPath = path.join(repoRoot, 'diagrams', 'architecture.puml');
  const outPath = path.join(repoRoot, 'diagrams', 'architecture.png');

  if (!fs.existsSync(pumlPath)) {
    console.error('PUML not found:', pumlPath);
    process.exit(1);
  }

  let text = fs.readFileSync(pumlPath, 'utf8');
  if (!text.includes('@startuml')) {
    text = '@startuml\n' + text + '\n@enduml\n';
  }

  const encoded = deflateAndEncode(text);
  const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
  console.log('Requesting', url);

  const file = fs.createWriteStream(outPath);
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error('Failed request, status:', res.statusCode);
      res.pipe(process.stdout);
      process.exit(2);
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Wrote', outPath);
    });
  }).on('error', (err) => {
    console.error('Request error:', err.message);
    process.exit(3);
  });
}

main();
