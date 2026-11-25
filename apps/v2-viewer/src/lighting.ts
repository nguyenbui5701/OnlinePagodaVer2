import { AmbientLight, Color, DirectionalLight, FogExp2, Mesh, MeshStandardMaterial,
  PlaneGeometry, PointLight, Scene, ShaderMaterial, type Material, type Object3D } from 'three';
import type { Profile } from './asset.ts';
import { looks, lookOrder } from './twilight.ts';

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

export function setupLighting(scene: Scene, profile: Profile, comparison: boolean) {
  scene.background = comparison ? new Color(0.69, 0.47, 0.60).multiplyScalar(0.65) : new Color('#ae93b5');
  const ambient = new AmbientLight(new Color(0.78, 0.42, 0.52), 0.92);
  const directionals: DirectionalLight[] = [];
  scene.add(ambient);
  const fog = comparison ? undefined : new FogExp2('#ae93b5', 0.009);
  if (fog) scene.fog = fog;
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
    directionals.push(sun);
  }
  return { ambient, directionals, fog };
}

export function createTwilight(scene: Scene, rig: ReturnType<typeof setupLighting>) {
  const geometry = new PlaneGeometry(2, 2);
  const sky = new Color();
  const horizon = new Color();
  const deepWater = new Color();
  const palette = lookOrder.map(id => {
    const look = looks[id];
    return { ...look, sky: new Color(look.sky), horizon: new Color(look.horizon),
      fog: new Color(look.fog), deepWater: new Color(look.deepWater) };
  });
  const skyMaterial = new ShaderMaterial({
    depthWrite: false, uniforms: { zenith: { value: sky }, horizon: { value: horizon } },
    vertexShader: `
      varying vec3 skyRay;
      void main() {
        skyRay = transpose(mat3(viewMatrix)) * vec3(position.x / projectionMatrix[0][0],
          position.y / projectionMatrix[1][1], -1.0);
        gl_Position = vec4(position.xy,1.0,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 zenith;
      uniform vec3 horizon;
      varying vec3 skyRay;
      void main() {
        vec3 direction = normalize(skyRay);
        float height = smoothstep(-0.045, 0.58, direction.y);
        vec3 dusk = mix(horizon, zenith, height);
        float warm = smoothstep(0.22, 1.0, -direction.z) * (1.0 - smoothstep(0.0, 0.37, abs(direction.y - 0.08)));
        gl_FragColor = vec4(dusk + warm * vec3(0.026,0.008,0.008), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const skyMesh = new Mesh(geometry, skyMaterial);
  skyMesh.name = 'Twilight sky';
  skyMesh.frustumCulled = false;
  // Far depth shades only sky pixels, behind opaque geometry and before transparent particles.
  skyMesh.renderOrder = 100;
  scene.add(skyMesh);
  const fog = rig.fog!;
  const reflection = { rose: 0, gold: 0, streaks: 0 };
  const appearance = { exposure: 0, veinEmissive: 1 };
  function mixColor(dest: Color, key: 'sky' | 'horizon' | 'fog' | 'deepWater', w: readonly number[]) {
    const a = palette[0][key], b = palette[1][key], c = palette[2][key];
    dest.setRGB(a.r*w[0]+b.r*w[1]+c.r*w[2], a.g*w[0]+b.g*w[1]+c.g*w[2], a.b*w[0]+b.b*w[1]+c.b*w[2]);
  }
  return {
    horizon, deepWater, reflection,
    update(w: readonly number[]) {
      const [a,b,c] = palette;
      const weighted = (x: number, y: number, z: number) => x*w[0]+y*w[1]+z*w[2];
      mixColor(sky,'sky',w);
      mixColor(horizon,'horizon',w);
      mixColor(deepWater,'deepWater',w);
      mixColor(fog.color,'fog',w);
      rig.ambient.color.setRGB(weighted(a.ambient[0],b.ambient[0],c.ambient[0]),
        weighted(a.ambient[1],b.ambient[1],c.ambient[1]),weighted(a.ambient[2],b.ambient[2],c.ambient[2]));
      rig.ambient.intensity = weighted(a.ambientPower,b.ambientPower,c.ambientPower);
      for (let i = 0; i < rig.directionals.length; i++) {
        const [xp,x] = a.lights[i], [yp,y] = b.lights[i], [zp,z] = c.lights[i];
        rig.directionals[i].intensity = weighted(xp,yp,zp);
        rig.directionals[i].color.setRGB(weighted(x[0],y[0],z[0]),weighted(x[1],y[1],z[1]),weighted(x[2],y[2],z[2]));
      }
      fog.density = weighted(a.fogDensity,b.fogDensity,c.fogDensity);
      reflection.rose = weighted(a.rose,b.rose,c.rose);
      reflection.gold = weighted(a.gold,b.gold,c.gold);
      reflection.streaks = weighted(a.streaks,b.streaks,c.streaks);
      appearance.exposure = weighted(a.exposure,b.exposure,c.exposure);
      appearance.veinEmissive = weighted(a.veinEmissive,b.veinEmissive,c.veinEmissive);
      return appearance;
    },
    dispose() {
      skyMesh.removeFromParent();
      geometry.dispose();
      skyMaterial.dispose();
    },
  };
}

export function addR18WarmFill(parent: Object3D, profile: Profile) {
  const fill = new PointLight('#ffd097', profile === 'quality' ? 48 : 38, 20, 1.5);
  fill.position.set(-3, 4.5, 4.5);
  parent.add(fill);
  return fill;
}

/** Binds only the verified, named gold material. Must run after loadSakura's source checks. */
export function bindGoldEmphasis(root: Object3D) {
  const name = 'Golden_bark_veins';
  const originals = new Map<Mesh, Material | Material[]>();
  const copies = new Map<MeshStandardMaterial, MeshStandardMaterial>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const original = object.material;
    const materials = Array.isArray(original) ? original : [original];
    if (!materials.some(material => material instanceof MeshStandardMaterial && material.name === name)) return;
    const replacement = materials.map(material => {
      if (!(material instanceof MeshStandardMaterial) || material.name !== name) return material;
      const copy = copies.get(material) ?? material.clone();
      copies.set(material, copy);
      return copy;
    });
    originals.set(object, original);
    object.material = Array.isArray(original) ? replacement : replacement[0];
  });
  return {
    report: { name, clones: copies.size, meshes: originals.size },
    update(multiplier: number) {
      for (const [base, copy] of copies) copy.emissiveIntensity = base.emissiveIntensity * multiplier;
    },
    dispose() {
      for (const [mesh, original] of originals) mesh.material = original;
      for (const copy of copies.values()) copy.dispose();
      originals.clear();
      copies.clear();
    },
  };
}
