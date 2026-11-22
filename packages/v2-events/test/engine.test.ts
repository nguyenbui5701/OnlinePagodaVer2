import assert from 'node:assert/strict';
import test from 'node:test';
import { DemoEngine, type Effect } from '../src/engine.ts';
import { demoScript, gift, session } from '../src/fixture.ts';

const fresh = (options: ConstructorParameters<typeof DemoEngine>[0] = {}) => {
  const engine = new DemoEngine(options);
  assert.equal(engine.ingest(session()).disposition, 'accepted');
  return engine;
};
const started = (effects: Effect[]) => effects.flatMap(effect =>
  effect.type === 'focusStarted' ? [effect.intent.actorId] : []);

test('seeded 45s idle then A → B → C with real actor / seat bindings and cinematic return', () => {
  assert.deepEqual(demoScript(16), demoScript(16));
  const engine = fresh();
  assert.deepEqual(engine.advance(45000), []);
  assert.equal(engine.snapshot().camera.mode, 'CINEMATIC');
  assert.equal(engine.snapshot().camera.pendingGivers, 0);
  const script = demoScript();
  for (const event of script.slice(1, 6)) engine.ingest(event);
  assert.equal(engine.snapshot().confirmedGiftCount, 0);
  assert.equal(engine.snapshot().focus?.confirmation, 'observed');
  const final = script[6];
  engine.ingest(final);
  assert.equal(engine.ingest(final).disposition, 'duplicate');
  assert.equal(engine.ingest(gift('A', 46301, { streakId: 'combo-a', count: 5 })).disposition, 'duplicate');
  assert.equal(engine.snapshot().confirmedGiftCount, 5);

  const effects = script.slice(7).flatMap(event => engine.ingest(event).effects);
  assert.equal(engine.snapshot().camera.mode, 'GIFT_FOCUS');
  assert.equal(engine.snapshot().camera.pendingGivers, 2);
  const avatars = engine.snapshot().avatars;
  assert.deepEqual(avatars.map(({ displayName, seatId }) => [displayName, seatId]),
    [['A', 'seat-1'], ['B', 'seat-2'], ['C', 'seat-3']]);
  effects.push(...engine.advance(63100));
  assert.deepEqual(started(effects), avatars.map(actor => actor.actorId));
  assert.deepEqual(effects.flatMap(effect => effect.type === 'focusStarted' ? [effect.atMs] : []),
    [46900, 52600, 58300]);
  assert.equal(engine.snapshot().confirmedGiftCount, 7);
  assert.equal(engine.snapshot().camera.mode, 'CINE_RETURN');
  engine.advance(64300);
  assert.equal(engine.snapshot().camera.mode, 'CINEMATIC');
  assert.equal(engine.snapshot().focus, undefined);
});

test('one FIFO slot per giver, one capped active extension and a shared pending request ID', () => {
  const engine = fresh({ transitionMs: 10, focusHoldMs: 40, focusMaxMs: 60, returnMs: 15 });
  engine.ingest(gift('A', 1));
  const [first] = engine.advance(11);
  assert.equal(first.type, 'focusStarted');
  const firstB = engine.ingest(gift('B', 12, { streakId: 'combo', phase: 'progress' })).effects[0];
  const finalB = engine.ingest(gift('B', 13, { streakId: 'combo', count: 3 })).effects[0];
  assert.ok(firstB.type === 'giftFx' && finalB.type === 'giftFx');
  assert.equal(firstB.requestId, finalB.requestId);
  for (let atMs = 14; atMs <= 25; atMs++) engine.ingest(gift('A', atMs));
  assert.equal(engine.snapshot().camera.pendingGivers, 1);
  assert.equal(engine.snapshot().confirmedGiftCount, 16);
  const events = engine.advance(81);
  assert.deepEqual(events.map(e => [e.type, e.atMs]), [['focusEnded', 71], ['focusStarted', 81]]);
  assert.equal(engine.snapshot().focus?.requestId, finalB.requestId);
});

test('reconnect preserves identity, duplicate ledgers and revision; room change cancels old intents', () => {
  const engine = fresh();
  const original = gift('A', 1);
  engine.ingest(original);
  const before = engine.snapshot();
  engine.ingest(session('disconnect', 2));
  assert.equal(engine.ingest(gift('B', 3)).disposition, 'stale');
  engine.ingest(session('reconnect', 4, 1, 2));
  assert.equal(engine.ingest({ ...original, connection: 2, atMs: 5 }).disposition, 'duplicate');
  assert.equal(engine.ingest(gift('A', 5)).disposition, 'stale');
  engine.ingest(gift('A', 5, { connection: 2 }));
  const live = engine.snapshot();
  assert.equal(live.avatars[0].actorId, before.avatars[0].actorId);
  assert.equal(live.avatars[0].seatId, before.avatars[0].seatId);
  assert.deepEqual(engine.snapshotSince(before.revision), live);
  assert.equal(engine.snapshotSince(live.revision), undefined);
  assert.deepEqual(engine.ingest(session('open', 6, 2)).effects.map(e => e.type), ['focusSkipped']);
  assert.equal(engine.ingest(gift('A', 7, { connection: 2 })).disposition, 'stale');
  engine.ingest(gift('A', 7, { roomEpoch: 2, eventId: original.eventId }));
  assert.notEqual(engine.snapshot().avatars[0].actorId, live.avatars[0].actorId);
  assert.equal(engine.snapshot().confirmedGiftCount, 1);
});

