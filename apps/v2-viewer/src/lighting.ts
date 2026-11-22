import { AmbientLight, Color, DirectionalLight, FogExp2, Scene } from 'three';
import type { Profile } from './asset.ts';

export const referenceViews = {
  top:     { position: [3, 54, 10], target: [0, 13.5, 0], up: [0, 0, -1], fov: 50 },
  under:   { position: [3, 4.8, 18.5], target: [0, 11.9, 0], up: [0, 1, 0], fov: 44 },
  three_quarter: { position: [31, 25, 31], target: [0, 11.6, 0], up: [0, 1, 0], fov: 44 },
  hero_full_9x16: { position: [24.641505854426047, 38.825045790301786, 54.139118204520734],
    target: [0.15, 12.4, 0], up: [0, 1, 0], fov: 50 },
};

const suns = [
  { position: [22, 40, 26], power: 2.1, tint: [1, 0.84, 0.82] },
  { position: [-18, 23, -15], power: 1.05, tint: [1, 0.76, 0.89] },
  { position: [6, 3, 18], power: 0.72, tint: [1, 0.74, 0.83] },
];

export function setupLighting(scene: Scene, profile: Profile, comparison: boolean): void {
  scene.background = comparison ? new Color(0.69, 0.47, 0.60).multiplyScalar(0.65) : new Color('#ae93b5');
  scene.add(new AmbientLight(new Color(0.78, 0.42, 0.52), 0.92));
  if (!comparison) scene.fog = new FogExp2('#ae93b5', 0.009);
  for (const [index, { position, power, tint }] of suns.entries()) {
    const sun = new DirectionalLight(new Color().fromArray(tint), power * 0.78);
    sun.position.fromArray(position);
    sun.target.position.set(0, 9, 0);
    if (index === 0 && profile === 'quality') {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -23, right: 23, bottom: -23, top: 23, near: 0.5, far: 110 });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.normalBias = 0.019;
      sun.shadow.bias = -0.0002;
    }
    scene.add(sun, sun.target);
  }
}
