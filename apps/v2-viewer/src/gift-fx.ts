import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Vector3 } from 'three';
import type { Effect, Snapshot } from '../../../packages/v2-events/src/protocol.ts';
import type { ActorTarget } from './seat-scene.ts';
import { giftTiming } from './fx-profiles.ts';
import type { WaterRipple } from './water.ts';

type Phase = 'observed' | 'confirmed';
type Ack = Extract<Effect, { type: 'giftFx' }>;
type Binding = { actorId: string; seatId: string };
type Cue = Binding & { roomSessionId: string; requestId: string; giftId: string; phase: Phase; startedAtMs: number; expiresAtMs: number };
const ledgerCapacity = 256;

export class GiftFxLifecycle {
  private readonly played = new Map<string, number>();
  private room?: string;
  private revision = -1;
  private cue?: Cue;
  private exitAt?: number;
  readonly starts = { observed: 0, confirmed: 0 };
  suppressed = 0;

  get ledgerSize() { return this.played.size; }

  update(state: Snapshot, ack?: Ack, binding?: Binding) {
    if (state.revision < this.revision ||
        (state.revision === this.revision && state.roomSessionId !== this.room)) return;
    this.revision = state.revision;
    if (state.roomSessionId !== this.room) {
      this.room = state.roomSessionId;
      this.played.clear();
      this.cue = undefined;
      this.exitAt = undefined;
      this.suppressed = 0;
    }
    const intent = state.focus;
    const mode = state.camera.mode;
    const valid = state.connected && binding && intent && ack?.dedicatedFocus && ack.anchor === 'giftFx' &&
      intent.roomSessionId === state.roomSessionId && intent.expiresAtMs > state.atMs &&
      state.camera.activeRequestId === intent.requestId && state.camera.activeActorId === intent.actorId &&
      intent.requestId === ack.requestId && intent.actorId === ack.actorId && intent.actorId === binding.actorId &&
      state.avatars.some(actor => actor.actorId === binding.actorId && actor.seatId === binding.seatId && actor.visible);
    if (valid) {
      this.exitAt = undefined;
      let phase: Phase | undefined;
      if (intent.confirmation === ack.confirmation) {
        if (intent.confirmation === 'confirmed' && mode === 'GIFT_FOCUS') phase = 'confirmed';
        if (intent.confirmation === 'observed' && (mode === 'GIFT_TRANSITION' || mode === 'GIFT_FOCUS')) phase = 'observed';
      }
      if (this.cue && (this.cue.requestId !== intent.requestId || this.cue.actorId !== binding.actorId ||
        this.cue.seatId !== binding.seatId)) this.cue = undefined;
      if (phase) this.begin(state, binding, intent.requestId, ack.giftId, intent.expiresAtMs, phase);
    } else if (state.connected && mode === 'CINE_RETURN' && !intent && this.cue) {
      this.exitAt ??= state.atMs;
    } else {
      this.cue = undefined;
      this.exitAt = undefined;
    }

    if (!this.cue) return;
    const duration = this.cue.phase === 'confirmed' ? giftTiming.confirmedMs : giftTiming.observedMs;
    const age = state.atMs - this.cue.startedAtMs;
    const exit = this.exitAt === undefined ? 1 : 1 - (state.atMs - this.exitAt) / giftTiming.exitFadeMs;
    if (age >= duration || exit <= 0 || this.cue.expiresAtMs <= state.atMs) {
      this.cue = undefined;
      return;
    }
    const progress = Math.max(0, age / duration);
    const opacity = Math.min(1, age / 150) * (1 - progress) ** 0.85 * exit;
    return { ...this.cue, progress, opacity };
  }

  private begin(state: Snapshot, binding: Binding, requestId: string, giftId: string, expiresAtMs: number, phase: Phase) {
    const key = JSON.stringify([state.roomSessionId, requestId, binding.actorId, binding.seatId]);
    const existing = this.played.get(key);
    const mask = phase === 'observed' ? 1 : 2;
    if ((existing ?? 0) & mask) return;
    if (existing === undefined && this.played.size >= ledgerCapacity) {
      // Fail closed on capacity to avoid ever replaying an evicted request in this room.
      this.suppressed = 1;
      return;
    }
    this.played.set(key, (existing ?? 0) | mask);
    this.starts[phase]++;
    this.cue = { ...binding, roomSessionId: state.roomSessionId, requestId, giftId, phase, startedAtMs: state.atMs, expiresAtMs };
  }
}

