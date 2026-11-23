import { AnimationMixer, Box3, Group, LoopOnce, Mesh, Object3D, Quaternion, Vector3 } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { AvatarPresentation } from '../../../packages/v2-events/src/protocol.ts';
import { importVerifiedGlb, inspectMeshes } from './verified-glb.ts';
import manifest from './p08-assets.json' with { type: 'json' };
import { communitySlots, heroSlots, ringSlots } from './community-layout.ts';
import { createCommunityBatches } from './community-batches.ts';
import { slotLooks, type AvatarLook, type AvatarModel } from './avatar-look.ts';
import { loadOutfits } from './avatar-variants.ts';
import type { Profile } from './asset.ts';
import actors from './p012d-actors.json' with { type: 'json' };

const expected = manifest.pair;
const tolerance = 1e-5;
const up = new Vector3(0, 1, 0);

function anchor(object: Object3D, name: string) {
  const node = object.getObjectByName(name);
  if (!node) throw new Error(`Thiếu anchor ${name}`);
  return node;
}

async function loadPairAsset(kind: keyof typeof expected | 'female', signal: AbortSignal) {
  const spec = kind === 'female' ? actors.female : expected[kind];
  const { gltf, hash, bytes } = await importVerifiedGlb(kind === 'female' ? 'p012d' : 'p08', spec, signal,
    kind === 'female' ? 'assets:p012d' : 'assets:p08');
  const structure = inspectMeshes(gltf.scene);
  try {
    signal.throwIfAborted();
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
  place: typeof heroSlots[number], tree: Vector3, animate = true,
  appearance?: { look: AvatarLook; outfits: Awaited<ReturnType<typeof loadOutfits>> }) {
  const root = new Group();
  root.name = place.id;
  root.position.fromArray(place.position);
  root.rotation.y = place.yaw;
  const pad = clone(padSource.gltf.scene);
  root.add(pad);
  const padAnchor = anchor(pad, 'PadSeatAnchor');
  const translation = new Vector3().fromArray(expected.pad.padSeatAnchor);
  const padLocal = pad.worldToLocal(padAnchor.getWorldPosition(new Vector3()));
  if (padLocal.distanceTo(translation) > tolerance) throw new Error('PadSeatAnchor không khớp P02');

  const actor = clone(actorSource.gltf.scene);
  const look = appearance && { ...appearance.look, materials: appearance.outfits.apply(actor, appearance.look.variant) };
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
  const mixer = animate ? new AnimationMixer(actor) : undefined;
  const action = mixer?.clipAction(clip).setLoop(LoopOnce, 0);
  if (action) {
    action.clampWhenFinished = true;
    action.play();
  }
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
    root, pad, actor, seatRoot, head, name, fx, fit, facing, breath, look,
    sample(seconds: number) { action?.reset().play(); mixer?.setTime(seconds); },
    dispose() { mixer?.stopAllAction(); mixer?.uncacheRoot(actor); },
  };
}

type Seat = ReturnType<typeof makeSeat>;
export type ActorTarget = { presentation: AvatarPresentation; seat: Seat };

