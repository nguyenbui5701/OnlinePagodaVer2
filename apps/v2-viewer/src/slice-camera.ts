import { loopSeconds, type CameraPose as Pose } from './camera.ts';
import { timing } from './slice-driver.ts';

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

export class SliceCamera {
  private previous?: Pose;
  private from?: Pose;
  private currentId?: string;
  private changeAt = 0;
  private resumeAt?: number;
  private resumeRouteTime = 0;

  routeSeconds(atMs: number, focusRequestId?: string) {
    const clock = this.resumeAt === undefined ? atMs / 1000 : this.resumeRouteTime + (atMs - this.resumeAt) / 1000;
    if (!this.currentId || focusRequestId) return clock;
    this.resumeAt = atMs;
    this.resumeRouteTime = Math.floor(clock / loopSeconds) * loopSeconds + 1.2;
    return this.resumeRouteTime;
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
