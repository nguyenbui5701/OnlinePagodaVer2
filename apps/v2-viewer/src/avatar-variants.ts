import { Mesh, type Material, type Object3D } from 'three';
import type { GLTF, GLTFReference } from 'three/addons/loaders/GLTFLoader.js';
import { outfits, type Outfit } from './avatar-look.ts';

type Mapping = { material: number; variants: number[] };
type VariantJson = {
  extensions?: { KHR_materials_variants?: { variants: { name: string }[] } };
  meshes: { primitives: { material: number; extensions?: { KHR_materials_variants?: { mappings: Mapping[] } } }[] }[];
  materials: { name: string }[];
};

export function outfitMappings(json: VariantJson) {
  const names = json.extensions?.KHR_materials_variants?.variants.map(value => value.name);
  if (JSON.stringify(names) !== JSON.stringify(outfits)) throw new Error('Unexpected KHR_materials_variants list');
  const garments = json.meshes.flatMap((mesh, meshIndex) => mesh.primitives.flatMap((primitive, primitiveIndex) => {
    const mappings = primitive.extensions?.KHR_materials_variants?.mappings;
    if (!mappings) return [];
    const base = json.materials[primitive.material]?.name;
    if (base !== 'ao_ba_ba_top' && base !== 'ao_ba_ba_pants') throw new Error('Variant outside áo bà ba garments');
    const byOutfit = new Map<Outfit, { index: number; name: string }>();
    for (const { variants, material } of mappings) for (const variant of variants) {
      const outfit = outfits[variant], name = json.materials[material]?.name;
      if (!outfit || byOutfit.has(outfit) || name !== `${base}__${outfit}`) throw new Error('Invalid garment mapping');
      byOutfit.set(outfit, { index: material, name });
    }
    if (byOutfit.size !== outfits.length) throw new Error('Incomplete garment mapping');
    return [{ base, meshIndex, primitiveIndex, byOutfit }];
  }));
  if (garments.length !== 2 || new Set(garments.map(garment => garment.base)).size !== 2) {
    throw new Error('Expected one pants and one top primitive with approved variants');
  }
  return garments;
}

export async function loadOutfits(gltf: GLTF, selected: Iterable<Outfit>, signal: AbortSignal) {
  const { parser } = gltf;
  const garments = outfitMappings(parser.json);
  const sourceMeshes = new Map<string, Mesh>();
  const defaults = new Set<Material>();
  gltf.scene.traverse(node => {
    if (!(node instanceof Mesh)) return;
    const ref = parser.associations.get(node) as (GLTFReference & { primitives?: number }) | undefined;
    const garment = garments.find(g => g.meshIndex === ref?.meshes && g.primitiveIndex === ref?.primitives);
    if (garment) sourceMeshes.set(garment.base, node);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) defaults.add(material);
  });
  const owned = new Set<Material>();
  const loaded = new Map<Outfit, Map<string, { material: Material; index: number; name: string }>>();
  const dispose = () => {
    for (const material of owned) material.dispose();
    owned.clear();
  };
  try {
    for (const outfit of new Set(selected)) {
      const materials = new Map<string, { material: Material; index: number; name: string }>();
      for (const garment of garments) {
        const mesh = sourceMeshes.get(garment.base);
        if (!mesh) throw new Error(`Missing loaded garment primitive ${garment.base}`);
        const spec = garment.byOutfit.get(outfit)!;
        const raw: Material = await parser.getDependency('material', spec.index);
        if (!defaults.has(raw)) owned.add(raw);
        signal.throwIfAborted();
        // Match the loader's vertex-attribute flags without changing the source mesh or a shared material.
        const probe = mesh.clone(false);
        probe.material = raw;
        parser.assignFinalMaterial(probe);
        const material = probe.material as Material;
        if (!defaults.has(material)) owned.add(material);
        if (material.name !== spec.name) throw new Error(`Wrong loaded garment material ${material.name}`);
        materials.set(mesh.name, { material, ...spec });
      }
      loaded.set(outfit, materials);
    }
    return {
      apply(actor: Object3D, outfit: Outfit) {
        const materials = loaded.get(outfit);
        if (!materials) throw new Error(`Unloaded outfit ${outfit}`);
        return [...materials].map(([meshName, { material, index, name }]) => {
          const mesh = actor.getObjectByName(meshName);
          if (!(mesh instanceof Mesh)) throw new Error(`Missing cloned garment primitive ${meshName}`);
          mesh.material = material;
          return { mesh: meshName, index, name: mesh.material.name || name };
        });
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
