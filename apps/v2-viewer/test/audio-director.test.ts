import assert from 'node:assert/strict';
import test from 'node:test';
import type { Snapshot } from '../../../packages/v2-events/src/protocol.ts';
import { giftSound, AudioDirector, maxPending, type AudioSink, type Binding, type Cue, type CueRecord } from '../src/audio/director.ts';
import { SliceDriver, timing } from '../src/slice-driver.ts';

function harness(live = false) {
  const starts: Cue[] = [];
  const sounds: Cue[] = [];
  const cuts: string[] = [];
  const deadlines: number[] = [];
  let outcome: ReturnType<AudioSink['voice']> = 'started';
  const director = new AudioDirector(timing.focusHoldMs, {
    sfx: cue => sounds.push(structuredClone(cue)),
    voice(cue, available) {
      deadlines.push(available);
      if (outcome === 'started') starts.push(structuredClone(cue));
      return outcome;
    },
    cut: reason => cuts.push(reason),
  }, live);
  return { director, starts, sounds, cuts, deadlines, wait: () => { outcome = 'waiting'; },
    finish: () => { outcome = 'started'; } };
}

const first = { actorId: 'demo-actor-one', seatId: 'seat-1' };
const second = { actorId: 'demo-actor-two', seatId: 'seat-2' };

function fixtures() {
  let sequence = 0;
  let revision = 0;
  const actor = (binding: Binding) => ({ ...binding, displayName: 'Same DEMO name', visible: true,
    appearanceVariant: 'demo', revision: 0 });
  const intent = (requestId: string, binding = first) => ({ requestId, actorId: binding.actorId,
    roomSessionId: 'demo-room', firstSeenAtMs: 10, expiresAtMs: 20_000, giftCount: 1, giftId: 'rose', confirmation: 'confirmed' as const });
  const record = (effect: CueRecord['effect'], epoch = 0): CueRecord => ({
    effect, sequence: ++sequence, epoch, room: 'demo-room', revision: ++revision, disposition: 'accepted',
    seatId: 'actorId' in effect && effect.actorId === second.actorId ? second.seatId : first.seatId,
  });
  const final = (requestId: string, atMs: number, binding?: Binding) =>
    record({ type: 'giftFx', atMs, requestId, actorId: binding?.actorId, giftId: 'rose', giftCount: 1, displayName: 'Same DEMO name',
      confirmation: 'confirmed', anchor: binding ? 'giftFx' : 'overlay', dedicatedFocus: !!binding });
  const focus = (id: string, atMs: number, binding = first) =>
    record({ type: 'focusStarted', atMs, intent: intent(id, binding) });
  const state = (atMs: number, cameraMode: Snapshot['camera']['mode'] = 'CINEMATIC',
    requestId?: string, binding = first, connected = true, room = 'demo-room'): Snapshot => ({
    atMs, revision: ++revision, roomSessionId: room, version: '0.2.0', connected,
    confirmedGiftCount: 2, viewerCount: 3, avatars: [actor(first), actor(second)],
    focus: requestId ? intent(requestId, binding) : undefined,
    camera: { mode: cameraMode, activeRequestId: requestId, activeActorId: requestId ? binding.actorId : undefined, pendingGivers: 0 },
  });
  return { state, final, focus, record };
}

test('actual capacity fixture exposes accepted effects once and speaks A/B/C with original totals', () => {
  const driver = new SliceDriver('capacity', [], true);
  const { director, starts, sounds } = harness();
  director.enable(true);
  let state;
  let accepted = 0;
  let observed = 0;
  for (let t = 0; t <= 66_000; t += 10) {
    const frame = driver.update(t);
    state = frame.state;
    for (const { effect } of frame.audio!.records) {
      if (effect.type === 'giftFx') effect.confirmation === 'confirmed' ? accepted++ : observed++;
    }
    director.frame(state, frame.audio!.epoch, frame.audio!.records, frame.actor);
  }
  assert.equal(accepted, 4);
  assert.equal(observed, 1);
  assert.equal(state!.confirmedGiftCount, 8);
  assert.deepEqual(starts.map(cue => cue.binding?.seatId), ['seat-1', 'seat-2', 'seat-3']);
  assert.deepEqual(sounds.map(cue => cue.binding?.seatId), ['seat-1', 'seat-2', 'seat-3']);
  assert.equal(director.suppressed.expired, 1);
  assert.deepEqual(driver.update(66_010).audio!.records, []);
  assert.equal(new SliceDriver('idle').update(1).audio, undefined);
});

