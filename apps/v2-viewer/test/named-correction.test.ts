import assert from 'node:assert/strict';
import test from 'node:test';
import { gift } from '../../../packages/v2-events/src/fixture.ts';
import { AudioDirector } from '../src/audio/director.ts';
import { NamedVoice, type VoiceTemplate } from '../src/audio/named-voice.ts';
import { SliceDriver, timing } from '../src/slice-driver.ts';

const known = { userKey: 'r2-synthetic', name: 'An' };
const pcm = (peak: number) => {
  const samples = new Uint8Array(4800);
  new DataView(samples.buffer).setInt16(0, peak, true);
  return samples;
};
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(events: ConstructorParameters<typeof SliceDriver>[1]) {
  const driver = new SliceDriver('community', events, true);
  const jobs: { item: VoiceTemplate; signal: AbortSignal; resolve: (bytes: Uint8Array) => void }[] = [];
  const played: { at: number; variant: 'named' | 'offline'; sample?: number; sequence: number }[] = [];
  const chimes: number[] = [];
  let at = 0;
  const voice = new NamedVoice((item, signal) => new Promise(resolve => jobs.push({ item, signal, resolve })));
  const director = new AudioDirector(timing.focusHoldMs, {
    cut() {},
    sfx() { chimes.push(at); },
    prepare: cue => voice.prefetch(cue),
    discard: id => voice.cancel(id),
    voice(cue, available, waitUntil) {
      const result = voice.pick(cue, at, available, available - Math.max(0, waitUntil - at) >= 2100, waitUntil);
      if (result === 'waiting') return result;
      played.push({ at, variant: result ? 'named' : 'offline', sample: result?.[0], sequence: cue.sequence });
      return 'started';
    },
  });
  director.enable(true);
  return { jobs, played, chimes, director,
    step(time: number) {
      at = time;
      const frame = driver.update(time);
      director.frame(frame.state, frame.audio!.epoch, frame.audio!.records, frame.actor);
      return frame;
    },
  };
}

for (const renamed of ['B\u00ecnh', 'T\u00ean ch\u01b0a duy\u1ec7t']) {
  test('P1-01A rejects queued name after registry changes to ' + renamed, async () => {
    const h = harness([gift('start', 1000, { viewer: known }), {
      type: 'chat', atMs: 1500, roomEpoch: 1, connection: 1, eventId: 'r2-rename', viewer: { ...known, name: renamed },
    }]);
    h.step(1000);
    await flush();
    assert.deepEqual(h.jobs[0].item, { nameId: 'an', gift: 'rose', count: 1 });
    const before = h.step(1500);
    assert(h.jobs[0].signal.aborted);
    h.jobs[0].resolve(pcm(3000));
    await flush();
    const focused = h.step(2050);
    assert.equal(focused.actor?.displayName, renamed);
    assert.equal(focused.actor?.seatId, 'seat-1');
    assert.equal(focused.state.focus?.actorId, before.state.focus?.actorId);
    assert.equal(focused.state.confirmedGiftCount, 1);
    assert.equal(h.jobs.length, 1);
    assert.deepEqual(h.played.map(x => x.variant), ['offline']);
    assert.deepEqual(h.chimes, [2050]);
    assert.equal(h.director.suppressed['name-changed'], 1);
  });
}

for (const arrivesInTime of [true, false]) {
  test('P1-01B uses latest generation and keeps original 350 ms deadline (' + arrivesInTime + ')', async () => {
    const h = harness([
      gift('start', 1000, { viewer: known, count: 2 }),
      gift('later', 2220, { viewer: { ...known, name: 'B\u00ecnh' }, giftId: 'lantern', count: 3 }),
      gift('after-voice', 2500, { viewer: known, count: 1 }),
    ]);
    const before = h.step(1000);
    await flush();
    h.step(2050);
    assert.deepEqual(h.chimes, [2050]);
    assert.equal(h.played.length, 0);
    const latest = h.step(2220);
    await flush();
    assert.equal(latest.state.focus?.requestId, before.state.focus?.requestId);
    assert.equal(latest.state.confirmedGiftCount, 5);
    assert(h.jobs[0].signal.aborted);
    assert.deepEqual(h.jobs[1].item, { nameId: 'binh', gift: 'lantern', count: 3 });
    h.jobs[0].resolve(pcm(3000));
    await flush();
    h.step(2390);
    assert.equal(h.played.length, 0);
    h.jobs[1].resolve(pcm(8100));
    await flush();
    const expected = arrivesInTime ? 2399 : 2400;
    h.step(expected);
    h.step(2500);
    assert.deepEqual(h.chimes, [2050]);
    assert.equal(h.jobs.length, 2);
    assert.deepEqual(h.played.map(x => [x.at, x.variant, x.sample]),
      [[expected, arrivesInTime ? 'named' : 'offline', arrivesInTime ? 8100 / 32768 : undefined]]);
  });
}
