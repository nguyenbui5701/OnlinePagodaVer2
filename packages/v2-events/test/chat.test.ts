import assert from 'node:assert/strict';
import test from 'node:test';
import { DemoEngine } from '../src/engine.ts';
import { gift, session } from '../src/fixture.ts';
import { sanitizeChat } from '../src/registry.ts';

const viewer = { userKey: 'a', name: '<An>' };
const packet = (atMs: number, chatText?: unknown) => ({
  type: 'chat', eventId: `chat-${atMs}`, atMs, roomEpoch: 1, connection: 1, viewer, chatText,
});

test('chat bounds bytes and graphemes while preserving Vietnamese and joined emoji', () => {
  assert.equal(sanitizeChat(null), undefined);
  assert.equal(sanitizeChat('x'.repeat(1025)), undefined);
  assert.equal(sanitizeChat('界'.repeat(700)), undefined);
  assert.deepEqual(sanitizeChat(' <b> Cha\u0300o\u202E\n\t 👩‍👧 </b> '), { text: 'Chào 👩‍👧', graphemes: 6 });
  assert.equal(sanitizeChat('🇻🇳'.repeat(121))?.text, '🇻🇳'.repeat(120));
  assert.equal(sanitizeChat(' <img src=x> ')?.text, '');
});

test('legacy, invalid, duplicate, throttled and stale chat never emit a cue', () => {
  const engine = new DemoEngine();
  engine.ingest(session());
  assert.deepEqual(engine.ingest(packet(1)).effects, []);
  assert.equal(engine.ingest(packet(2, {})).disposition, 'invalid');
  const input = packet(3, '<p>Xin chào</p>');
  assert.deepEqual(engine.ingest(input).effects, [{
    type: 'chatCue', atMs: 3, eventId: 'chat-3', roomSessionId: 'demo-1',
    actorId: 'demo-1-actor-1', seatId: 'seat-1', displayName: 'An', sanitizedText: 'Xin chào', graphemes: 8,
  }]);
  assert.equal(engine.ingest(input).disposition, 'duplicate');
  assert.equal(engine.ingest(packet(2, 'Late')).disposition, 'stale');
  assert.deepEqual(engine.ingest(packet(1000, 'Spam')).effects, []);
  engine.ingest(session('disconnect', 1100));
  assert.equal(engine.ingest(packet(1200, 'Offline')).disposition, 'stale');
  engine.ingest(session('reconnect', 1300, 1, 2));
  assert.equal(engine.ingest({ ...input, connection: 2, atMs: 1400 }).disposition, 'duplicate');
});

test('capacity chat carries no other seat and does not alter gifts, focus or viewer count', () => {
  const engine = new DemoEngine({ maxAvatars: 3 });
  engine.ingest(session());
  for (const [i, who] of ['B', 'C', 'D'].entries()) engine.ingest(gift(who, i + 1));
  const before = engine.snapshot();
  const cue = engine.ingest(packet(4, 'Overflow')).effects.find(effect => effect.type === 'chatCue');
  assert.ok(cue);
  assert.equal(cue.actorId, undefined);
  assert.equal(cue.seatId, undefined);
  assert.deepEqual(engine.snapshot().camera, before.camera);
  assert.equal(engine.snapshot().confirmedGiftCount, before.confirmedGiftCount);
  assert.equal(engine.snapshot().viewerCount, before.viewerCount);
  assert.equal(engine.snapshot().avatars.length, 3);
});
