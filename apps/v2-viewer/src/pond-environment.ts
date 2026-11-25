import { AnimationMixer, Box3, Euler, Frustum, Group, Matrix4, Mesh, MeshStandardMaterial, Sphere, SkinnedMesh, Vector3,
  type AnimationClip, type PerspectiveCamera } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { Profile } from './asset.ts';
import { GlbLoadError, importVerifiedGlb, inspectMeshes } from './verified-glb.ts';
import { environmentAssets } from './live-settings.ts';
import { koiEnvelope, koiPalettes, koiTracks, sampleKoi, type KoiPose } from './koi-path.ts';
import manifest from './environment-b9.json' with { type: 'json' };

type Spec = (typeof manifest.profiles)[keyof typeof manifest.profiles];
const assets = environmentAssets;
const pins = Object.values(manifest.profiles);
const terrainLayers = ['Low_islands', 'Middle_hills', 'Far_ridges'] as const;

function makeSubmerged(material: MeshStandardMaterial) {
  material.transparent = true;
  material.opacity = .95;
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 koiWorld;\n' + shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n koiWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = 'varying vec3 koiWorld;\n' + shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 sight = cameraPosition - koiWorld;
      float elevation = clamp(sight.y / max(length(sight), .01), 0.0, 1.0);
      float depth = max(0.0, -koiWorld.y);
      float clarity = (.40 + .53 * smoothstep(.08, .52, elevation)) * exp(-.34 * depth);
      float sheen = .96 + .04 * sin(koiWorld.x * 1.4 + koiWorld.z * 2.1);
      outgoingLight *= mix(vec3(.62,.67,.81), vec3(.93,.91,1.0), clarity) * sheen;
      diffuseColor.a *= clarity * smoothstep(.07,.25,depth);
      #include <opaque_fragment>
    `);
  };
}

function addDistantHaze(material: MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_fragment>', `
      #ifdef USE_FOG
        float haze = 1.0 - exp(-.000036 * vFogDepth * vFogDepth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * vec3(.92,.90,.96), haze);
      #endif
    `);
  };
}

async function loadAsset(spec: Spec, signal: AbortSignal) {
  const { gltf, bytes, hash } = await importVerifiedGlb('b9', spec, signal, 'assets:b9');
  const root = gltf.scene;
  const resources = inspectMeshes(root);
  function dispose() {
    const skins = root.getObjectsByProperty('isSkinnedMesh', true) as SkinnedMesh[];
    for (const skeleton of new Set(skins.map(mesh => mesh.skeleton))) skeleton.dispose();
    resources.dispose();
  }
  try {
    signal.throwIfAborted();
    const terrain = spec.kind === 'terrain';
    const skins: SkinnedMesh[] = [];
    const meshes: Mesh[] = [];
    root.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = object.receiveShadow = false;
      meshes.push(object);
      if (object instanceof SkinnedMesh) skins.push(object);
      if (!terrain) object.renderOrder = -10;
    });
    const box = new Box3().setFromObject(root, true);
    const bounds = [box.min.toArray(), box.max.toArray()];
    const layerCounts = terrainLayers.map(layer => meshes.filter(mesh => mesh.name.startsWith(layer)).length);
    const clip: AnimationClip | undefined = gltf.animations[0];
    if (resources.triangles !== spec.triangles || resources.meshes !== spec.meshes ||
        resources.materials.size !== spec.materials ||
        (terrain ? skins.length > 0 || gltf.animations.length > 0 || layerCounts.join() !== '9,10,11'
          : skins.length !== 3 || skins.some(mesh => mesh.skeleton.bones.length !== 8) ||
            gltf.animations.length !== 1 || clip?.name !== 'swim_loop' || clip.duration !== 3 ||
            clip.tracks.length !== 8 || clip.tracks.some(track => track.times.length !== 61)) ||
        !bounds.every((point, i) => point.every((value, j) => Math.abs(value - spec.bounds[i][j]) < .006))) {
      throw new GlbLoadError('INTEGRITY', 'B9 runtime structure differs from pinned asset: ' + spec.file);
    }
    for (const material of resources.materials) {
      if (!(material instanceof MeshStandardMaterial)) throw new GlbLoadError('INTEGRITY', 'Unexpected B9 material');
      if (terrain) addDistantHaze(material);
      else makeSubmerged(material);
    }
    return { root, clip, meshes, dispose, receipt: { file: spec.file, bytes, sha256: hash, triangles: resources.triangles,
      bounds, ...(terrain ? { layers: layerCounts } : { clip: 'swim_loop', bones: 8, keys: 61, animatedBounds: 'animatedBounds' in spec && spec.animatedBounds }) } };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function loadEnvironment(profile: Profile, seed: number, tree: Vector3, signal: AbortSignal) {
  const results = await Promise.allSettled(assets.map(id => loadAsset(pins.find(spec =>
    spec.profile === profile && (id === 'terrain' ? spec.kind === id : spec.palette === id))!, signal)));
  const failure = results.findIndex(result => result.status === 'rejected');
  if (failure >= 0 || signal.aborted) {
    for (const result of results) if (result.status === 'fulfilled') result.value.dispose();
    signal.throwIfAborted();
    const { reason } = results[failure] as PromiseRejectedResult;
    console.warn('B9 environment fallback', reason);
    const asset = assets[failure];
    return { status: [asset, reason instanceof GlbLoadError ? reason.code : 'IMPORT'] } as const;
  }
  const sources = results.map(result => (result as PromiseFulfilledResult<Awaited<ReturnType<typeof loadAsset>>>).value);
  const terrain = sources[3];
  const group = new Group();
  group.name = 'B9 pond environment';
  group.position.copy(tree);
  group.add(terrain.root);
  const tracks = koiTracks(profile, seed);
  const rotation = new Euler(0, 0, 0, 'YXZ');
  const projection = new Matrix4();
  const frustum = new Frustum();
  const bubble = new Sphere(new Vector3(), koiEnvelope.horizontal + .05);
  const fish = tracks.map(track => {
    const source = sources[koiPalettes.indexOf(track.palette)];
    const root = clone(source.root);
    const mixer = new AnimationMixer(root);
    mixer.clipAction(source.clip!).play();
    const skeletons = new Set<SkinnedMesh['skeleton']>();
    root.traverse(object => {
      if (object instanceof SkinnedMesh) {
        object.frustumCulled = false;
        skeletons.add(object.skeleton);
      }
    });
    group.add(root);
    return { track, root, mixer, skeletons, pose: {} as KoiPose };
  });
  let disposed = false;
  const scene = {
    group, assets: sources.map(source => source.receipt), tracks,
    update(seconds: number, camera: PerspectiveCamera) {
      frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      let visible = 0;
      for (const item of fish) {
        const { track, root, mixer, pose } = item;
        sampleKoi(track, seconds, pose);
        root.position.set(pose.x, pose.y, pose.z);
        bubble.center.copy(tree).add(root.position);
        root.visible = frustum.intersectsSphere(bubble);
        if (!root.visible) continue;
        root.quaternion.setFromEuler(rotation.set(pose.pitch, pose.yaw, pose.roll));
        root.scale.setScalar(track.scale);
        mixer.setTime(pose.clip);
        visible++;
      }
      return visible;
    },
    inspect(camera: PerspectiveCamera) {
      return {
        fish: fish.map(({ track, root, pose }) => ({ id: track.id, palette: track.palette, ...pose, inFrustum: root.visible })),
        terrainVisible: terrain.meshes.filter(mesh => frustum.intersectsObject(mesh)).length,
        camera: camera.position.toArray(),
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const { mixer, root, skeletons } of fish) {
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
        for (const skeleton of skeletons) skeleton.dispose();
      }
      group.clear();
      for (const source of sources) source.dispose();
    },
  };
  return { status: true, scene } as const;
}
