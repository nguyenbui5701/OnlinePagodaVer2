import { Quaternion, Vector3 } from 'three';
import type { CameraPose } from './camera.ts';
import type { CameraClearance } from './camera-clearance.ts';

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

type Focus = { requestId: string; pose: CameraPose; canSee?: (eye: Vector3) => boolean };
type Motion = { duration: number; sample: (age: number) => CameraPose };
type Bridge = Motion & { distance: number };
type Return = { bridge: Bridge; phase: number };

const brakeMs = 400;
const focusBudgetMs = 2200;
const returnBudgetMs = 16_000;
// Quintic peak speed/acceleration are 1.875 and 5.774 times the
// distance over duration and duration squared respectively.
export const giftBridgeLimits = { speed: 12, bridgeAcceleration: 22, accelerationWithBrake: 53,
  aim: 1.25, fovSpeed: 60, focusBudgetMs, returnBudgetMs } as const;

function buildBridge(from: CameraPose, to: CameraPose, points: Vector3[]): Bridge {
  const legs = points.slice(1).map((point, i) => {
    const distance = point.distanceTo(points[i]);
    const seconds = Math.max(1.875 * distance / giftBridgeLimits.speed,
      Math.sqrt(5.774 * distance / giftBridgeLimits.bridgeAcceleration));
    return { from: points[i], to: point, distance, ms: seconds * 1000 };
  }).filter(leg => leg.ms > 0);
  const travel = legs.reduce((sum, leg) => sum + leg.ms, 0);
  const a = from.target.clone().sub(from.position);
  const b = to.target.clone().sub(to.position);
  const lengthA = a.length(), lengthB = b.length();
  a.normalize(); b.normalize();
  const angle = a.angleTo(b);
  const rotate = new Quaternion().setFromUnitVectors(a,b);
  const duration = Math.max(250, travel, 1875 * angle / giftBridgeLimits.aim,
    1875 * Math.abs(to.fov - from.fov) / giftBridgeLimits.fovSpeed);
  return {
    duration, distance: legs.reduce((sum,leg) => sum+leg.distance,0),
    sample(age) {
      if (age >= duration) return to;
      let progress = age * travel / duration;
      let position = from.position.clone();
      for (const leg of legs) {
        position = leg.from.clone().lerp(leg.to, ease(Math.min(1, progress / leg.ms)));
        if (progress <= leg.ms) break;
        progress -= leg.ms;
      }
      const weight = ease(age / duration);
      const direction = a.clone().applyQuaternion(new Quaternion().slerp(rotate, weight));
      return { position, target: position.clone().addScaledVector(direction, lengthA + (lengthB-lengthA)*weight),
        fov: from.fov + (to.fov-from.fov)*weight };
    },
  };
}

function focusBridge(from: CameraPose, focus: Focus, clearance: CameraClearance) {
  const to = focus.pose;
  const path = planCameraBridge(from.position, to.position, clearance);
  if (path && (focus.canSee?.(to.position) ?? true)) {
    const full = buildBridge(from,to,path);
    if (full.duration <= focusBudgetMs) return { bridge: full, framing: 'travel' as const };
  }
  // Far shots cannot cover tens of units while leaving time for the
  // existing focus/voice window. Frame the same actor optically from a
  // checked eye, keeping the camera outside the geometry.
  const views = [from.position, ...(path?.slice(1).map((point,i)=> {
    const previous = path[i];
    const length = point.distanceTo(previous);
    return previous.clone().lerp(point, Math.min(1, 4 / Math.max(length, .01)));
  }) ?? [])];
  for (const eye of views) {
    if (clearance.lineIssue(from.position,eye) || !(focus.canSee?.(eye) ?? true)) continue;
    const distance = eye.distanceTo(to.target);
    if (distance < 2.3) continue;
    const fov = 2 * Math.atan(Math.tan(to.fov * Math.PI / 360) * to.position.distanceTo(to.target) / distance) * 180 / Math.PI;
    const optical = buildBridge(from, { position: eye, target: to.target, fov: Math.min(60,Math.max(10,fov)) }, [from.position,eye]);
    if (optical.duration <= focusBudgetMs) return { bridge: optical, framing: 'optical' as const };
  }
}

