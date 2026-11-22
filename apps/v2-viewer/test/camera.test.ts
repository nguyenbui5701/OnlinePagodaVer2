import assert from 'node:assert/strict';
import test from 'node:test';
import { Group, Vector3 } from 'three';
import { capture, loopSeconds, sampleCinematic, shots } from '../src/camera.ts';
import { attachSeat, mockSeat, resolveFocusTarget, type AvatarPresentation, type FocusIntent } from '../src/presentation.ts';

test('46s continuous shot sequence at 60Hz with bounded speed, camera aim and wrap', () => {
  const entered: string[] = [];
  let previous = sampleCinematic(0);
  entered.push(previous.shot);
  for (let frame = 1; frame <= 46 * 60; frame++) {
    const pose = sampleCinematic(frame / 60);
    if (pose.shot !== previous.shot) entered.push(pose.shot);
    const distance = pose.position.distanceTo(previous.position);
    assert.ok(distance > 0.01 && distance < 0.22, String(distance));
    assert.ok(pose.position.y > 0 && pose.position.distanceTo(pose.target) > 8);
    assert.ok(Math.abs(pose.fov - previous.fov) < 0.1);
    const before = previous.target.clone().sub(previous.position).normalize();
    assert.ok(before.angleTo(pose.target.clone().sub(pose.position).normalize()) < 0.04);
    previous = pose;
  }
  assert.deepEqual(entered.slice(0, 5), [...shots, 'CLOSE']);
  assert.deepEqual(sampleCinematic(2.5), sampleCinematic(loopSeconds + 2.5));
  assert.equal(capture.width / capture.height, 9 / 16);
});

test('resolve a measured actor anchor through its seat and transformed scene group', () => {
  const group = new Group();
  group.position.set(-1, 2, 5);
  const other = attachSeat(group, { ...mockSeat, seatId: 'seat-2', position: [15, 1, 5] });
  const target = attachSeat(group, mockSeat);
  const seats = new Map([[other.name, other], [target.name, target]]);
  const actor: AvatarPresentation = { actorId: 'actor-a', seatId: target.name, displayName: 'A',
    visible: true, appearanceVariant: 'meditator_base', revision: 1 };
  const intent: FocusIntent = {
    roomSessionId: 'demo-1', actorId: 'actor-a', requestId: 'req-1', giftId: 'rose', giftCount: 1,
    confirmation: 'confirmed', firstSeenAtMs: 0, expiresAtMs: 1000,
  };
  const head: [number, number, number] = [0.2, 0.9, 0.3];
  const anchors = new Map([[actor.actorId, head]]);
  const result = resolveFocusTarget(intent, 'demo-1', [actor], seats, anchors);
  const expected = new Vector3(...head).applyAxisAngle(new Vector3(0, 1, 0), mockSeat.rotationY)
    .add(target.position).add(group.position);
  assert.ok(result && result.distanceTo(expected) < 1e-10);
  assert.equal(resolveFocusTarget(intent, 'demo-2', [actor], seats, anchors), undefined);
  assert.equal(resolveFocusTarget(intent, 'demo-1', [{ ...actor, actorId: 'actor-b' }], seats, anchors), undefined);
  assert.equal(resolveFocusTarget(intent, 'demo-1', [actor], seats, new Map()), undefined);
});
