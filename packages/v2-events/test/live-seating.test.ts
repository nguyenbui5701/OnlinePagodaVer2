import assert from 'node:assert/strict';
import test from 'node:test';
import { DemoEngine } from '../src/engine.ts';
import { presenceDefaults, waitCapacity } from '../src/presence.ts';

const room = { roomEpoch: 41, connection: 1 };
const viewer = (key: string, name = key) => ({ userKey: key, name });
function join(engine: DemoEngine, key: string, atMs: number, type = 'member', name = key, eventId = key + '-' + atMs) {
  return engine.ingest({ ...room, eventId, atMs, type, viewer: viewer(key, name),
    ...(type === 'chat' ? { chatText: 'Chúc bình an' } : {}) });
}
function setup(seating = true) {
  const engine = new DemoEngine({ maxAvatars: 3 }, seating);
  engine.ingest({ ...room, type: 'session', action: 'open', atMs: 0 });
  return engine;
}
const names = (engine: DemoEngine) => engine.snapshot().avatars.map(a => a.displayName);
function gift(engine: DemoEngine, key: string, atMs: number, streakId: string, phase = 'final', count = 2) {
  return engine.ingest({ ...room, eventId: streakId + '-' + phase, atMs, type: 'gift', giftId: '5655',
    streakId, phase, count, viewer: viewer(key) });
}

test('LIVE member and text chat admit immediately; duplicates, empty chat and aggregate counts cannot create actors', () => {
  const engine = setup();
  join(engine, 'viewer-a', 100, 'member', 'An Mây', 'member-a');
  const actor = engine.snapshot().avatars[0];
  assert.equal(actor.seatId, 'seat-1');
  assert.equal(join(engine, 'viewer-a', 110, 'member', 'Sai tên', 'member-a').disposition, 'duplicate');
  assert.deepEqual(names(engine), ['An Mây']);
  join(engine, 'viewer-a', 115, 'member', 'An Lam');
  assert.equal(engine.snapshot().avatars[0].actorId, actor.actorId);
  assert.deepEqual(names(engine), ['An Lam']);
  const chat = join(engine, 'viewer-b', 130, 'chat', 'Bình Mây').effects.find(effect => effect.type === 'chatCue');
  assert.equal(chat?.seatId, 'seat-2');
  assert.equal(chat?.actorId, engine.snapshot().avatars[1].actorId);
  engine.ingest({ ...room, type: 'room', atMs: 140, eventId: 'count', count: 100 });
  engine.ingest({ ...room, type: 'like', atMs: 150, eventId: 'likes', count: 50 });
  engine.ingest({ ...room, type: 'chat', atMs: 160, eventId: 'blank', viewer: viewer('empty'), chatText: '  ' });
  assert.deepEqual(engine.presenceCounts, { occupied: 2, waiting: 0, dropped: 0 });
  assert.equal(engine.snapshot().viewerCount, 100);
  const legacy = setup(false);
  join(legacy, 'legacy-a', 10);
  join(legacy, 'legacy-b', 11, 'chat');
  assert.deepEqual(names(legacy), []);
});

test('HOT expiry uses prior activity; toggles leave seated actors and gift admission independent', () => {
  const engine = setup();
  join(engine, 'a', 1000);
  join(engine, 'b', 2000);
  engine.configurePresence({ ...presenceDefaults, autoJoinMember: false, autoJoinChat: false, seatExpiryEnabled: false, idleSeconds: 6 });
  join(engine, 'c', 3000);
  join(engine, 'd', 4000, 'chat');
  join(engine, 'b', 7000, 'member', 'B mới');
  engine.advance(10_000);
  assert.deepEqual(names(engine), ['a', 'B mới']);
  engine.configurePresence({ ...presenceDefaults, autoJoinMember: false, autoJoinChat: false, idleSeconds: 6 });
  engine.advance(10_000);
  assert.deepEqual(names(engine), ['B mới']);
  const funded = gift(engine, 'd', 10_001, 'paid');
  assert.equal(funded.effects.find(e => e.type === 'giftFx')?.dedicatedFocus, true);
  assert.deepEqual(names(engine), ['B mới', 'd']);
});