test('accepted finals for the same request coalesce and a reused name cannot alter the seat binding', () => {
  const { director, starts, sounds } = harness();
  const { state, final, focus } = fixtures();
  director.enable(true);
  const one = final('a', 20, first);
  const two = final('a', 30, first);
  director.frame(state(50, 'GIFT_TRANSITION', 'a'), 0, [one, two, two], first);
  director.frame(state(1050, 'GIFT_FOCUS', 'a'), 0, [focus('a', 1050)], second);
  assert.equal(starts.length, 0);
  director.frame(state(1060, 'GIFT_FOCUS', 'a'), 0, [], first);
  director.frame(state(1110, 'GIFT_FOCUS', 'a'), 0, [final('a', 1100, first)], first);
  assert.equal(starts.length, 1);
  assert.equal(starts[0].count, 2);
  assert.equal(sounds.length, 1);
  assert.equal(director.suppressed.coalesced, 1);
  assert.equal(director.suppressed['already-played'], 1);
});

test('watermark, mute/resume and same-room reconnect do not replay', () => {
  const { director, starts, cuts } = harness();
  const { state, final, focus } = fixtures();
  director.enable(true, 'enable', 1000);
  director.frame(state(1100, 'GIFT_FOCUS', 'a'), 0, [final('a', 900, first), focus('a', 1000)], first);
  assert.equal(starts.length, 0);
  assert.equal(director.suppressed['before-enable'], 1);
  director.frame(state(1200, 'GIFT_FOCUS', 'a'), 0, [final('a', 1100, first)], first);
  assert.equal(starts.length, 1);
  director.enable(false, 'hidden');
  director.frame(state(1300, 'GIFT_FOCUS', 'a'), 0, [final('a', 1250, first)], first);
  director.enable(true, 'enable', 1300);
  director.frame(state(1400, 'CINEMATIC', undefined, first, false), 1, []);
  director.frame(state(1500, 'GIFT_FOCUS', 'a'), 2, [focus('a', 1490), final('a', 1495, first)], first);
  assert.equal(starts.length, 1);
  assert(cuts.includes('hidden'));
  assert(cuts.includes('session-change'));
});

test('late buffers never speak across expiry or a different room, and SFX does not repeat while waiting', () => {
  const { director, starts, sounds, wait, finish, deadlines } = harness();
  const { state, final, focus } = fixtures();
  director.enable(true);
  wait();
  const cue = final('a', 10, first);
  director.frame(state(1100, 'GIFT_FOCUS', 'a'), 0, [cue, focus('a', 1000)], first);
  director.frame(state(5000, 'GIFT_FOCUS', 'a'), 0, [], first);
  assert.equal(sounds.length, 1);
  assert(deadlines[1] < deadlines[0]);
  director.frame(state(5790, 'GIFT_FOCUS', 'a'), 0, [], first);
  finish();
  director.frame(state(5801, 'CINE_RETURN'), 0, []);
  director.frame(state(6000, 'GIFT_FOCUS', 'a', first, true, 'different-room'), 1, [cue], first);
  assert.equal(starts.length, 0);
});

test('no-seat confirmation retries preload only during idle, then gives nonspatial short thanks', () => {
  const { director, starts, sounds, wait, finish } = harness();
  const { state, final } = fixtures();
  director.enable(true);
  wait();
  director.frame(state(1020, 'CINE_RETURN'), 0, [final('d', 990)]);
  director.frame(state(1030), 0, []);
  finish();
  director.frame(state(1060), 0, []);
  assert.deepEqual(starts.map(cue => [cue.request, cue.binding]), [['d', undefined]]);
  assert.equal(sounds.length, 0);
});

