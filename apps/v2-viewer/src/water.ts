import { Mesh, PlaneGeometry, ShaderMaterial } from 'three';

export function createWater() {
  const material = new ShaderMaterial({
    uniforms: { time: { value: 0 } },
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
      varying vec3 world;
      void main() {
        vec3 eye = normalize(cameraPosition - world);
        float ripple = sin(world.x * 0.72 + world.z * 0.35 + time * 1.4) *
          sin(world.z * 0.88 - time * 1.0);
        float fresnel = pow(1.0 - clamp(eye.y, 0.0, 1.0), 4.0);
        float haze = 1.0 - exp(-0.00011 * pow(distance(world, cameraPosition), 2.0));
        vec3 blue = vec3(0.037, 0.040, 0.083);
        vec3 lilac = vec3(0.30, 0.22, 0.37);
        vec3 color = mix(blue, lilac, fresnel * 0.55 + ripple * 0.045 + 0.06);
        gl_FragColor = vec4(mix(color, lilac, haze), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const geometry = new PlaneGeometry(800, 800);
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, time: material.uniforms.time, dispose: () => { geometry.dispose(); material.dispose(); } };
}