export async function createSeatScene(signal: AbortSignal, tree: Vector3, crowdSeed?: number, diversity?: Profile, rings = false) {
  const kinds = ['pad', 'actor', ...(diversity ? ['female' as const] : [])] as const;
  const results = await Promise.allSettled(kinds.map(kind => loadPairAsset(kind, signal)));
  const loaded = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const seats = new Map<string, Seat>();
  let batches: ReturnType<typeof createCommunityBatches> | undefined;
  const outfits = new Map<AvatarModel, Awaited<ReturnType<typeof loadOutfits>>>();
  const dispose = () => {
    batches?.dispose();
    for (const seat of seats.values()) seat.dispose();
    for (const palette of outfits.values()) palette.dispose();
    for (const source of loaded) source.dispose();
  };
  try {
    const [pad, actor, female] = results.map(result => {
      if (result.status === 'rejected') throw result.reason;
      return result.value;
    });
    signal.throwIfAborted();
    const group = new Group();
    group.name = 'P08 Lotus seats';
    const slots = crowdSeed === undefined ? undefined : (rings ? ringSlots : communitySlots)(crowdSeed, tree.x, tree.z);
    const looks = diversity && slots ? slotLooks(slots.map(slot => slot.id), crowdSeed!, diversity) : undefined;
    if (looks && female) {
      verifyCompatibleRig(actor.gltf, female.gltf);
      for (const [model, source] of [['maleP07b1', actor], ['femaleP05f', female]] as const) {
        const colors = [...looks.values()].filter(look => look.model === model).map(look => look.variant);
        outfits.set(model, await loadOutfits(source.gltf, colors, signal));
      }
    }
    const placeSeat = (place: typeof heroSlots[number], animate: boolean) => {
      const look = looks?.get(place.id);
      const source = look?.model === 'femaleP05f' ? female : actor;
      return makeSeat(pad, source, place, tree, animate, look && { look, outfits: outfits.get(look.model)! });
    };
    for (const place of rings && slots ? slots.slice(0, heroSlots.length) : heroSlots) {
      const seat = placeSeat(place, true);
      seats.set(place.id, seat);
      group.add(seat.root);
    }
    const extra = slots?.slice(heroSlots.length).map(place => placeSeat(place, false));
    if (extra) {
      batches = createCommunityBatches(extra);
      group.add(batches.group);
    }
    const preview = seats.get('seat-1')!;
    let padRadius: number | undefined;
    if (slots) {
      preview.pad.updateWorldMatrix(true, true);
      const point = new Vector3();
      const origin = preview.root.position;
      padRadius = 0;
      preview.pad.traverse(node => {
        if (!(node instanceof Mesh)) return;
        const vertices = node.geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
          point.fromBufferAttribute(vertices, i).applyMatrix4(node.matrixWorld);
          padRadius = Math.max(padRadius!, Math.hypot(point.x - origin.x, point.z - origin.z));
        }
      });
    }
    const materials = new Set();
    group.traverse(node => {
      if (node instanceof Mesh) {
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
      }
    });
    return {
      group, seats, preview, slots, batches, padRadius, materialCount: materials.size,
      report: { pad: pad.report, actor: actor.report },
      diversity: looks && { source: actors.source, female: female.report, batches: batches?.count,
        looks: [...seats.values(), ...extra!].map(seat => ({ slotId: seat.root.name, ...seat.look })) },
      present(avatars: readonly AvatarPresentation[], seconds: number, idle?: number) {
        for (const [id, seat] of seats) {
          seat.root.visible = !!slots || avatars.some(avatar => avatar.visible && avatar.seatId === id) ||
            (id === 'seat-1' && avatars.length === 0);
          if (seat.root.visible) seat.sample(idle ?? seconds % 2);
        }
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

function verifyCompatibleRig(male: Awaited<ReturnType<typeof loadPairAsset>>['gltf'],
  female: Awaited<ReturnType<typeof loadPairAsset>>['gltf']) {
  for (const name of expected.actor.anchors) {
    const a = anchor(male.scene, name), b = anchor(female.scene, name);
    a.updateMatrix(); b.updateMatrix();
    if (!a.matrix.equals(b.matrix) || a.parent?.name !== b.parent?.name) throw new Error(`P05f incompatible anchor ${name}`);
  }
  for (const [index, a] of male.animations.entries()) {
    const b = female.animations[index], left = a.tracks[0], right = b.tracks[0];
    if (a.name !== b.name || a.duration !== 2 || b.duration !== 2 || a.tracks.length !== 1 || b.tracks.length !== 1 ||
      left.name !== 'UpperBodyBreath.position' || left.name !== right.name || left.times.length !== 17 ||
      left.times.length !== right.times.length || left.values.length !== right.values.length ||
      !left.times.every((time, i) => time === right.times[i]) || !left.values.every((value, i) => value === right.values[i])) {
      throw new Error(`P05f incompatible animation ${a.name}`);
    }
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
