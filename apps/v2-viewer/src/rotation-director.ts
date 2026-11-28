import { Quaternion, Vector3 } from 'three';
import type { CameraPose } from './camera.ts';
import type { CameraClearance } from './camera-clearance.ts';
import { timing } from './slice-driver.ts';

const ease = (t: number) => t * t * t * (10 + t * (-15 + 6 * t));
const resumeMs = 600;

export function planCameraBridge(from: Vector3, to: Vector3, clearance: CameraClearance) {
  if (!clearance.lineIssue(from, to)) return [from, to];
  if (clearance.lineIssue(from, from) || clearance.lineIssue(to, to)) return;
  // Prefer the shortest tested overhead corridor. Each leg is swept with the
  // same clearance as the route and ends at zero velocity at the waypoints.
  for (const elevation of [5, 9, 15, 30]) {
    const height = Math.max(from.y, to.y, elevation);
    const path = [from, new Vector3(from.x, height, from.z), new Vector3(to.x, height, to.z), to]
      .filter((point, i, all) => i === 0 || !point.equals(all[i - 1]));
    if (path.slice(1).every((point, i) => !clearance.lineIssue(path[i], point))) return path;
  }
  // A low eye may have overhead foliage. Search two offset exits at the
  // existing height before trying the high corridor.
  for (const offset of [4, -4, 8, -8]) {
    for (const end of ['both', 'from', 'to'] as const) {
      const exit = end === 'to' ? from : new Vector3(from.x + offset, from.y, from.z + 4);
      const enter = end === 'from' ? to : new Vector3(to.x + offset, to.y, to.z + 4);
      const height = Math.max(exit.y, enter.y, 7);
      const path = [from, exit, new Vector3(exit.x, height, exit.z), new Vector3(enter.x, height, enter.z), enter, to]
        .filter((point, i, all) => i === 0 || !point.equals(all[i - 1]));
      if (path.slice(1).every((point, i) => !clearance.lineIssue(path[i], point))) return path;
    }
  }
}

type Focus = { requestId: string; pose: CameraPose };
type Bridge = { from: CameraPose; to: CameraPose; positions: Vector3[]; lengths: number[];
  length: number; age: number; duration: number };

function sampleBridge(bridge: Bridge) {
  const fraction = Math.min(1, bridge.age / bridge.duration);
  const aim = ease(fraction);
  const points = bridge.positions;
  const { lengths } = bridge;
  const traveled = fraction * bridge.length;
  let segment = 0, distance = traveled;
  while (segment < lengths.length - 1 && distance > lengths[segment]) distance -= lengths[segment++];
  const weight = lengths[segment] > 0 ? ease(Math.min(1, distance / lengths[segment])) : aim;
  const position = points[segment].clone().lerp(points[segment + 1], weight);
  const fromDirection = bridge.from.target.clone().sub(bridge.from.position);
  const toDirection = bridge.to.target.clone().sub(bridge.to.position);
  const distanceToTarget = fromDirection.length() * (1 - aim) + toDirection.length() * aim;
  fromDirection.normalize();
  const rotate = new Quaternion().setFromUnitVectors(fromDirection, toDirection.normalize());
  const direction = fromDirection.applyQuaternion(new Quaternion().slerp(rotate, aim));
  return { position, target: position.clone().addScaledVector(direction, distanceToTarget),
    fov: bridge.from.fov + (bridge.to.fov - bridge.from.fov) * aim };
}

/** Camera-only clock. It never consumes an event or advances a gift deadline. */
export class RotationDirector {
  phase = 0;
  reachedFocus = false;
  blocked = false;
  private previousAt?: number;
  private previous?: CameraPose;
  private request?: string;
  private bridge?: Bridge;
  private rampAt = resumeMs;

  private readonly sample: (seconds: number) => CameraPose;
  private readonly clearance: CameraClearance;

  constructor(sample: (seconds: number) => CameraPose, clearance: CameraClearance) {
    this.sample = sample;
    this.clearance = clearance;
  }

  pause() { this.previousAt = undefined; }

  step(atMs: number, visible: boolean, focus?: Focus) {
    const gap = this.previousAt === undefined ? 0 : Math.max(0, atMs - this.previousAt);
    this.previousAt = visible ? atMs : undefined;
    const delta = visible && gap <= 250 ? gap : 0;
    const initial = this.previous ??= this.sample(this.phase);
    if (!visible) return initial;
    const request = focus?.requestId;
    if (this.request !== request) {
      this.request = request;
      const to = focus?.pose ?? this.sample(this.phase);
      const positions = planCameraBridge(initial.position, to.position, this.clearance);
      this.blocked = !positions;
      this.reachedFocus = false;
      const lengths = positions?.slice(1).map((point, i) => point.distanceTo(positions[i]));
      this.bridge = positions && lengths && { from: initial, to, positions, lengths,
        length: lengths.reduce((sum, length) => sum + length, 0), age: 0,
        duration: focus ? timing.transitionMs : timing.returnMs };
      this.rampAt = 0;
      return initial;
    }
    if (this.blocked) return initial;
    if (this.bridge) {
      this.bridge.age += delta;
      this.previous = sampleBridge(this.bridge);
      if (this.bridge.age >= this.bridge.duration) {
        this.reachedFocus = !!focus;
        this.bridge = undefined;
      }
      return this.previous;
    }
    if (focus) return initial;
    // Ramp the route velocity from rest after a stationary-target return.
    const integral = (ms: number) => ms < resumeMs ? ms * ms / (2 * resumeMs) : ms - resumeMs / 2;
    this.phase += (integral(this.rampAt + delta) - integral(this.rampAt)) / 1000;
    this.rampAt = Math.min(resumeMs, this.rampAt + delta);
    return this.previous = this.sample(this.phase);
  }
}
