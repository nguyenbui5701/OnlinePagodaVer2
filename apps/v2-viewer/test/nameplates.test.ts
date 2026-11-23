import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { DemoEngine, type DemoViewer } from '../../../packages/v2-events/src/engine.ts';
import { session } from '../../../packages/v2-events/src/fixture.ts';
import { loadApprovedAvatar, resolveAvatar } from '../src/avatar-badge.ts';
import { projectNameplate } from '../src/nameplates.ts';

const first = 'https://approved.example/a.png';
const second = 'https://approved.example/b.png';
const policy = new Map([['https://approved.example', new Set([first, second])]]);
const viewer = (userKey: string, name = 'Hà', avatarUrl = first): DemoViewer => ({ userKey, name, avatarUrl });
const member = (atMs: number, viewer: DemoViewer, roomEpoch = 1, connection = 1) =>
  ({ type: 'member', atMs, eventId: String(atMs), viewer, roomEpoch, connection });

test('avatar binding holds for equal display names, profile updates, reconnect, TTL and reused seats', () => {
  const engine = new DemoEngine({ spawnOnMember: true, avatarTTLms: 3000 });
  engine.ingest(session());
  engine.ingest(member(100, viewer('alpha')));
  engine.ingest(member(200, viewer('beta', 'Hà', second)));
  const initial = engine.snapshot();
  const [a, b] = initial.avatars;
  const boundA = { roomSessionId: initial.roomSessionId, actorId: a.actorId, seatId: a.seatId };
  const boundB = { roomSessionId: initial.roomSessionId, actorId: b.actorId, seatId: b.seatId };
  assert.equal(a.displayName, b.displayName);
  assert.equal(resolveAvatar(initial, boundA)?.photo, undefined);
  assert.equal(resolveAvatar(initial, boundA, policy)?.photo, first);
  assert.equal(resolveAvatar(initial, boundB, policy)?.photo, second);
  assert.equal(resolveAvatar(initial, { ...boundB, seatId: a.seatId }, policy), undefined);
  engine.ingest(member(300, viewer('alpha', 'An', second)));
  assert.deepEqual(resolveAvatar(engine.snapshot(), boundA, policy), { name: 'An', initial: 'A', photo: second });
  engine.ingest(session('disconnect', 400));
  assert.equal(resolveAvatar(engine.snapshot(), boundA, policy), undefined);
  engine.ingest(session('reconnect', 500, 1, 2));
  assert.equal(resolveAvatar(engine.snapshot(), boundA, policy)?.photo, second);
  assert.equal(engine.ingest(member(550, viewer('alpha'), 1, 1)).disposition, 'stale');
  engine.advance(3500);
  engine.ingest(member(3600, viewer('gamma', 'An'), 1, 2));
  assert.equal(engine.snapshot().avatars[0].seatId, a.seatId);
  assert.notEqual(engine.snapshot().avatars[0].actorId, a.actorId);
  assert.equal(resolveAvatar(engine.snapshot(), boundA, policy), undefined);
  engine.ingest(session('open', 3700, 2, 1));
  assert.equal(resolveAvatar(engine.snapshot(), boundB, policy), undefined);
  assert.equal(engine.ingest(member(3800, viewer('beta'), 1, 2)).disposition, 'stale');
});

test('resolver refuses malformed, unapproved and only-origin-matching avatar URLs', () => {
  const engine = new DemoEngine({ spawnOnMember: true });
  engine.ingest(session());
  engine.ingest(member(1, viewer('alpha')));
  const state = engine.snapshot();
  const actor = state.avatars[0];
  const key = { roomSessionId: state.roomSessionId, actorId: actor.actorId, seatId: actor.seatId };
  for (const url of ['https://approved.example/other.png', first + '?secret=x', first + '#x', 'invalid',
    'http://approved.example/a.png', 'https://a:b@approved.example/a.png', 'https://127.0.0.1/a.png']) {
    actor.avatarUrl = url;
    assert.deepEqual(resolveAvatar(state, key, policy), { name: 'Hà', initial: 'H', photo: undefined });
  }
  assert.equal(resolveAvatar(state, key, new Map([['https://127.0.0.1', new Set([actor.avatarUrl!])]]))?.photo, undefined);
});

test('approved synthetic photo load enforces fetch isolation, caps, decode and fallback', async () => {
  const response = (body: Uint8Array, mime = 'image/png', url = first, redirected = false) => {
    const result = new Response(new Uint8Array(body), { headers: { 'content-type': mime } });
    Object.defineProperties(result, { url: { value: url }, redirected: { value: redirected } });
    return result;
  };
  const bytes = new Uint8Array([137, 80, 78, 71, 0, 0, 0, 0]);
  const signal = new AbortController().signal;
  const decode = (async () => ({ width: 32, height: 32, close() {} })) as typeof createImageBitmap;
  const fetcher: typeof fetch = async (_, init) => {
    assert.equal(init?.referrerPolicy, 'no-referrer');
    assert.equal(init?.credentials, 'omit');
    assert.equal(init?.redirect, 'error');
    assert.equal(init?.mode, 'cors');
    return response(bytes);
  };
  assert.equal((await loadApprovedAvatar(first, signal, fetcher, decode))?.type, 'image/png');
  for (const invalid of [
    response(bytes, 'image/svg+xml'),
    response(new Uint8Array(129 * 1024)),
    response(bytes, 'image/png', second, true),
    response(new Uint8Array([60, 115, 118, 103])),
  ]) assert.equal(await loadApprovedAvatar(first, signal, async () => invalid, decode), undefined);
  const failedDecode = async () => { throw new Error('image decode failed'); };
  assert.equal(await loadApprovedAvatar(first, signal, fetcher, failedDecode), undefined);
  const oversized = (async () => ({ width: 513, height: 32, close() {} })) as typeof createImageBitmap;
  assert.equal(await loadApprovedAvatar(first, signal, fetcher, oversized), undefined);
});

test('nameplate follows one head-relative projection during pan and zoom', () => {
  const camera = new PerspectiveCamera(45, 9 / 16, 0.1, 100);
  const head = new Vector3(2, 1.1, 0);
  const anchor = head.clone().add(new Vector3(0, .28, 0));
  const samples = [];
  for (let i = 0; i < 60; i++) {
    camera.position.set(1 + i * .025, 1.6, 4 - i * .02);
    camera.lookAt(1.7, 1, 0);
    camera.fov = 45 + i * .2;
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const points = projectNameplate(camera, head, anchor);
    assert.ok(points.anchor.y < points.head.y);
    assert.ok(Math.abs(points.head.x - points.anchor.x) < .02);
    if (samples.length) assert.ok(Math.abs(points.anchor.x - samples.at(-1)!) < .02);
    samples.push(points.anchor.x);
  }
  assert.notEqual(samples[0], samples.at(-1));
});
