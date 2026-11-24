import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const entry = resolve(process.env.V2_ESPEAK_JS);
const { default: synthesize } = await import(pathToFileURL(entry));
const wasmBinary = await readFile(join(dirname(entry), 'espeak-ng.wasm'));
const phrases = [
  ['an', 'Cảm ơn An đã gửi năm hoa hồng.'],
  ['binh', 'Cảm ơn Bình đã gửi hoa hồng.'],
  ['chi', 'Cảm ơn Chi đã gửi hoa hồng.'],
  ['wish-01', 'Chúc bạn một ngày bình an.'],
  ['wish-02', 'Chúc mọi người thân tâm an lạc.'],
  ['wish-03', 'Chúc gia đình bạn luôn mạnh khỏe.'],
  ['wish-04', 'Chúc bạn có một buổi tối nhẹ nhàng.'],
  ['wish-05', 'Mong bạn tìm thấy phút giây tĩnh lặng.'],
  ['wish-06', 'Chúc nụ cười luôn nở trên môi bạn.'],
  ['wish-07', 'Mong ngày mai mang đến niềm vui.'],
  ['wish-08', 'Chúc bạn an nhiên trong từng nhịp thở.'],
  ['wish-09', 'Mong những điều tử tế đến với mọi người.'],
  ['wish-10', 'Chúc bạn và người thân nhiều bình an.'],
  ['wish-11', 'Chúc bạn nghỉ ngơi và ngủ thật ngon.'],
  ['wish-12', 'Chúc lòng bạn nhẹ như gió trên hồ.'],
];
const folder = new URL('../evidence/p10b4b/r2/voice/', import.meta.url);
await mkdir(folder, { recursive: true });
const rows = [];
for (const [id, phrase] of phrases) {
  const program = await synthesize({ wasmBinary, arguments: ['-w', '/speech.wav', '-v', 'vi', '-s', '155', '-b', '1', phrase] });
  const input = program.FS.readFile('/speech.wav');
  const process = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', '24000',
    '-af', 'volume=0.75', '-f', 's16le', 'pipe:1'], { input, maxBuffer: 2000000 });
  assert.equal(process.status, 0, process.stderr.toString());
  const pcm = process.stdout;
  const seconds = pcm.length / 48000;
  assert(seconds >= .25 && seconds <= (id.startsWith('wish-') ? 6 : 4), id + ' duration ' + seconds);
  let peak = 0, clipped = 0;
  for (let i = 0; i < pcm.length; i += 2) {
    const sample = Math.abs(pcm.readInt16LE(i));
    peak = Math.max(peak, sample);
    if (sample >= 32767) clipped++;
  }
  assert(peak > 1000 && clipped === 0);
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const wave = Buffer.concat([header, pcm]);
  await writeFile(new URL(id + '.wav', folder), wave);
  rows.push({ id, phrase, bytes: wave.length, seconds, peak, clipped,
    sha256: createHash('sha256').update(wave).digest('hex') });
}
await writeFile(new URL('manifest.json', folder), JSON.stringify({
  scope: 'Separately labelled offline eSpeak NG listening candidate; original DEMO text; no gTTS or product voice replacement.',
  generator: 'espeak-ng npm 1.0.2 (GPL-3.0-or-later), Emscripten Vietnamese vi, speed 155',
  format: 'WAV PCM16 LE mono 24000 Hz', files: rows,
}, null, 2) + '\n');
console.log('Generated', rows.length, 'offline Vietnamese speech WAVs');