export function createGiftFx(capacity: number) {
  const lifecycle = new GiftFxLifecycle();
  const geometry = new BufferGeometry();
  const points = new Float32Array((capacity + 1) * 3);
  for (let i = 1; i <= capacity; i++) {
    points[i * 3] = i * 2.3999632;
    points[i * 3 + 1] = (i * 0.6180339) % 1;
    points[i * 3 + 2] = (i * 0.3819660 + 0.24) % 1;
  }
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  const anchor = new Vector3();
  const position = new Vector3();
  const head = new Vector3();
  const origin = new Vector3();
  const uniforms = { age: { value: 0 }, opacity: { value: 0 }, full: { value: 0 }, anchor: { value: anchor } };
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms,
    vertexShader: `
      uniform float age;
      uniform float opacity;
      uniform float full;
      uniform vec3 anchor;
      varying float alpha;
      varying float spark;
      varying float shade;
      void main() {
        spark = step(0.01, position.x);
        float spread = 0.76 + age * 0.56 + position.y * 0.42;
        float angle = position.x + age * 0.44;
        float variation = position.z;
        shade = variation;
        vec3 p = anchor;
        if (spark > 0.5) {
          p.xz += spread * vec2(cos(angle), sin(angle));
          p.y += variation * 0.24 + age * mix(0.34, 0.64, position.y);
        }
        vec4 view = viewMatrix * vec4(p, 1.0);
        float diameter = spark > 0.5 ? mix(0.08, 0.16, position.y) : mix(1.22, 1.94, full) + age * 0.42;
        gl_PointSize = clamp(diameter * 600.0 * projectionMatrix[1][1] / max(1.0, -view.z),
          1.0, spark > 0.5 ? 26.0 : 236.0);
        gl_Position = projectionMatrix * view;
        alpha = opacity * (spark > 0.5 ? mix(0.43, 0.77, full) * mix(0.80, 1.0, variation) :
          mix(0.33, 0.22, full));
      }
    `,
    fragmentShader: `
      varying float alpha;
      varying float spark;
      varying float shade;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = length(uv);
        float coverage;
        vec3 color;
        if (spark > 0.5) {
          float core = 1.0 - smoothstep(0.06, 0.42, d);
          float fringe = 1.0 - smoothstep(0.08, 0.96, d);
          coverage = 0.32 * fringe + 0.68 * core;
          color = mix(vec3(1.0, 0.47, 0.30), vec3(1.0, 0.92, 0.60), shade);
        } else {
          coverage = 1.0 - smoothstep(0.03, 0.22, abs(d - 0.67));
          color = vec3(1.0, 0.73, 0.49);
        }
        if (alpha * coverage < 0.012) discard;
        gl_FragColor = vec4(color, alpha * coverage);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const cloud = new Points(geometry, material);
  cloud.name = 'Active gift celebration pool';
  cloud.frustumCulled = false;
  cloud.visible = false;
  return {
    cloud,
    update(state: Snapshot, ack?: Ack, target?: ActorTarget) {
      const binding = target && { actorId: target.presentation.actorId, seatId: target.presentation.seatId };
      const gift = lifecycle.update(state, ack, binding);
      if (gift && target) {
        target.seat.fx.getWorldPosition(position);
        target.seat.head.getWorldPosition(head);
        target.seat.seatRoot.getWorldPosition(origin);
        // Offset the real FX anchor to feet/body height. Spark height stays below the face.
        anchor.set(position.x * 0.22 + origin.x * 0.78,
          Math.max(origin.y + 0.08, Math.min(position.y - 0.50, head.y - 0.90, origin.y + 0.27)),
          position.z * 0.22 + origin.z * 0.78);
      }
      const confirmed = gift?.phase === 'confirmed';
      const count = gift ? (confirmed ? capacity + 1 : giftTiming.observedSparks + 1) : 0;
      geometry.setDrawRange(0, count);
      cloud.visible = count > 0;
      uniforms.full.value = confirmed ? 1 : 0;
      uniforms.age.value = gift?.progress ?? 0;
      uniforms.opacity.value = gift?.opacity ?? 0;
      const ripple: WaterRipple | undefined = gift && confirmed && gift.opacity > 0
        ? { x: origin.x, z: origin.z, progress: gift.progress, opacity: gift.opacity } : undefined;
      return {
        gift, ripple, count, capacity: capacity + 1, starts: { ...lifecycle.starts }, ledgerSize: lifecycle.ledgerSize,
        // Three r181 assigns a numeric Material.id at runtime, including after context restoration.
        ledgerCapacity, suppressed: lifecycle.suppressed, poolId: geometry.id, materialId: (material as ShaderMaterial & { readonly id: number }).id,
        anchorWorld: gift ? anchor.toArray() : undefined,
        waterAnchor: ripple ? [ripple.x, 0, ripple.z] : undefined,
      };
    },
    dispose() {
      cloud.removeFromParent();
      material.dispose();
      geometry.dispose();
    },
  };
}