test('waiting FIFO is bounded, source-aware, deduplicated, expires independently and never replays chat', () => {
  const engine = setup();
  engine.configurePresence({ ...presenceDefaults, seatExpiryEnabled: false });
  for (const key of ['a','b','c']) join(engine, key, 10);
  join(engine, 'only-member', 1000);
  join(engine, 'first', 2000, 'chat');
  join(engine, 'second', 3000, 'chat');
  join(engine, 'first', 5000, 'member', 'Tên mới');
  for (let i = 0; i < waitCapacity - 2; i++) join(engine, 'other-' + i, 5010);
  assert.deepEqual(engine.presenceCounts, { occupied: 3, waiting: 64, dropped: 1 });
  engine.configurePresence({ ...presenceDefaults, autoJoinMember: false, seatExpiryEnabled: false });
  engine.advance(5010);
  assert.deepEqual(engine.presenceCounts, { occupied: 3, waiting: 2, dropped: 1 });
  engine.configurePresence({ ...presenceDefaults, autoJoinMember: false, idleSeconds: 6 });
  assert.deepEqual(engine.advance(6010), []);
  assert.deepEqual(names(engine), ['Tên mới', 'second']);
  assert.equal(engine.snapshot().avatars[0].seatId, 'seat-1');
  engine.configurePresence({ ...presenceDefaults, seatExpiryEnabled: false });
  join(engine, 'again', 7000);
  join(engine, 'expires', 8000);
  engine.advance(68_000);
  assert.equal(engine.presenceCounts?.waiting, 0);
  assert.deepEqual(names(engine), ['Tên mới', 'second', 'again']);
});

test('confirmed streak seats the donor after unseated progress, protects active/pending and counts fallback once', () => {
  const engine = setup();
  engine.configurePresence({ ...presenceDefaults, seatExpiryEnabled: false });
  for (const [i, key] of ['a','b','c'].entries()) join(engine, key, i + 1);
  const before = engine.snapshot().avatars;
  gift(engine, 'a', 11, 'a-first', 'progress');
  gift(engine, 'b', 12, 'b-first', 'progress');
  const provisional = gift(engine, 'd', 13, 'd-after-progress', 'progress');
  assert.equal(provisional.effects.find(e => e.type === 'giftFx')?.anchor, 'overlay');
  assert.deepEqual(names(engine), ['a', 'b', 'c']);
  const final = gift(engine, 'd', 14, 'd-after-progress', 'final', 3);
  const fx = final.effects.find(e => e.type === 'giftFx');
  assert.equal(fx?.dedicatedFocus, true);
  const seated = engine.snapshot().avatars;
  assert.deepEqual(seated.slice(0, 2).map(a => a.actorId), before.slice(0, 2).map(a => a.actorId));
  assert.equal(seated[2].seatId, before[2].seatId);
  assert.notEqual(seated[2].actorId, before[2].actorId);
  assert.equal(seated[2].actorId, fx?.actorId);
  assert.equal(gift(engine, 'd', 15, 'd-after-progress').disposition, 'duplicate');
  gift(engine, 'a', 16, 'a-first');
  gift(engine, 'b', 17, 'b-first');
  const fallback = gift(engine, 'e', 18, 'no-seat');
  assert.equal(fallback.effects.find(e => e.type === 'giftFx')?.anchor, 'overlay');
  assert.deepEqual(names(engine), ['a', 'b', 'd']);
  assert.equal(engine.snapshot().confirmedGiftCount, 9);
  const focus = engine.advance(25_000).flatMap(e => e.type === 'focusStarted' ? [e.intent.actorId] : []);
  assert.deepEqual(focus, seated.map(a => a.actorId));
});

test('final displaces the least recently active passive viewer, but an earlier donor stays after cinematic return', () => {
  const engine = setup();
  engine.configurePresence({ ...presenceDefaults, seatExpiryEnabled: false });
  gift(engine, 'donor', 1, 'first');
  join(engine, 'recent', 2);
  join(engine, 'old', 3);
  join(engine, 'recent', 10);
  engine.advance(8000);
  gift(engine, 'new', 8001, 'second');
  assert.deepEqual(names(engine), ['donor', 'recent', 'new']);
  assert.equal(engine.presenceCounts?.waiting, 0);
});

test('disconnect clears waiting and reconnect keeps existing seat bindings; room change clears both', () => {
  const engine = setup();
  for (const key of ['a','b','c','wait']) join(engine, key, 1);
  const before = engine.snapshot().avatars;
  assert.equal(engine.presenceCounts?.waiting, 1);
  engine.ingest({ ...room, type: 'session', action: 'disconnect', atMs: 100 });
  assert.equal(engine.presenceCounts?.waiting, 0);
  engine.ingest({ ...room, connection: 2, type: 'session', action: 'reconnect', atMs: 200 });
  assert.deepEqual(engine.snapshot().avatars, before);
  engine.ingest({ ...room, roomEpoch: 42, type: 'session', action: 'open', atMs: 300 });
  assert.deepEqual(engine.presenceCounts, { occupied: 0, waiting: 0, dropped: 0 });
});