test('bounded focus and no-seat outcomes acknowledge the correct giver; TTL releases seat', () => {
  const engine = fresh({ maxAvatars: 3, maxPendingGifters: 1, avatarTTLms: 100,
    transitionMs: 10, focusHoldMs: 30, focusMaxMs: 40 });
  engine.ingest(gift('A', 1));
  engine.ingest(gift('B', 2));
  for (const [who, reason] of [['C', 'queue-full'], ['D', 'no-seat']]) {
    const effects = engine.ingest(gift(who, 3, { count: 2 })).effects;
    assert.ok(effects.some(e => e.type === 'focusSkipped' && e.reason === reason));
    assert.ok(effects.some(e => e.type === 'giftFx' && e.anchor === 'overlay' &&
      !e.dedicatedFocus && e.displayName === who && e.giftCount === 2));
  }
  const before = engine.snapshot();
  assert.equal(before.confirmedGiftCount, 6);
  assert.deepEqual(started(engine.advance(76)), before.avatars.slice(0, 2).map(avatar => avatar.actorId));
  engine.advance(500);
  assert.deepEqual(engine.snapshot().avatars, []);
  engine.ingest(gift('A', 500));
  assert.equal(engine.snapshot().avatars[0].seatId, 'seat-1');
  assert.notEqual(engine.snapshot().avatars[0].actorId, before.avatars[0].actorId);
});

test('120 viewers, 500 likes and room viewer total keep capacity and FX bounded', () => {
  const engine = fresh({ maxAvatars: 9 });
  const scope = { roomEpoch: 1, connection: 1, atMs: 1 };
  for (let i = 0; i < 120; i++) {
    engine.ingest({ ...scope, type: 'chat', eventId: `chat-${i}`, viewer: { userKey: `user-${i}`, name: 'Khách' } });
  }
  let ripples = 0;
  for (let i = 0; i < 500; i++) ripples += engine.ingest({
    ...scope, type: 'like', eventId: `like-${i}`, count: 500,
  }).effects.length;
  engine.ingest({ ...scope, type: 'room', eventId: 'count', count: 9500 });
  assert.equal(ripples, 1);
  assert.equal(engine.snapshot().viewerCount, 9500);
  assert.equal(engine.snapshot().avatars.length, 9);
  assert.equal(new Set(engine.snapshot().avatars.map(a => a.seatId)).size, 9);
  assert.equal(engine.snapshot().camera.mode, 'CINEMATIC');
});

test('session ledger stays bounded and preserves idempotency at the limit', () => {
  const engine = fresh({ maxSessionKeys: 1 });
  const first = gift('A', 1);
  engine.ingest(first);
  assert.equal(engine.ingest(gift('B', 1)).disposition, 'session-limit');
  assert.equal(engine.ingest(first).disposition, 'duplicate');
  assert.equal(engine.snapshot().confirmedGiftCount, 1);
  for (let roomEpoch = 2; roomEpoch <= 120; roomEpoch++) {
    assert.equal(engine.ingest(session('open', roomEpoch, roomEpoch)).disposition, 'accepted');
    assert.equal(engine.ingest({ ...first, roomEpoch, atMs: roomEpoch }).disposition, 'accepted');
    assert.equal(engine.snapshot().confirmedGiftCount, 1);
    assert.equal(engine.snapshot().avatars.length, 1);
  }
});

test('safe display text, graphemes, photo validation and private packet IDs', () => {
  const engine = fresh();
  const viewer = { userKey: 'private-user', name: '  Tiếng Việt <img>\u202e ', avatarUrl: 'javascript:alert(1)' };
  const member = { type: 'member', atMs: 1, roomEpoch: 1, connection: 1, eventId: 'member', viewer };
  engine.ingest(member);
  assert.deepEqual(engine.snapshot().avatars, []);
  const result = engine.ingest(gift('A', 2, { viewer, eventId: 'private-event' }));
  assert.equal(engine.snapshot().avatars[0].displayName, 'Tiếng Việt img');
  assert.equal(engine.snapshot().avatars[0].avatarUrl, undefined);
  const family = '👩‍👩‍👧‍👦';
  engine.ingest(gift('A', 3, { viewer: { ...viewer, name: family.repeat(40),
    avatarUrl: 'https://example.invalid/avatar' } }));
  const { displayName, avatarUrl } = engine.snapshot().avatars[0];
  assert.equal(displayName, family.repeat(28));
  assert.equal(avatarUrl, 'https://example.invalid/avatar');
  assert.doesNotMatch(JSON.stringify({ result, snapshot: engine.snapshot() }), /private-user|private-event/);
  assert.equal(engine.ingest(gift('A', 4, { viewer: { ...viewer, userKey: '' } })).disposition, 'invalid');
  assert.equal(engine.ingest(gift('A', 4, { phase: 'progress' })).disposition, 'invalid');
  assert.equal(engine.ingest(null).disposition, 'invalid');
});

test('expired provisional focus adds zero spend; late final acknowledges without replaying the shot', () => {
  const engine = fresh({ transitionMs: 10, requestTTLms: 50, focusHoldMs: 30, focusMaxMs: 30 });
  engine.ingest(gift('A', 1, { phase: 'progress', streakId: 'streak-a' }));
  assert.equal(started(engine.advance(100)).length, 1);
  assert.equal(engine.snapshot().confirmedGiftCount, 0);
  const result = engine.ingest(gift('A', 100, { streakId: 'streak-a', count: 8 }));
  assert.equal(engine.snapshot().confirmedGiftCount, 8);
  assert.equal(engine.snapshot().focus, undefined);
  assert.ok(result.effects.some(e => e.type === 'giftFx' && e.anchor === 'overlay' && e.giftCount === 8));
});
