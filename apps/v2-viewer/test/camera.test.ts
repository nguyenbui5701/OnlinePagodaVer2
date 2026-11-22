import assert from 'node:assert/strict';
import test from 'node:test';
import { capture, loopSeconds, sampleCinematic, shots } from '../src/camera.ts';

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
