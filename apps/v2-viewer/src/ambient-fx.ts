import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, type Vector3 } from 'three';
import type { FxProfile } from './fx-profiles.ts';

export function createAmbientFx(origin: Vector3, seed: number, counts: FxProfile['ambient']) {
  const positions: number[] = [];
  const details: number[] = [];
  let randomState = (seed ^ 0x51a73d19) >>> 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };

  for (const [kind, count] of [counts.motes, counts.petals, counts.leaves].entries()) {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 3.1 + Math.sqrt(random()) * (kind === 0 ? 12.9 : 11.6);
      const height = kind === 0 ? 0.8 + random() ** 1.7 * 10.2 : 14.8 + random() * 10.1;
      positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      details.push(kind, random(), random(), random());
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('detail', new Float32BufferAttribute(details, 4));
  const uniforms = { elapsed: { value: 0 }, density: { value: 1 } };
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms,
    vertexShader: `
      attribute vec4 detail;
      uniform float elapsed;
      uniform float density;
      varying float kind;
      varying float opacity;
      varying float spin;
      varying float cheek;
      void main() {
        kind = detail.x;
        float phase = detail.y * 6.283185;
        float t = elapsed;
        vec3 p = position;
        float diameter;
        float visibility = 1.0;

        if (kind < 0.5) {
          p.x += 1.25 * sin(0.25 * t + phase);
          p.y += 0.50 * sin(0.41 * t + phase * 1.9);
          p.z += 1.30 * cos(0.22 * t + phase * 1.3);
          diameter = mix(0.12, 0.28, detail.z);
          visibility = 0.54 + 0.28 * sin(t * (0.65 + detail.w * 0.45) + phase);
          spin = 0.0;
          cheek = detail.z;
        } else {
          float life = mix(20.0, 31.0, detail.w);
          float age = fract(t / life + detail.y);
          visibility = smoothstep(0.0, 0.13, age) * (1.0 - smoothstep(0.84, 1.0, age));
          p.y = mix(position.y, 0.7, age) + 0.14 * sin(t * 1.2 + phase);
          p.x += age * 3.6 + sin(t * 0.61 + phase) * 0.80;
          p.z += age * 1.9 + cos(t * 0.43 + phase * 1.4) * 0.58;
          diameter = (kind < 1.5 ? 0.30 : 0.39) + detail.z * 0.19;
          spin = phase + t * mix(-1.0, 1.0, detail.w) * 0.48;
          cheek = 0.51 + 0.49 * abs(cos(t * 0.76 + phase));
        }
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        float depth = -view.z;
        opacity = density * visibility * smoothstep(1.5, 5.8, depth) * (1.0 - smoothstep(37.0, 90.0, depth));
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(diameter * 670.0 * projectionMatrix[1][1] / max(depth, 1.0), 1.0, 34.0);
      }
    `,
    fragmentShader: `
      varying float kind;
      varying float opacity;
      varying float spin;
      varying float cheek;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float alpha;
        vec3 color;
        if (kind < 0.5) {
          float d = dot(uv, uv);
          float falloff = (1.0 - smoothstep(0.06, 0.95, d));
          alpha = falloff * (0.18 + 0.68 * (1.0 - smoothstep(0.015, 0.24, d)));
          color = mix(vec3(0.94, 0.46, 0.23), vec3(1.0, 0.95, 0.67), cheek);
        } else {
          vec2 p = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * uv;
          p.x /= mix(0.60, 1.0, cheek);
          if (kind < 1.5) {
            // Round, asymmetric petal with a small notch on its broad end.
            p.x += 0.14 * p.y;
            float d = length(vec2(p.x / (0.56 + 0.18 * p.y), p.y / 0.86));
            float notch = 1.0 - (1.0 - smoothstep(0.11, 0.25, abs(p.x))) * smoothstep(0.58, 0.80, p.y);
            alpha = (1.0 - smoothstep(0.85, 1.0, d)) * notch * 0.72;
            color = mix(vec3(0.62, 0.19, 0.28), vec3(0.98, 0.57, 0.67), clamp(p.y + 0.5, 0.0, 1.0));
          } else {
            // Slim folded leaf and a quiet central vein, in warm olive rather than bright green.
            float d = abs(p.y) / 0.91 + abs(p.x - 0.17 * p.y * p.y) * 2.05;
            alpha = (1.0 - smoothstep(0.88, 1.0, d)) * 0.78;
            float vein = 1.0 - smoothstep(0.018, 0.062, abs(p.x - 0.17 * p.y * p.y));
            color = mix(vec3(0.51, 0.34, 0.11), vec3(0.66, 0.54, 0.22), max(vein, step(0.0, p.x) * 0.54));
          }
        }
        if (alpha * opacity < 0.012) discard;
        gl_FragColor = vec4(color, alpha * opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new Points(geometry, material);
  points.name = 'Blessing tree ambience';
  points.position.copy(origin);
  points.frustumCulled = false;
  return {
    points, counts,
    update(seconds: number, giftOpacity: number) {
      uniforms.elapsed.value = seconds;
      uniforms.density.value = 1 - giftOpacity * 0.28;
    },
    dispose() {
      points.removeFromParent();
      material.dispose();
      geometry.dispose();
    },
  };
}
