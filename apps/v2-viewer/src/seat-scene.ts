import { AnimationMixer, Box3, Group, LoopOnce, Object3D, Quaternion, Vector3 } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { AvatarPresentation } from '../../../packages/v2-events/src/protocol.ts';
import { importVerifiedGlb, inspectMeshes } from './verified-glb.ts';
import manifest from './p08-assets.json' with { type: 'json' };

const expected = manifest.pair;
const tolerance = 1e-5;
const up = new Vector3(0, 1, 0);
const layout = [
  { position: [2, 0.065, 13.5], yaw: 0.14 },
  { position: [-1.4, 0.065, 12.35], yaw: -0.19 },
  { position: [4.8, 0.065, 11.15], yaw: 0.32 },
];

function anchor(object: Object3D, name: string) {
  const node = object.getObjectByName(name);
  if (!node) throw new Error(`Thiếu anchor ${name}`);
  return node;
}

async function loadPairAsset(kind: keyof typeof expected, signal: AbortSignal) {
  const spec = expected[kind];
  const { gltf, hash, bytes } = await importVerifiedGlb('p08', spec, signal);
  const structure = inspectMeshes(gltf.scene);
  try {
    for (const name of spec.anchors) anchor(gltf.scene, name);
    if (structure.meshes !== spec.meshes || gltf.parser.json.materials.length !== spec.materials ||
        ('triangles' in spec && structure.triangles !== spec.triangles) ||
        JSON.stringify(gltf.animations.map(clip => clip.name)) !== JSON.stringify(spec.animations)) {
      throw new Error(`Cấu trúc GLB không khớp manifest: ${spec.file}`);
    }
    const variants = gltf.parser.json.extensions?.KHR_materials_variants?.variants ?? [];
    if (JSON.stringify(variants.map((variant: { name: string }) => variant.name)) !== JSON.stringify(spec.materialVariants)) {
      throw new Error(`Material variants không khớp manifest: ${spec.file}`);
    }
    return { gltf, dispose: structure.dispose, report: {
      assetId: spec.assetId, revision: spec.revision, sha256: hash, bytes,
      meshes: structure.meshes, triangles: structure.triangles, materials: spec.materials,
      usedMaterials: structure.materials.size, materialVariants: spec.materialVariants, animations: spec.animations,
    } };
  } catch (error) {
    structure.dispose();
    throw error;
  }
}

function makeSeat(padSource: Awaited<ReturnType<typeof loadPairAsset>>, actorSource: Awaited<ReturnType<typeof loadPairAsset>>,
  id: string, place: typeof layout[number], tree: Vector3) {
  const root = new Group();
  root.name = id;
  root.position.fromArray(place.position);
  root.rotation.y = place.yaw;
  const pad = clone(padSource.gltf.scene);
  root.add(pad);
  const padAnchor = anchor(pad, 'PadSeatAnchor');
  const translation = new Vector3().fromArray(expected.pad.padSeatAnchor);
  const padLocal = pad.worldToLocal(padAnchor.getWorldPosition(new Vector3()));
  if (padLocal.distanceTo(translation) > tolerance) throw new Error('PadSeatAnchor không khớp P02');

  const actor = clone(actorSource.gltf.scene);
  const seatRoot = anchor(actor, 'SeatRoot');
  if (seatRoot.getWorldPosition(new Vector3()).length() > tolerance) throw new Error('SeatRoot ngoài gốc P07b1');
  padAnchor.add(actor);
  const facing = faceActorTowardTree(actor, seatRoot, tree);
  const head = anchor(actor, 'HeadAnchor');
  const name = anchor(actor, 'NameplateAnchor');
  const fx = anchor(actor, 'FXAnchor');
  const breath = anchor(actor, 'UpperBodyBreath');
  if ([head, name, fx].some(node => node.parent !== breath)) throw new Error('P07b1 animated anchors hierarchy');
  const clip = actorSource.gltf.animations.find(clip => clip.name === 'sit_idle');
  if (!clip || clip.duration !== expected.actor.idleDuration || clip.tracks.length !== 1 ||
      clip.tracks[0].times.length !== expected.actor.idleSamples || !clip.tracks[0].name.startsWith(breath.name + '.')) {
    throw new Error('P07b1 sit_idle không khớp manifest');
  }
  const mixer = new AnimationMixer(actor);
  const action = mixer.clipAction(clip).setLoop(LoopOnce, 0);
  action.clampWhenFinished = true;
  action.play();
  const fit = () => {
    const point = seatRoot.getWorldPosition(new Vector3());
    const box = new Box3().setFromObject(actor, true);
    return {
      seatWorld: point.toArray(), padAnchorWorld: padAnchor.getWorldPosition(new Vector3()).toArray(),
      contactError: point.distanceTo(padAnchor.getWorldPosition(new Vector3())), lowestActorOffset: box.min.y - point.y,
      headWorld: head.getWorldPosition(new Vector3()).toArray(), nameWorld: name.getWorldPosition(new Vector3()).toArray(),
      fxWorld: fx.getWorldPosition(new Vector3()).toArray(), breathScale: breath.scale.toArray(),
    };
  };
  return {
    root, pad, actor, seatRoot, head, name, fx, fit, facing,
    sample(seconds: number) { action.reset().play(); mixer.setTime(seconds); },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(actor); },
  };
}

