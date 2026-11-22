import type { Vector3 } from 'three';
import { loopSeconds, sampleCinematic } from './camera.ts';
import { timing } from './slice-driver.ts';

type Pose = { position: Vector3; target: Vector3; fov: number };
const clamp = (unit: number) => Math.min(1, Math.max(0, unit));
const smooth = (unit: number) => {
  const t = clamp(unit);
  return t * t * t * (10 + t * (-15 + 6 * t));
};

function blend(a: Pose, b: Pose, weight: number): Pose {
  return {
    position: a.position.clone().lerp(b.position, weight),
    target: a.target.clone().lerp(b.target, weight),
    fov: a.fov + (b.fov - a.fov) * weight,
  };
}

export function sliceCinematic(seconds: number, close: Pose) {
  const base = sampleCinematic(seconds);
  const phase = ((seconds % loopSeconds) + loopSeconds) % loopSeconds;
  const weight = phase < 7 ? 1 - smooth((phase - 3.4) / 3.6) : smooth((phase - 36.5) / 3.5);
  return { ...blend(base, close, weight), shot: base.shot };
}

export class SliceCamera {
  private previous?: Pose;
  private from?: Pose;
  private currentId?: string;
  private changeAt = 0;
  private resumeAt?: number;

  routeSeconds(atMs: number, focusRequestId?: string) {
    if (this.currentId && !focusRequestId) this.resumeAt = atMs;
    return this.resumeAt === undefined ? atMs / 1000 : 1.2 + (atMs - this.resumeAt) / 1000;
  }

  move(atMs: number, cinematic: Pose, focus?: { requestId: string; pose: Pose }): Pose {
    if (this.currentId !== focus?.requestId) {
      this.currentId = focus?.requestId;
      this.changeAt = atMs;
      this.from = this.previous;
    }
    const to = focus?.pose ?? cinematic;
    const elapsed = atMs - this.changeAt;
    const duration = focus ? timing.transitionMs : timing.returnMs;
    const pose = this.from && elapsed < duration ? blend(this.from, to, smooth(elapsed / duration)) : to;
    this.previous = pose;
    return pose;
  }
}
