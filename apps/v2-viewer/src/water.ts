import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector4 } from 'three';
import { giftTiming, type FxProfile } from './fx-profiles.ts';

export type WaterRipple = { x: number; z: number; progress: number; opacity: number };

export function createWater(options: FxProfile['water']) {
  const time = { value: 0 };
  const tree = new Vector2();
  const ripple = new Vector4();
  const material = new ShaderMaterial({
    defines: options.fineDetail ? { FINE_WATER: 1 } : {},
    uniforms: {
      time, tree: { value: tree }, giftRipple: { value: ripple },
      wave: { value: new Vector4(options.waveAmplitude, options.waveSpeed, options.waveScale, options.reflection) },
      giftRadius: { value: giftTiming.rippleRadius },
    },
    vertexShader: `
      varying vec3 world;
      void main() {
        vec4 p = modelMatrix * vec4(position, 1.0);
        world = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec2 tree;
      uniform vec4 wave;
      uniform vec4 giftRipple;
      uniform float giftRadius;
      varying vec3 world;

      float falloff(vec2 p) {
        return exp(-dot(p, p));
      }

      void main() {
        vec3 ray = cameraPosition - world;
        float dist2 = dot(ray, ray);
        float viewHeight = max(ray.y, 0.35);
        vec2 p = (world.xz - tree) * wave.z;
        float t = time * wave.y;
        float warp = sin(dot(p, vec2(0.17, -0.21)) + t * 0.28);
        float broad = sin(dot(p, vec2(0.75, 0.42)) + t * 0.85 + warp);
        float crossing = sin(dot(p, vec2(-0.63, 1.17)) - t * 0.61 - broad * 0.55);
        float fine = sin(dot(p, vec2(1.82, 2.29)) + t + crossing * 1.5);
        #ifdef FINE_WATER
          fine = mix(fine, sin(dot(p, vec2(-3.4, 2.2)) - t * 1.21 + broad * 1.9), 0.34);
        #endif
        float current = 0.51 * broad + 0.31 * crossing + 0.18 * fine;
        float incidence = clamp(viewHeight * inversesqrt(dist2), 0.0, 1.0);
        float fresnel = pow(1.0 - incidence, 4.0);
        float haze = 1.0 - exp(-0.00011 * dist2);
        vec3 dusk = vec3(0.423, 0.292, 0.462);
        vec3 deep = vec3(0.044, 0.039, 0.093);
        vec3 color = mix(deep, dusk, 0.075 + 0.42 * fresnel + wave.x * current);

        // Cross the reflected sightline with two virtual heights below the water.
        // Soft masks approximate the canopy and trunk light without a second scene render.
        vec2 projected = world.xz - tree;
        vec2 raySlope = ray.xz / viewHeight;
        vec2 drift = vec2(crossing + 0.38 * fine, 0.36 * broad) * (0.6 + 1.1 * fresnel);
        vec2 canopy = projected - raySlope * 17.0 + drift;
        float rose = 0.64 * falloff((canopy - vec2(3.1, 0.0)) / vec2(9.5, 10.5)) +
          0.50 * falloff((canopy + vec2(4.5, 1.1)) / vec2(8.0, 9.2));
        vec2 trunk = projected - raySlope * 4.25 + drift * 0.55;
        float gold = falloff((trunk - vec2(0.8, 0.0)) / vec2(3.0, 3.6));
        float rootGlow = falloff(projected / vec2(9.5, 8.5));
        float glint = smoothstep(0.37, 0.95, fine) * smoothstep(-0.35, 0.76, crossing);
        color += wave.w * (0.83 + 0.34 * glint) * (rose * vec3(0.55, 0.225, 0.30) +
          gold * vec3(0.46, 0.31, 0.14) + rootGlow * vec3(0.12, 0.057, 0.073));
        color += glint * (0.008 + 0.022 * rose) * vec3(0.75, 0.51, 0.65);

        if (giftRipple.w > 0.0) {
          float distanceToSeat = distance(world.xz, giftRipple.xy);
          float radius = mix(0.30, giftRadius, giftRipple.z);
          float outline = 1.0 - smoothstep(0.035, 0.15, abs(distanceToSeat - radius));
          color += outline * giftRipple.w * vec3(0.092, 0.051, 0.073);
        }
        gl_FragColor = vec4(mix(color, dusk, haze), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const geometry = new PlaneGeometry(800, 800);
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return {
    mesh, time, tree,
    setRipple(next?: WaterRipple) {
      if (next) ripple.set(next.x, next.z, next.progress, next.opacity);
      else ripple.w = 0;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
