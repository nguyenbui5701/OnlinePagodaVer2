import { Box3, Frustum, Matrix4, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { habitat, koiEnvelope } from '../src/koi-path.ts';

function worldGeometry(mesh, matrix) {
  const attr = mesh.geometry.attributes.position;
  return Array.from({ length: attr.count }, (_, i) => new Vector3().fromBufferAttribute(attr, i).applyMatrix4(matrix));
}

// Clip each indexed triangle against the top of the swept fish slab. All remaining
// points below this plane are included, even those deeper than the fish can reach.
// Horizontal norm is convex, so its maximum over each clipped polygon is at a vertex.
export function submergedRadius(mesh, vertices, origin, upperY) {
  const index = mesh.geometry.index;
  const length = index?.count ?? vertices.length;
  let far = 0;
  let crossingEdges = 0;
  const radial = point => Math.hypot(point.x - origin.x, point.z - origin.z);
  for (let i = 0; i < length; i += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const a = vertices[index ? index.getX(i + corner) : i + corner];
      if (a.y > upperY) continue;
      far = Math.max(far, radial(a));
      for (const offset of [1, 2]) {
        const next = i + ((corner + offset) % 3);
        const b = vertices[index ? index.getX(next) : next];
        if (b.y <= upperY) continue;
        const t = (upperY - a.y) / (b.y - a.y);
        far = Math.max(far, Math.hypot(a.x + (b.x - a.x) * t - origin.x, a.z + (b.z - a.z) * t - origin.z));
        crossingEdges++;
      }
    }
  }
  return { far, crossingEdges };
}

function spans() {
  return {
    count: 0, minY: Infinity, maxY: -Infinity, minRadius: Infinity, maxRadius: 0,
    minYMatrix: null, minRadiusMatrix: null, componentAtMinY: null,
  };
}