test('pending and dedup limits fail closed and unknown gift uses neutral audio', () => {
  const { director, starts } = harness();
  const { state, final } = fixtures();
  assert.equal(giftSound('unsupported-gift'), 'generic');
  director.enable(true);
  const records = Array.from({ length: 300 }, (_, i) => final('request-' + i, 20));
  director.frame(state(40, 'CINE_RETURN'), 0, records);
  assert.equal(director.queued, maxPending);
  assert.equal(director.suppressed['ledger-capacity'], 44);
  director.frame(state(3000), 0, []);
  director.frame(state(3010), 0, [final('request-0', 3010)]);
  assert.equal(starts.length, 0);
});

test('LIVE rolls past 256 unique requests and rejects old and recent replays with new cue sequences', () => {
  const { director, starts } = harness(true);
  const { state, final } = fixtures();
  director.enable(true);
  for (let i = 1; i <= 320; i++) {
    director.frame(state(i * 3000), 0, [final('demo-room-gift-' + i, i * 3000)]);
  }
  assert.equal(starts.length, 320);
  director.frame(state(970_000), 0, [final('demo-room-gift-1', 970_000), final('demo-room-gift-319', 970_000)]);
  assert.equal(starts.length, 320);
  assert.equal(director.suppressed['already-played'], 2);
});

test('an accepted LIVE gift never exposes a DEMO name identity to the voice path', () => {
  const { director, starts } = harness(true);
  const { state, record, focus } = fixtures();
  director.enable(true);
  const id = 'demo-room-gift-1';
  director.frame(state(100, 'GIFT_TRANSITION', id), 0, [record({ type: 'giftFx', atMs: 99, requestId: id,
    displayName: 'An', actorId: first.actorId, giftId: '5678', confirmation: 'confirmed',
    giftCount: 1, anchor: 'giftFx', dedicatedFocus: true })], first);
  director.frame(state(1100, 'GIFT_FOCUS', id), 0, [focus(id, 1100)], first);
  assert.equal(starts.length, 1);
  assert.equal(starts[0].identity, undefined);
  assert.equal(starts[0].sound, 'generic');
});

test('R2 accepted final carries exact provenance and rename during the wait cancels the alias without replaying the chime', () => {
  const { director, starts, sounds, wait, finish } = harness(true);
  const { state, record, focus } = fixtures();
  director.enable(true);
  const id = 'demo-room-gift-1';
  const accepted = record({ type: 'giftFx', atMs: 99, requestId: id, displayName: 'An Lam', actorId: first.actorId,
    giftId: '5655', confirmation: 'confirmed', giftCount: 2, anchor: 'giftFx', dedicatedFocus: true });
  const receipt = { seq: 3, roomEpoch: 61, connection: 4 };
  accepted.liveGift = receipt;
  const scene = (at: number, mode: 'GIFT_TRANSITION' | 'GIFT_FOCUS', name: string) => {
    const frame = state(at, mode, id, first);
    const actor = frame.avatars.find(value => value.actorId === first.actorId)!;
    actor.displayName = name;
    return frame;
  };
  director.frame(scene(100, 'GIFT_TRANSITION', 'An Lam'), 0, [accepted], first);
  wait();
  director.frame(scene(1100, 'GIFT_FOCUS', 'An Lam'), 0, [focus(id, 1100)], first);
  assert.deepEqual(sounds[0].liveIdentity, { ...receipt, alias: 'An Lam', count: 2 });
  finish();
  director.frame(scene(1140, 'GIFT_FOCUS', 'An Mây'), 0, [], first);
  assert.equal(sounds.length, 1);
  assert.equal(starts.length, 1);
  assert.equal(starts[0].liveIdentity, undefined);
});
