import assert from 'node:assert/strict';
import test from 'node:test';
import { Group, Vector3 } from 'three';
import { faceActorTowardTree, seatPose } from '../src/seat-scene.ts';

test('turn all three actor pivots through their pad parents without moving pad or contact', () => {
  const tree = new Vector3(1.1, 0, -0.7);
  const positions = [[2, 0.065, 13.5], [-1.4, 0.065, 12.35], [4.8, 0.065, 11.15]];
  const padYaw = [0.14, -0.19, 0.32];
  for (const [index, position] of positions.entries()) {
    const parent = new Group();
    parent.rotation.y = 0.17;
    const pad = new Group();
    pad.position.fromArray(position);
    pad.rotation.y = padYaw[index];
    parent.add(pad);
    const padAnchor = new Group();
    padAnchor.position.y = 0.195;
    pad.add(padAnchor);
    const actor = new Group();
    const seatRoot = new Group();
    const head = new Group();
    head.position.set(0, 1.4, 0);
    padAnchor.add(actor);
    actor.add(seatRoot);
    seatRoot.add(head);
    parent.updateMatrixWorld(true);
    const padBefore = pad.matrixWorld.clone();
    const anchorBefore = padAnchor.getWorldPosition(new Vector3());
    const facing = faceActorTowardTree(actor, seatRoot, tree);
    assert.ok(Math.abs(facing.beforeErrorDeg) > 150);
    assert.ok(Math.abs(facing.afterErrorDeg) < 1e-9);
    assert.ok(seatRoot.getWorldPosition(new Vector3()).distanceTo(anchorBefore) < 1e-9);
    assert.deepEqual(pad.matrixWorld, padBefore);
    const gift = seatPose({ seatRoot, head }, 0.30);
    const direction = gift.position.clone().sub(anchorBefore).setY(0);
    assert.ok(direction.angleTo(new Vector3().fromArray(facing.after)) <= 0.31);
    assert.equal(gift.fov, 50);
  }
});

test('coincident X/Z leaves existing facing unchanged', () => {
  const actor = new Group();
  actor.rotation.y = 0.2;
  const pivot = new Group();
  actor.add(pivot);
  const before = actor.quaternion.clone();
  const facing = faceActorTowardTree(actor, pivot, new Vector3(0, 13, 0));
  assert.deepEqual(facing.desired, [0, 0, 0]);
  assert.ok(actor.quaternion.equals(before));
});
