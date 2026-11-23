import { AdditiveBlending, BufferGeometry, BufferAttribute, Points, ShaderMaterial, Vector3 } from 'three';
import type { Snapshot } from '../../../packages/v2-events/src/protocol.ts';
import { blessingParticles, planBlessing } from './gift-blessing.ts';
import type { FxProfile } from './fx-profiles.ts';
import type { GiftFxLifecycle } from './gift-fx.ts';
import type { ActorTarget } from './seat-scene.ts';

type Cue = ReturnType<GiftFxLifecycle['update']>;

export function createBlessingCloud(tree: Vector3, seed: number, profile: FxProfile['blessing']) {
  const data = blessingParticles(seed, profile.halos, profile.sparks);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(data, 3));
  const root = new Vector3(), fx = new Vector3(), head = new Vector3();
  const uniforms = {
    root: { value: root }, fx: { value: fx }, crown: { value: 1.1 }, tree: { value: tree.clone() },
    time: { value: 0 }, envelope: { value: new Vector3() }, intensity: { value: profile.intensity },
  };
  const material = new ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending,
    vertexShader: `
      uniform vec3 root;
      uniform vec3 fx;
      uniform vec3 tree;
      uniform float crown;
      uniform float time;
      uniform vec3 envelope;
      uniform float intensity;
      varying float kind;
      varying float opacity;
      varying float tint;
      varying float flatten;
      varying vec2 streak;
      void main() {
        kind = position.x;
        tint = position.z;
        vec2 rear = cameraPosition.xz - root.xz;
        rear /= max(length(rear), 0.001);
        vec2 side = vec2(rear.y, -rear.x);
        vec2 toward = tree.xz - fx.xz;
        toward /= max(length(toward), 0.001);
        vec3 p = root;
        float size = 2.85;
        flatten = clamp(abs(normalize(cameraPosition - root).y), 0.22, 0.74);
        opacity = envelope.x * 0.70;
        streak = vec2(1.0, 0.0);
        if (kind < 0.5) {
          p.y = 0.045;
          p.xz += rear * 0.20;
        } else if (kind < 1.5) {
          float index = position.y;
          float signSide = mod(index, 2.0) < 0.5 ? -1.0 : 1.0;
          float lift = clamp((time - 0.17 - index * 0.052) / 0.82, 0.0, 1.0);
          float ring = sin(lift * 4.1 + tint * 3.0);
          float radius = 0.91 + floor(index * 0.5) * 0.145 + ring * 0.11;
          p.xz += side * signSide * radius + rear * ring * 0.32;
          p.y = mix(root.y + 0.09, min(crown - 0.34, root.y + 0.56), lift)
            + floor(index * 0.5) * 0.105 * (1.0 - lift);
          size = mix(0.18, 0.23, tint);
          opacity = envelope.y * smoothstep(0.0, 0.17, lift) * mix(0.64, 0.95, tint);
        } else {
          float stream = clamp((time - 0.60 - position.y * 0.34) / 0.54, 0.0, 1.0);
          // Start beside the giver, then advance on the true horizontal ray toward Sakura.
          p.xz = mix(root.xz, fx.xz, 0.52) - side * (0.59 + tint * 0.12)
            + toward * (0.09 + stream * 1.12);
          p.y = min(fx.y - 0.49, crown - 0.42) + sin(stream * 2.4) * 0.16 + (tint - 0.5) * 0.20;
          size = mix(0.085, 0.15, tint);
          opacity = envelope.z * smoothstep(0.0, 0.24, stream) * (1.0 - smoothstep(0.76, 1.0, stream))
            * mix(0.69, 0.97, tint);
          vec4 direction = viewMatrix * vec4(toward.x, 0.07, toward.y, 0.0);
          vec2 projected = direction.xy * vec2(1.0,-1.0) + vec2(0.001, 0.0);
          streak = normalize(projected);
        }
        vec4 view = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(size * 640.0 * projectionMatrix[1][1] / max(1.0, -view.z), 1.0, kind < 0.5 ? 275.0 : 38.0);
        vec2 screen = abs(gl_Position.xy / max(0.001, gl_Position.w));
        if (kind > 0.5) opacity *= (1.0 - smoothstep(0.70, 0.84, screen.x)) * (1.0 - smoothstep(0.75, 0.86, screen.y));
        opacity *= intensity;
      }
    `,
    fragmentShader: `
      varying float kind;
      varying float opacity;
      varying float tint;
      varying float flatten;
      varying vec2 streak;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float f;
        vec3 color;
        if (kind < 0.5) {
          float r = length(vec2(uv.x, uv.y / flatten));
          f = 0.40 * (1.0 - smoothstep(0.10,0.98,r))
            + 0.55 * (1.0 - smoothstep(0.05,0.24,abs(r - 0.58)));
          color = vec3(1.0, 0.60, 0.23);
        } else if (kind < 1.5) {
          float r = length(uv);
          float petal = length(vec2((uv.x + uv.y * (0.22 + tint * 0.34)) * 1.85, uv.y * 1.55));
          f = 0.16 * (1.0 - smoothstep(0.22,0.98,r))
            + 0.48 * (1.0 - smoothstep(0.035,0.13,abs(r - 0.65)))
            + 0.72 * (1.0 - smoothstep(0.13,0.63,petal));
          color = mix(vec3(1.0, 0.45, 0.40), vec3(1.0, 0.82, 0.46), tint);
        } else {
          float r = length(vec2(dot(uv, streak), dot(uv, vec2(-streak.y, streak.x)) * 2.65));
          f = 0.34 * (1.0 - smoothstep(0.09,0.99,r))
            + 0.66 * (1.0 - smoothstep(0.03,0.47,r));
          color = mix(vec3(1.0,0.51,0.26), vec3(1.0,0.89,0.55), tint);
        }
        if (opacity * f < 0.01) discard;
        gl_FragColor = vec4(color, min(0.85, opacity * f));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const cloud = new Points(geometry, material);
  cloud.name = 'Confirmed gift blessing pool';
  cloud.frustumCulled = false;
  cloud.visible = false;
  return {
    cloud,
    update(state: Snapshot, cue: Cue, target?: ActorTarget) {
      const binding = target && state.focus && state.connected && state.camera.mode === 'GIFT_FOCUS' ? {
        roomSessionId: state.roomSessionId, requestId: state.focus.requestId,
        actorId: target.presentation.actorId, seatId: target.presentation.seatId,
      } : undefined;
      const plan = planBlessing(cue, binding, state.atMs);
      cloud.visible = !!plan && (plan.warm > 0 || plan.halos > 0 || plan.trail > 0);
      if (plan && target) {
        target.seat.seatRoot.getWorldPosition(root);
        target.seat.fx.getWorldPosition(fx);
        target.seat.head.getWorldPosition(head);
        uniforms.crown.value = head.y;
        uniforms.time.value = plan.ageMs / 1000;
        uniforms.envelope.value.set(plan.warm, plan.halos, plan.trail);
      }
      return { active: cloud.visible, cue: plan && cue && { ...binding!, startedAtMs: cue.startedAtMs },
        plan, haloCapacity: profile.halos, sparkCapacity: profile.sparks, bufferBytes: data.byteLength,
        poolId: geometry.id, seatWorld: plan ? root.toArray() : undefined,
        fxAnchor: plan ? fx.toArray() : undefined, treeWorld: plan ? tree.toArray() : undefined };
    },
    dispose() { cloud.removeFromParent(); geometry.dispose(); material.dispose(); },
  };
}