type Seat = ReturnType<typeof makeSeat>;
export type ActorTarget = { presentation: AvatarPresentation; seat: Seat };

export async function createSeatScene(signal: AbortSignal, tree: Vector3) {
  const results = await Promise.allSettled([loadPairAsset('pad', signal), loadPairAsset('actor', signal)]);
  const loaded = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const seats = new Map<string, Seat>();
  try {
    const [pad, actor] = results.map(result => {
      if (result.status === 'rejected') throw result.reason;
      return result.value;
    });
    signal.throwIfAborted();
    const group = new Group();
    group.name = 'P08 Lotus seats';
    for (const place of layout) {
      const id = `seat-${seats.size + 1}`;
      const seat = makeSeat(pad, actor, id, place, tree);
      seats.set(id, seat);
      group.add(seat.root);
    }
    const preview = seats.get('seat-1')!;
    return {
      group, seats, preview, report: { pad: pad.report, actor: actor.report },
      present(avatars: readonly AvatarPresentation[], seconds: number, idle?: number) {
        for (const [id, seat] of seats) {
          seat.root.visible = avatars.some(avatar => avatar.visible && avatar.seatId === id) ||
            (id === 'seat-1' && avatars.length === 0);
          if (seat.root.visible) seat.sample(idle ?? seconds % 2);
        }
      },
      dispose() {
        for (const seat of seats.values()) seat.dispose();
        for (const source of loaded) source.dispose();
      },
    };
  } catch (error) {
    for (const seat of seats.values()) seat.dispose();
    for (const source of loaded) source.dispose();
    throw error;
  }
}

function horizontal(vector: Vector3) {
  return vector.setY(0).normalize();
}

function forwardOf(root: Object3D) {
  return horizontal(new Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new Quaternion())));
}

function headingError(forward: Vector3, direction: Vector3) {
  return Math.atan2(forward.z * direction.x - forward.x * direction.z, forward.dot(direction));
}

export function faceActorTowardTree(actor: Object3D, seatRoot: Object3D, tree: Vector3) {
  const seat = seatRoot.getWorldPosition(new Vector3());
  const direction = horizontal(tree.clone().sub(seat));
  const before = forwardOf(seatRoot);
  const correction = direction.lengthSq() ? headingError(before, direction) : 0;
  // Premultiply around world +Y expressed in the existing pad parent's axes.
  const axis = up.clone();
  if (actor.parent) axis.applyQuaternion(actor.parent.getWorldQuaternion(new Quaternion()).invert());
  actor.quaternion.premultiply(new Quaternion().setFromAxisAngle(axis, correction));
  const after = forwardOf(seatRoot);
  const degrees = 180 / Math.PI;
  return {
    seat: seat.toArray(), tree: tree.toArray(), desired: direction.toArray(),
    before: before.toArray(), after: after.toArray(),
    beforeErrorDeg: correction * degrees,
    afterErrorDeg: direction.lengthSq() ? headingError(after, direction) * degrees : 0,
  };
}

export function seatPose(seat: Pick<Seat, 'seatRoot' | 'head'>, angle = 0, distance = 5.0, fov = 50) {
  const orientation = seat.seatRoot.getWorldQuaternion(new Quaternion());
  const origin = seat.seatRoot.getWorldPosition(new Vector3());
  const head = seat.head.getWorldPosition(new Vector3());
  const target = origin.clone().lerp(head, 0.49);
  const offset = new Vector3(Math.sin(angle) * distance, 0.48, Math.cos(angle) * distance);
  return { position: target.clone().add(offset.applyQuaternion(orientation)), target, fov };
}