/** Camera-only clock. The engine still owns every gift deadline and order. */
export class RotationDirector {
  phase = 0;
  reachedFocus = false;
  blocked = false;
  status: 'idle' | 'braking' | 'focus-travel' | 'focus-optical' | 'focus-unavailable' |
    'return' | 'return-rejoin' | 'safe-hold' = 'idle';
  receipt?: { distance: number; durationMs: number; phase: number };
  private previousAt?: number;
  private previous?: CameraPose;
  private request?: string;
  private motion?: Motion;
  private age = 0;
  private brake?: Motion;
  private brakeAge = 0;
  private returnPhase?: number;
  private rampAt = resumeMs;
  private readonly sample: (seconds: number) => CameraPose;
  private readonly clearance: CameraClearance;

  constructor(sample: (seconds: number) => CameraPose, clearance: CameraClearance) {
    this.sample = sample;
    this.clearance = clearance;
  }

  pause() { this.previousAt = undefined; }

  private returnToRoute(from: CameraPose): Return | undefined {
    const offsets = [0];
    for(let second=1;second<=34;second++) offsets.push(second,-second);
    for (const offset of offsets) {
      const phase = this.phase + offset;
      const to = this.sample(phase);
      const path = planCameraBridge(from.position,to.position,this.clearance);
      if (path) {
        const bridge = buildBridge(from,to,path);
        if (bridge.duration <= returnBudgetMs) return { bridge, phase };
      }
    }
  }

  private begin(from: CameraPose, focus?: Focus) {
    this.motion = undefined;
    this.returnPhase = undefined;
    this.age = 0;
    this.rampAt = 0;
    if(focus) {
      const selected = focusBridge(from,focus,this.clearance);
      this.motion = selected?.bridge;
      this.status = selected?.framing === 'travel' ? 'focus-travel' : selected ? 'focus-optical' : 'focus-unavailable';
    } else {
      const selected = this.returnToRoute(from);
      this.motion = selected?.bridge;
      this.returnPhase = selected?.phase;
      this.status = !selected ? 'safe-hold' : selected.phase === this.phase ? 'return' : 'return-rejoin';
    }
    this.blocked = !this.motion;
    const bridge = this.motion as Bridge | undefined;
    this.receipt = bridge && { distance:bridge.distance, durationMs:bridge.duration, phase:this.returnPhase ?? this.phase };
  }

  step(atMs: number, visible: boolean, focus?: Focus) {
    const gap = this.previousAt === undefined ? 0 : Math.max(0, atMs - this.previousAt);
    this.previousAt = visible ? atMs : undefined;
    const delta = visible && gap <= 250 ? gap : 0;
    const initial = this.previous ??= this.sample(this.phase);
    if (!visible) return initial;
    const request = focus?.requestId;
    if (this.request !== request) {
      const old = this.request;
      this.request = request;
      this.reachedFocus = false;
      if (!this.brake) {
        const moving = this.motion, age = this.age, phase = this.phase;
        if (moving || (!old && this.status === 'idle' && this.previousAt !== undefined)) {
          const rate = Math.min(1,this.rampAt/resumeMs);
          this.brake = { duration: brakeMs, sample: progress => {
            const distance = progress - progress * progress / (2 * brakeMs);
            if (moving) return moving.sample(age + distance);
            this.phase = phase + rate * distance / 1000;
            return this.sample(this.phase);
          }};
          this.brakeAge = 0;
          this.status = 'braking';
          this.blocked = false;
        } else this.begin(initial,focus);
      }
      return initial;
    }
    if (this.brake) {
      this.brakeAge = Math.min(brakeMs,this.brakeAge+delta);
      this.previous = this.brake.sample(this.brakeAge);
      if (this.brakeAge >= brakeMs) {
        this.brake = undefined;
        this.begin(this.previous,focus);
      }
      return this.previous;
    }
    if (this.blocked) return initial;
    if (this.motion) {
      this.age += delta;
      this.previous = this.motion.sample(this.age);
      if (this.age >= this.motion.duration) {
        this.reachedFocus = !!focus;
        this.motion = undefined;
        if (this.returnPhase !== undefined) {
          this.phase = this.returnPhase;
          this.status = 'idle';
        }
      }
      return this.previous;
    }
    if (focus) return initial;
    const integral = (ms: number) => ms < resumeMs ? ms * ms / (2 * resumeMs) : ms - resumeMs / 2;
    this.phase += (integral(this.rampAt + delta) - integral(this.rampAt)) / 1000;
    this.rampAt = Math.min(resumeMs, this.rampAt + delta);
    return this.previous = this.sample(this.phase);
  }
}
