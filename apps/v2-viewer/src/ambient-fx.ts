import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Frustum, Matrix4, Vector3, type PerspectiveCamera } from 'three';
export type AmbientCounts = Readonly<{ motes: number; petals: number; leaves: number }>;

export function createAmbientFx(origin: Vector3, seed: number, counts: AmbientCounts,
  local?: { pads: readonly (readonly number[])[]; each: number }, pond = false) {
  const positions: number[] = [];
  const details: number[] = [];
  let randomState = (seed ^ 0x51a73d19) >>> 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };

  const placements = (local?.pads ?? []).flatMap((pad, index) =>
    Array.from({ length: local!.each }, (_, i) => ({ pad, i, kind: i === 0 ? 0 : (index + i) % 4 === 0 ? 2 : i % 2 })));
  const totals = [0, 0, 0];
  if (pond) {
    const caps = [counts.motes, counts.petals, counts.leaves];
    // Local points spend the same budget as tree and mid-pond points.
    for (let i = 0; i < placements.length; i++) {
      const kind = placements[i].kind;
      if (totals[kind] < caps[kind]) { totals[kind]++; continue; }
      placements.splice(i--, 1);
    }
  }
  for (const [kind, count] of [counts.motes, counts.petals, counts.leaves].entries()) {
    const sceneCount = count - totals[kind];
    totals[kind] = count;
    for (let i = 0; i < sceneCount; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 3.1 + Math.sqrt(random()) * (kind === 0 ? 12.9 : 11.6);
      const height = kind === 0 ? 0.8 + random() ** 1.7 * 10.2 : 14.8 + random() * 10.1;
      const mid = pond && i % 4 === 0;
      const spread = mid ? radius * 1.55 : radius;
      positions.push(Math.cos(angle) * spread, mid ? height * .65 : height, Math.sin(angle) * spread);
      details.push(kind, random(), random(), random());
    }
  }
  for (const { pad, i, kind } of placements) {
    const angle = (i / local!.each + random() * .2) * Math.PI * 2;
    const radius = 1.85 + random() * 1.35;
    positions.push(pad[0] - origin.x + Math.cos(angle) * radius,
      kind === 0 ? .42 + random() * 1.1 : 1.35 + random() * 1.9,
      pad[2] - origin.z + Math.sin(angle) * radius);
    details.push(3 + kind, random(), random(), random());
    if (!pond) totals[kind]++;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('detail', new Float32BufferAttribute(details, 4));
  const uniforms = { elapsed: { value: 0 }, density: { value: 1 }, localDensity: { value: 1 } };
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms,
    vertexShader: `
      attribute vec4 detail;
      uniform float elapsed;
      uniform float density;
      uniform float localDensity;
      varying float kind;
      varying float opacity;
      varying float spin;
      varying float cheek;
      void main() {
        kind = detail.x;
        bool nearPad = kind >= 3.0;
        if (nearPad) kind -= 3.0;
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
        if (nearPad) {
          p.xz = position.xz + 0.37 * vec2(sin(t * .47 + phase), cos(t * .34 + phase));
          if (kind > 0.5) p.y = mix(position.y, .24, fract(t / 9.0 + detail.y));
          diameter *= .73;
          visibility *= localDensity * .83;
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
  const frustum = new Frustum();
  const viewProjection = new Matrix4();
  const center = new Vector3();
  return {
    points, counts, localCount: placements.length,
    totals: { motes: totals[0], petals: totals[1], leaves: totals[2] },
    spatialCounts(camera: PerspectiveCamera) {
      frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const hit = [0, 0, 0];
      const t = uniforms.elapsed.value;
      const fract = (x: number) => x - Math.floor(x);
      for (let i = 0; i < details.length / 4; i++) {
        const [tag, offset, , variation] = details.slice(i * 4, i * 4 + 4);
        const kind = tag % 3;
        const phase = offset * 6.283185;
        const [x,y,z] = positions.slice(i * 3, i * 3 + 3);
        const age = fract(t / (20 + 11 * variation) + offset);
        if (kind && (age < .025 || age > .98)) continue;
        if (tag >= 3 && uniforms.localDensity.value < .1) continue;
        if (!kind) center.set(x + 1.25 * Math.sin(.25 * t + phase), y + .50 * Math.sin(.41 * t + phase * 1.9),
          z + 1.30 * Math.cos(.22 * t + phase * 1.3));
        else center.set(x + age * 3.6 + Math.sin(.61 * t + phase) * .80,
          y + (.7 - y) * age + .14 * Math.sin(t * 1.2 + phase), z + age * 1.9 + Math.cos(.43 * t + phase * 1.4) * .58);
        if (tag >= 3) {
          center.x = x + .37 * Math.sin(.47 * t + phase);
          center.z = z + .37 * Math.cos(.34 * t + phase);
          if (kind) center.y = y + (.24 - y) * fract(t / 9 + offset);
        }
        if (frustum.containsPoint(center.add(origin))) hit[kind]++;
      }
      return { motes: hit[0], petals: hit[1], leaves: hit[2] };
    },
    update(seconds: number, giftOpacity: number, foreground = false) {
      uniforms.elapsed.value = seconds;
      uniforms.density.value = 1 - giftOpacity * 0.28;
      uniforms.localDensity.value = foreground ? .06 : 1;
    },
    dispose() {
      points.removeFromParent();
      material.dispose();
      geometry.dispose();
    },
  };
}
