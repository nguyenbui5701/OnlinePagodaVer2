import test from 'node:test';
import assert from 'node:assert/strict';
import { IdleBlessingDirector, idleGap } from '../src/audio/idle-blessing.ts';
import { NamedVoice, decodeNamedPcm, demoName, maxPcmBytes, type NamedProvider, type VoiceTemplate } from '../src/audio/named-voice.ts';
import type { Cue } from '../src/audio/director.ts';

const pcm = new Uint8Array(48000);
new DataView(pcm.buffer).setInt16(102, 12000, true);
const cue = (sequence: number, actorId = 'demo-actor-1', request = 'gift-1'): Cue => ({
  room: 'demo-1', request, sequence, sound: 'rose', count: 2, expires: 5000,
  binding: { actorId, seatId: 'seat-1' }, identity: { epoch: 2, count: 2, nameId: 'an' },
});
const flush = () => new Promise(resolve => setImmediate(resolve));

test('idle seeded ranges stay reproducible and reset a complete quiet interval on activity', () => {
  const pool = [0, 1, 2, 3, 4].map(n => ({ id: 'wish-' + n, kind: 'speech' as const }));
  const collect = (seed: number) => {
    const director = new IdleBlessingDirector(seed);
    const output: { at: number; id: string }[] = [];
    for (let at = 0; at < 500_000; at += 100) {
      const picked = director.update(at, at < 15_000 || at >= 21_000, pool);
      if (picked) output.push({ at, id: picked.id });
    }
    return output;
  };
  const a = collect(9);
  assert.deepEqual(a, collect(9));
  assert.notDeepEqual(a, collect(71));
  assert(a[0].at >= 41000 && a[0].at <= 61000);
  for (let i = 1; i < a.length; i++) {
    assert(a[i].at - a[i - 1].at >= 25000 && a[i].at - a[i - 1].at <= 45200);
    assert(!a.slice(Math.max(0, i - 3), i).some(last => last.id === a[i].id));
  }
  assert.equal(idleGap('1'), 10000);
  assert.equal(idleGap('999'), 120000);
  assert.equal(idleGap('bad'), undefined);
});

test('idle disable and busy interruptions leave no queued cue or catch-up', () => {
  const director = new IdleBlessingDirector(5, 10000);
  const bell = [{ kind: 'bell', id: 'bell' }] as const;
  assert.equal(director.update(0, true, bell), undefined);
  director.update(9950, false, bell);
  assert.equal(director.update(100000, true, bell), undefined);
  assert.equal(director.update(109999, true, bell), undefined);
  assert.equal(director.update(110000, true, bell)?.id, 'bell');
  director.update(111000, true, []);
  assert.equal(director.update(150000, true, bell), undefined);
});

test('same-name different actor and coalesced sequence cannot borrow stale audio', async () => {
  const jobs: { template: VoiceTemplate; signal: AbortSignal; done: (value: Uint8Array) => void }[] = [];
  const service: NamedProvider = (template, signal) => new Promise(done => jobs.push({ template, signal, done }));
  const voice = new NamedVoice(service);
  const first = cue(1);
  const second = cue(2);
  const differentActor = cue(3, 'demo-actor-2', 'gift-2');
  voice.prefetch(first);
  await flush();
  voice.prefetch(second);
  voice.prefetch(differentActor);
  await flush();
  assert(jobs[0].signal.aborted);
  assert.deepEqual(jobs[1].template, { nameId: 'an', gift: 'rose', count: 2 });
  jobs[0].done(pcm);
  jobs[1].done(pcm);
  await flush();
  assert.equal(voice.pick(first, 100, 2000, true), undefined);
  assert(voice.pick(second, 100, 2000, true) instanceof Float32Array);
  assert.equal(voice.pick(differentActor, 100, 2000, true), 'waiting');
  voice.clear();
  assert(jobs[2].signal.aborted);
  jobs[2].done(pcm);
  await flush();
  assert.equal(voice.pick(differentActor, 101, 2000, true), undefined);
});

test('slow, busy, corrupt, oversized and insufficient-hold voice choose fixed fallback', async () => {
  let reply!: (bytes: Uint8Array) => void;
  const slow = new NamedVoice(() => new Promise(resolve => { reply = resolve; }));
  const source = cue(1);
  slow.prefetch(source);
  await flush();
  assert.equal(slow.pick(source, 1000, 1000, false), undefined);
  assert.equal(slow.pick(source, 1001, 4500, true), 'waiting');
  assert.equal(slow.pick(source, 1349, 4200, true), 'waiting');
  assert.equal(slow.pick(source, 1350, 4200, true), undefined);
  reply(pcm);
  await flush();
  assert.equal(slow.pick(source, 1351, 4200, true), undefined);
  for (const service of [
    async () => { throw new Error('busy'); },
    async () => new Uint8Array(48000),
    async () => new Uint8Array(maxPcmBytes + 2),
  ]) {
    const failed = new NamedVoice(service);
    failed.prefetch(source);
    await flush();
    assert.equal(failed.pick(source, 1000, 4500, true), undefined);
  }
  const valid = new NamedVoice(async () => pcm);
  valid.prefetch(source);
  await flush();
  assert.equal(valid.pick(source, 1000, 900, true), undefined);
  assert.throws(() => decodeNamedPcm(pcm.subarray(0, 4801)), /invalid-pcm/);
  assert.equal(demoName('User <test>'), undefined);
  assert.equal(demoName('B\u00ecnh'), 'binh');
});

test('unseated and unknown gifts never request a synthetic name', async () => {
  const calls: VoiceTemplate[] = [];
  const service = new NamedVoice(async payload => { calls.push(payload); return pcm; });
  service.prefetch({ ...cue(1), binding: undefined });
  service.prefetch({ ...cue(2), sound: 'generic' });
  await flush();
  assert.deepEqual(calls, []);
});

test('preload timeout aborts the provider and leaves fixed fallback eligible', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal: AbortSignal | undefined;
  const service = new NamedVoice((_template, pending) => {
    signal = pending;
    return new Promise(() => {});
  });
  const source = cue(1);
  service.prefetch(source);
  await Promise.resolve();
  assert.equal(service.pick(source, 0, 4500, true), 'waiting');
  t.mock.timers.tick(8000);
  assert(signal?.aborted);
  assert.equal(service.pending, false);
  assert.equal(service.pick(source, 8000, 4500, true), undefined);
});
