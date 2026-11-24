import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mapEvent } from '../../../packages/v2-live-gateway/mapper.mjs';

const folder = new URL('../../../packages/v2-live-gateway/evidence/p10b6-r2/', import.meta.url);
const local = new URL('../evidence/p10b6-local/', import.meta.url);
function stats(points) {
  if (!points.length) return null;
  const values = [...points].sort((a, b) => a - b);
  const at = p => Number(values[Math.ceil(p * values.length) - 1].toFixed(1));
  return { n: values.length, p50: at(.50), p95: at(.95), max: at(1) };
}

export async function recordR2({ dashboard, overlay, gateway, audio, receive, room, wait, waitPage, apply, voiceTiming, sha, wav, metrics, browser }) {
  await apply({ master: true, wind: false, idleBell: false, 'water-volume': 65 }, 'LOCKED');
  await overlay.locator('#capture').click();
  await wait(() => gateway.audioApplied?.state === 'READY', 'unlock before R2');
  const owner = gateway.owner;
  const source = await overlay.evaluate(() => window.viewerReport.repoRevision);
  const latencies = { priority: [], channel: [], volume: [] };
  const waitForPcm = async (after, silent) => {
    const point = await waitPage(overlay, ([after, silent]) => {
      const blocks = window.audioTap?.blocks;
      if (!blocks) return;
      const index = blocks.findIndex((block, i) => block.wall >= after && (silent
        ? block.peak === 0 && blocks[i + 1]?.peak === 0
        : block.peak > 4));
      if (index >= 0) return blocks[index].wall;
    }, [after, silent]);
    return (await point.jsonValue()) - after;
  };
  const eventTime = () => dashboard.evaluate(() => performance.timeOrigin + performance.now());
  const actualChange = async (target, order, event = 'change') => {
    await target.evaluate((node, kind) => node.addEventListener(kind, () => {
      window.audioInputWall = performance.timeOrigin + performance.now();
    }, { once: true, capture: true }), event);
    await order();
    return dashboard.evaluate(() => window.audioInputWall);
  };

  // Leave an invalid interval draft in the form while every other audio command remains usable.
  await dashboard.locator('#audio-idle-seconds').fill('4');
  await dashboard.locator('#audio-idle-seconds').blur();
  await dashboard.locator('#audio-idle-error').waitFor();
  assert.equal(audio.snapshot.settings.idleSeconds, null);

  await waitForPcm(await eventTime(), false);
  for (let index = 0; index < 4; index++) {
    const water = dashboard.locator('#audio-water');
    const started = await actualChange(water, () => water.uncheck());
    latencies.channel.push(await waitForPcm(started, true));
    const enabled = await actualChange(water, () => water.check());
    await waitForPcm(enabled, false);

    const volume = dashboard.locator('#audio-water-volume');
    const before = audio.snapshot.revision;
    const requested = await actualChange(volume, () => volume.press('ArrowLeft'));
    await wait(() => audio.snapshot.revision > before, 'slider persisted');
    const revision = audio.snapshot.revision;
    const sample = await waitPage(overlay, revision => {
      if (window.viewerReport?.audio?.applied?.revision >= revision) return performance.timeOrigin + performance.now();
    }, revision);
    latencies.volume.push((await sample.jsonValue()) - requested);
    assert.equal(audio.snapshot.settings.water.volume, 64 - index);

    const mute = dashboard.locator('#audio-mute');
    const muted = await actualChange(mute, () => mute.click(), 'click');
    latencies.priority.push(await waitForPcm(muted, true));
    await wait(() => gateway.audioApplied?.state === 'MUTED', 'confirmed priority mute');
    const master = dashboard.locator('#audio-master');
    await master.check();
    await wait(() => gateway.audioApplied?.state === 'READY', 'fresh enable after mute');
    await waitForPcm(await eventTime(), false);
  }

  const namedToggle = dashboard.locator('#audio-named');
  await namedToggle.check();
  await apply({ giftThanks: true, water: false }, 'READY');
  assert.equal(audio.snapshot.settings.namedEnabled, true);
  await dashboard.locator('#audio-idle-error').waitFor();
  assert.equal(audio.snapshot.settings.idleSeconds, null);
  await dashboard.locator('#audio-idle-seconds').fill('');
  await dashboard.locator('#audio-idle-seconds').blur();

  const packet = (id, user, alias, count = 2, phase = 1) => {
    const raw = { common: { roomId: room, msgId: String(id * 2 + phase), createTime: String(Date.now()) },
      user: { id: String(user), nickname: alias }, giftId: '5655', groupId: String(id),
      repeatEnd: phase, repeatCount: count, gift: { type: 1 } };
    receive({ type: 'event', event: mapEvent('gift', raw, room, Date.now()) });
  };
  const voiceCount = () => overlay.evaluate(() => window.viewerReport.audio.marks.filter(mark => mark.event === 'voice-start').length);
  const quiet = () => waitPage(overlay, () => window.viewerReport?.mode === 'CINEMATIC');
  async function batch(gifts, waitQuiet = true) {
    if (waitQuiet) await quiet();
    const before = await voiceCount();
    for (const gift of gifts) packet(...gift);
    await waitPage(overlay, limit => window.viewerReport.audio.marks.filter(mark => mark.event === 'voice-start').length >= limit,
      before + gifts.length);
    await quiet();
    await wait(() => gateway.sequence === gateway.acknowledged, 'batch consumed ACK');
  }

  packet(701, 101, 'An Lam', 2, 0);
  await wait(() => gateway.acknowledged === gateway.sequence, 'progress ACK');
  assert.equal(voiceTiming.length, 0);
  await batch([[701, 101, 'An Lam'], [702, 102, 'An Lam'], [703, 103, 'Bình Sương']], false);
  packet(701, 101, 'An Lam');
  await batch([[704, 101, 'Linh Mây'], [705, 102, 'An Lam'], [706, 103, 'Bình Sương']]);
  await batch([[707, 101, 'Linh Mây'], [708, 102, 'An Lam'], [709, 103, 'https.com']]);

  await dashboard.locator('#audio-variety').uncheck();
  await wait(() => gateway.audioApplied?.revision === audio.snapshot.revision && audio.snapshot.settings.namedVariety === false,
    'fixed template applied');
  await batch([[710, 101, 'Linh Mây']]);
  await batch([[711, 101, 'Linh Mây']]);

  const packed = await overlay.evaluate(() => ({ rate: window.audioTap.rate, data: window.audioTap.encode(),
    marks: window.viewerReport.audio.marks, graphics: window.viewerReport.graphics,
    confirmed: window.viewerReport.confirmedGiftCount }));
  const pcm = Buffer.from(packed.data, 'base64');
  const recording = wav(pcm, packed.rate);
  const air = metrics(pcm);
  const voices = packed.marks.filter(mark => mark.event === 'voice-start');
  const hits = voices.filter(mark => mark.variant === 'named').length;
  const successes = voiceTiming.filter(item => item.status === 200);
  const unique = [...new Set(successes.map(item => item.template))].sort((a, b) => a - b);
  const timing = Object.fromEntries(Object.entries(latencies).map(([kind, points]) => [kind, { ...stats(points), valuesMs: points }]));
  const render = await overlay.locator('#stage').screenshot();
  const screen = await dashboard.screenshot({ fullPage: true });
  assert.deepEqual([render.readUInt32BE(16), render.readUInt32BE(20)], [720, 1280]);
  assert.equal(gateway.owner, owner);
  assert.equal(gateway.connection, 1);
  assert.equal(gateway.counters.giftFinal, 11);
  assert.equal(gateway.counters.giftProgress, 1);
  assert.equal(voices.length, 11);
  assert(air.peakDbFS <= -1 && air.clipping === 0);
  for (let i = 1; i < voices.length; i++) {
    assert(voices[i].contextSec >= voices[i-1].contextSec + voices[i-1].seconds);
  }
  for (const mark of voices) {
    const chime = packed.marks.find(s => s.event === 'sfx-start' && s.request === mark.request);
    assert(chime && mark.seat === chime.seat && mark.contextSec >= chime.contextSec);
    assert(mark.sceneMs - chime.sceneMs <= 350);
  }

  const receipt = {
    method: 'Built Edge Dashboard and LIVE Overlay, synthetic final gifts via isolated Gateway, actual opt-in gTTS/FFmpeg. No real viewer names.',
    source, browser: browser.version(), gpu: packed.graphics, timing,
    localTargetsMet: { priority: timing.priority.max <= 500, channel: timing.channel.max <= 500, volume: timing.volume.max <= 750 },
    provider: {
      variedTemplateIds: unique, actualSynthesis: unique.length >= 6, hits, fallback: voices.length - hits,
      cold: stats(successes.filter(row => row.mode === 'cold').map(row => row.ms)),
      warm: stats(successes.filter(row => row.mode === 'warm').map(row => row.ms)),
      cache: stats(successes.filter(row => row.mode === 'cache').map(row => row.ms)),
      requests: voiceTiming,
    },
    recording: { ...air, seconds: pcm.length / 2 / packed.rate, sampleRate: packed.rate, sha256: sha(recording) },
    continuity: { connection: gateway.connection, acknowledged: gateway.acknowledged, confirmed: packed.confirmed },
    voices: voices.map(({ event, request, seat, variant, sceneMs, seconds, contextSec }) => ({
      event, request, seat, variant, sceneMs, seconds, contextSec,
    })),
    captures: { dashboard: sha(screen), overlay: sha(render) },
  };
  await mkdir(folder, { recursive: true });
  await mkdir(local, { recursive: true });
  await writeFile(new URL('receipt.json', folder), JSON.stringify(receipt, null, 2) + '\n');
  await writeFile(new URL('dashboard.png', folder), screen);
  await writeFile(new URL('overlay.png', folder), render);
  await writeFile(new URL('live-audio-r2.wav', local), recording);
  console.log(JSON.stringify({ timing, provider: receipt.provider, recording: receipt.recording }, null, 2));
  if (unique.length < 6) console.log('Actual selected-provider coverage below six templates; see receipt.');
}