export function installProbe() {
  const { pins, fault } = window.b9ProbeConfig;
  const parsed = [];
  const parserCalls = [];
  const sourceForGeometry = new Map();
  let scene;
  let setAllInstances = false;
  const update = Object3D.prototype.updateMatrixWorld;
  Object3D.prototype.updateMatrixWorld = function (force) {
    const result = update.call(this, force);
    if (this.isScene) scene = this;
    return result;
  };
  const intersects = Frustum.prototype.intersectsSphere;
  Frustum.prototype.intersectsSphere = function (sphere) {
    return setAllInstances || intersects.call(this, sphere);
  };
  const parse = GLTFLoader.prototype.parseAsync;
  GLTFLoader.prototype.parseAsync = async function (data, path) {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), byte =>
      byte.toString(16).padStart(2, '0')).join('');
    const pin = pins[hash];
    if (!pin) throw new Error('Unrecognized parsed SHA-256 ' + hash);
    const call = { ...pin, sha256: hash, bytes: data.byteLength };
    parserCalls.push(call);
    let gltf;
    try {
      if (fault?.kind === 'parser' && pin.kind === 'sanke') {
        // Hash verification has completed on approved bytes. Only the isolated parser
        // call sees this truncated copy; the fixture never changes staged pins or files.
        call.parserInputBytes = 12;
        gltf = await parse.call(this, data.slice(0, call.parserInputBytes), path);
      } else gltf = await parse.call(this, data, path);
      call.parsed = true;
    } catch (error) {
      call.parserError = String(error);
      throw error;
    }

    const counted = new Map();
    function monitor(obj, kind) {
      if (counted.has(obj)) return;
      const counter = { kind, calls: 0 };
      counted.set(obj, counter);
      if (kind === 'skeleton') {
        const dispose = obj.dispose;
        obj.dispose = function () {
          counter.calls++;
          dispose.call(this);
        };
      } else obj.addEventListener('dispose', () => counter.calls++);
    }
    gltf.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      monitor(mesh.geometry, 'geometry');
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) monitor(material, 'material');
      if (mesh.isSkinnedMesh) monitor(mesh.skeleton, 'skeleton');
      sourceForGeometry.set(mesh.geometry, pin.kind);
    });
    parsed.push({ pin, root: gltf.scene, counted });
    if (fault?.kind === 'structure' && pin.kind === 'sanke') {
      gltf.animations[0].name = 'R1_fixture_incompatible_clip';
      call.structureInjection = gltf.animations[0].name;
    }
    return gltf;
  };

  function measure() {
    const report = window.viewerReport;
    scene.updateMatrixWorld(true);
    const origin = new Vector3().fromArray(report.treeTarget);
    const tracks = report.pond.tracks;
    // Exact continuous extrema of the existing .57 m radial and .048 m depth sinusoids.
    const fish = {
      inner: Math.min(...tracks.map(track => track.radius)) - .57 - koiEnvelope.horizontal,
      outer: Math.max(...tracks.map(track => track.radius)) + .57 + koiEnvelope.horizontal,
      top: origin.y + Math.max(...tracks.map(track => track.depth)) + .048 + koiEnvelope.top,
      bottom: origin.y + Math.min(...tracks.map(track => track.depth)) - .048 - koiEnvelope.bottom,
    };
    const tree = { fullRadialExtent: 0, belowFishTopRadius: 0, crossingEdges: 0, meshCount: 0, binding: [] };
    const pad = {};
    const terrain = { count: 0, nearestAabb: Infinity, nearestMesh: null, modules: [] };
    const instance = new Matrix4();
    const combined = new Matrix4();
    const stemByAsset = new Map();
    scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      const kind = sourceForGeometry.get(mesh.geometry);
      if (!['tree', 'pad', 'bloom', 'bud', 'terrain'].includes(kind)) return;
      for (let i = 0; i < (mesh.isInstancedMesh ? mesh.count : 1); i++) {
        const matrix = mesh.isInstancedMesh ? combined.multiplyMatrices(mesh.matrixWorld, mesh.getMatrixAt(i, instance) ?? instance) : mesh.matrixWorld;
        const points = worldGeometry(mesh, matrix);
        if (kind === 'tree') {
          const { far, crossingEdges } = submergedRadius(mesh, points, origin, fish.top);
          const radial = Math.max(...points.map(p => Math.hypot(p.x - origin.x, p.z - origin.z)));
          tree.fullRadialExtent = Math.max(tree.fullRadialExtent, radial);
          tree.belowFishTopRadius = Math.max(tree.belowFishTopRadius, far);
          tree.crossingEdges += crossingEdges;
          tree.meshCount++;
          tree.binding.push({ mesh: mesh.name, matrix: matrix.toArray(), radiusBelowFishTop: far, crossingEdges });
        } else if (kind === 'terrain') {
          const box = new Box3().setFromPoints(points);
          const x = Math.max(box.min.x - origin.x, origin.x - box.max.x, 0);
          const z = Math.max(box.min.z - origin.z, origin.z - box.max.z, 0);
          const distance = Math.hypot(x, z);
          terrain.count++;
          if (distance < terrain.nearestAabb) {
            terrain.nearestAabb = distance;
            terrain.nearestMesh = mesh.name;
          }
          terrain.modules.push({ name: mesh.name, matrix: matrix.toArray(), nearestAabb: distance, y: [box.min.y, box.max.y] });
        } else {
          const group = kind !== 'pad' ? kind : mesh.parent.name === 'Anonymous lotus community' ? 'anonymousPad' :
            !mesh.isInstancedMesh ? 'realSeatPad' : mesh.name.startsWith('leaf ') ? 'leafInstance' : 'padInstance';
          const out = pad[group] ??= spans();
          out.count++;
          for (const p of points) {
            if (p.y < out.minY) {
              out.minY = p.y;
              out.minYMatrix = matrix.toArray();
              out.componentAtMinY = mesh.name;
            }
            out.maxY = Math.max(out.maxY, p.y);
          }
          // Observe runtime matrix type. Changing altitude, pitch or roll would invalidate
          // the all-seed vertical bound proved below with the authored scale ceilings.
          const m = matrix.elements;
          const yOnly = Math.max(Math.abs(m[1]), Math.abs(m[4]), Math.abs(m[6]), Math.abs(m[9])) < 1e-7;
          const draw = { yOnly, translationY: m[13], scaleY: m[5] };
          const envelope = stemByAsset.get(group);
          stemByAsset.set(group, { yOnly: (envelope?.yOnly ?? true) && draw.yOnly,
            lowestTranslationY: Math.min(envelope?.lowestTranslationY ?? Infinity, draw.translationY),
            highestScaleY: Math.max(envelope?.highestScaleY ?? 0, draw.scaleY) });
        }
      }
    });
    function localMinimum(kind) {
      const source = parsed.find(row => row.pin.kind === kind);
      const box = new Box3();
      source.root.updateMatrixWorld(true);
      source.root.traverse(mesh => {
        if (mesh.isMesh) for (const point of worldGeometry(mesh, mesh.matrixWorld)) box.expandByPoint(point);
      });
      return box.min.y;
    }
    // These are runtime layout rules, not measurements inferred from the selected seed.
    // Static tree and terrain are measured in each loaded revision; padding only assumes
    // the existing Y-only instance layouts and seed-independent vertical scale limits.
    const localMin = Object.fromEntries(['pad', 'bloom', 'bud'].map(kind => [kind, localMinimum(kind)]));
    const acrossSeeds = {
      realSeatPad: .065 + localMin.pad,
      anonymousPad: .065 + localMin.pad,
      padInstance: .065 + Math.min(localMin.pad * .83, localMin.pad * 1.06),
      leafInstance: .024 + Math.min(localMin.pad * .28, localMin.pad * .56),
      bloom: Math.min(localMin.bloom * .76, localMin.bloom * 1.11),
      bud: Math.min(localMin.bud * .76, localMin.bud * 1.11),
    };
    return {
      profile: report.profile, seed: report.seed, actualTree: report.asset.assetRevision, treeFailures: report.asset.failures,
      origin: origin.toArray(), fish, tree, terrain, pad, localMin, acrossSeeds, worldTransforms: Object.fromEntries(stemByAsset),
      margins: { tree: fish.inner - tree.belowFishTopRadius, terrain: terrain.nearestAabb - fish.outer,
        measuredPad: Math.min(...Object.values(pad).map(value => value.minY)) - fish.top,
        allSeedsPad: Math.min(...Object.values(acrossSeeds)) - fish.top,
        surface: -fish.top, floorReference: fish.bottom - (origin.y + habitat.floor), outerReference: habitat.outer - fish.outer },
    };
  }

  window.b9Probe = {
    stepAll(time, pose) {
      setAllInstances = true;
      try {
        window.p08Review.step(time, true, undefined, undefined, undefined, pose);
        return measure();
      } finally { setAllInstances = false; }
    },
    parserCalls: () => parserCalls,
    disposed() {
      return parsed.filter(row => ['kohaku', 'sanke', 'yamabuki', 'terrain'].includes(row.pin.kind)).map(({ pin, counted }) => {
        const counts = {};
        for (const { kind, calls } of counted.values()) {
          const out = counts[kind] ??= { objects: 0, disposed: 0, calls: 0 };
          out.objects++;
          out.disposed += Number(calls > 0);
          out.calls += calls;
        }
        return { ...pin, counts };
      });
    },
  };
}
