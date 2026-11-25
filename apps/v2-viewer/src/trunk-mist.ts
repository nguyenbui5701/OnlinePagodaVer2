import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Frustum, Matrix4, Vector3, type PerspectiveCamera } from 'three';
import type { Profile } from './asset.ts';
import { environmentFx, richAmbientProfiles } from './fx-profiles.ts';

export function createTrunkMist(tree: Vector3, profile: Profile, pond = false) {
  const { mist: count, mistPixelCap: pixelCap } = (pond ? environmentFx : richAmbientProfiles)[profile];
  const geometry = new BufferGeometry();
  const samples = Array.from({ length: count }, (_, i) => {
    const angle = i * 2.399963;
    const distant = pond && i % 3 === 2;
    const radius = distant ? 26 + i % 5 * 4.6 : 2.2 + (i % 4) * 1.12;
    const height = pond ? (distant ? .30 + i % 4 * .26 : .53 + i % 3 * .47) : .84 + (i % 3) * .62;
    return [Math.sin(angle) * radius, height, Math.cos(angle) * radius];
  });
  geometry.setAttribute('position', new Float32BufferAttribute(samples.flat(), 3));
  const uniforms = { elapsed: { value: 0 }, pixelCap: { value: pixelCap }, giftFade: { value: 1 } };
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, uniforms, defines: pond ? { POND_MIST: 1 } : {},
    vertexShader: `
      uniform float elapsed;
      uniform float pixelCap;
      uniform float giftFade;
      varying float fogAlpha;
      varying float phase;
      void main() {
        phase = position.x * 2.1 + position.z * 1.8;
        vec3 p = position + vec3(.75 * sin(elapsed * .20 + phase), .18 * sin(elapsed * .33 + phase), .62 * cos(elapsed * .18 + phase));
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        float depth = -view.z;
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(6.2 * 640.0 * projectionMatrix[1][1] / max(1.0, depth), 1.0, pixelCap);
        fogAlpha = .22 * smoothstep(3.0, 10.0, depth) * (1.0 - smoothstep(45.0, 88.0, depth));
        #ifdef POND_MIST
          bool farBank = length(position.xz) > 20.0;
          gl_PointSize = min(pixelCap, gl_PointSize * (farBank ? 1.6 : 1.05));
          fogAlpha *= (farBank ? .49 : .79) * giftFade;
        #endif
      }
    `,
    fragmentShader: `
      uniform float elapsed;
      varying float fogAlpha;
      varying float phase;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        vec2 w = vec2(uv.x, uv.y * 2.5);
        float cloud = 1.0 - smoothstep(0.04, 1.0, length(w));
        float bands = .72 + .28 * sin(w.x * 4.2 + w.y * 3.1 + phase + elapsed * .26);
        float alpha = cloud * cloud * bands * fogAlpha;
        if (alpha < .008) discard;
        gl_FragColor = vec4(0.79, 0.62, 0.80, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new Points(geometry, material);
  points.name = 'Low mist at the R16 roots';
  points.position.copy(tree);
  points.frustumCulled = false;
  const frustum = new Frustum();
  const projection = new Matrix4();
  const center = new Vector3();
  return {
    points, count, pixelCap, minCenterY: pond ? .12 : .66, maxCenterY: pond ? 1.65 : 2.26,
    update(seconds: number, foreground = false) {
      uniforms.elapsed.value = seconds;
      uniforms.giftFade.value = foreground ? .52 : 1;
    },
    spatialCount(camera: PerspectiveCamera) {
      frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const t = uniforms.elapsed.value;
      let visible = 0;
      for (const [x,y,z] of samples) {
        const phase = x * 2.1 + z * 1.8;
        center.set(x + .75 * Math.sin(t * .20 + phase), y + .18 * Math.sin(t * .33 + phase),
          z + .62 * Math.cos(t * .18 + phase)).add(tree);
        if (frustum.containsPoint(center)) visible++;
      }
      return visible;
    },
    dispose() { points.removeFromParent(); geometry.dispose(); material.dispose(); },
  };
}
