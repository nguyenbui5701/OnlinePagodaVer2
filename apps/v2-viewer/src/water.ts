import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three';
import { giftTiming, type FxProfile } from './fx-profiles.ts';

export type WaterRipple = { x: number; z: number; progress: number; opacity: number };
const goldLobes = [
  { x: -5.6, z: 3.3, phase: .3, strength: .92 },
  { x: 4.7, z: 6.2, phase: 2.45, strength: 1 },
  { x: 1.1, z: -5.8, phase: 4.65, strength: .82 },
];

export function createWater(options: FxProfile['water'], twilight = false) {
  const time = { value: 0 };
  const tree = new Vector2();
  const ripple = new Vector4();
  const deepWater = new Color();
  const horizon = new Color();
  const reflection = new Vector3();
  const lobes = goldLobes.map(() => new Vector3());
  const material = new ShaderMaterial({
    defines: { ...(options.fineDetail && { FINE_WATER: 1 }), ...(twilight && { TWILIGHT_WATER: 1 }) },
    uniforms: {
      time, tree: { value: tree }, giftRipple: { value: ripple },
      wave: { value: new Vector4(options.waveAmplitude, options.waveSpeed, options.waveScale, options.reflection) },
      giftRadius: { value: giftTiming.rippleRadius },
      deepWater: { value: deepWater }, horizon: { value: horizon }, lookReflection: { value: reflection },
      goldLobes: { value: lobes },
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
      #ifdef TWILIGHT_WATER
        uniform vec3 deepWater;
        uniform vec3 horizon;
        uniform vec3 lookReflection;
      #endif
      #ifdef DRIFT_GOLD
        uniform vec3 goldLobes[3];
      #endif
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
        #ifdef TWILIGHT_WATER
          vec3 dusk = horizon;
          vec3 deep = deepWater;
        #else
          vec3 dusk = vec3(0.423, 0.292, 0.462);
          vec3 deep = vec3(0.044, 0.039, 0.093);
        #endif
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
        #ifdef TWILIGHT_WATER
          // Elongated bands vary slowly across lake depth and break laterally with the existing wave field.
          float band = smoothstep(0.04, 0.99, sin(p.y * 1.74 + p.x * 0.12 + t * 0.77 + warp + crossing * 0.64));
          float ribbons = 0.23 + (0.55 * band + 0.15 * glint) * (0.65 + 0.35 * broad);
          float warmFan = falloff((projected - raySlope * 2.5) / vec2(8.5, 12.5));
          vec3 pink = lookReflection.x * (rose * vec3(0.53, 0.19, 0.27) + rootGlow * vec3(0.15,0.043,0.074));
          vec3 peach = lookReflection.y * (gold * vec3(0.63, 0.31, 0.11) + warmFan * vec3(0.32,0.13,0.060));
          color += wave.w * (pink * (0.34 + 0.73 * ribbons) + peach * ribbons * lookReflection.z);
          #ifdef DRIFT_GOLD
            // World-space lobes share the existing wave field and gleam at grazing angles.
            vec2 broken = projected + vec2(crossing, .38 * broad) * .82;
            vec2 across = vec2(.94, -.34);
            vec2 along = vec2(.34, .94);
            float highlights = 0.0;
            for (int i = 0; i < 3; i++) {
              vec2 offset = broken - goldLobes[i].xy;
              vec2 ellipse = vec2(dot(offset, across) / 2.25, dot(offset, along) / 4.6);
              highlights += falloff(ellipse) * goldLobes[i].z;
            }
            float breakup = .38 + .46 * band + .16 * glint;
            color += vec3(.58, .275, .072) * highlights * breakup * wave.w *
              lookReflection.y * (.35 + .65 * fresnel);
          #endif
          color += glint * 0.009 * vec3(0.55,0.49,0.79);
        #else
          color += wave.w * (0.83 + 0.34 * glint) * (rose * vec3(0.55, 0.225, 0.30) +
            gold * vec3(0.46, 0.31, 0.14) + rootGlow * vec3(0.12, 0.057, 0.073));
          color += glint * (0.008 + 0.022 * rose) * vec3(0.75, 0.51, 0.65);
        #endif

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
    mesh, tree,
    enableDriftingGold() {
      material.defines.DRIFT_GOLD = 1;
      material.needsUpdate = true;
    },
    setTime(seconds: number) {
      time.value = seconds;
      if (!material.defines.DRIFT_GOLD) return;
      for (const [i, { x, z, phase, strength }] of goldLobes.entries()) {
        const t = seconds * .23 + phase;
        lobes[i].set(x + 1.85 * Math.sin(t), z + 1.25 * Math.cos(t * .87 + phase),
          strength * (.83 + .17 * Math.sin(t * 1.15 + phase)));
      }
    },
    setAppearance(deep: Color, skyHorizon: Color, weights: { rose: number; gold: number; streaks: number }) {
      deepWater.copy(deep);
      horizon.copy(skyHorizon);
      reflection.set(weights.rose, weights.gold, weights.streaks);
    },
    setRipple(next?: WaterRipple) {
      if (next) ripple.set(next.x, next.z, next.progress, next.opacity);
      else ripple.w = 0;
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
