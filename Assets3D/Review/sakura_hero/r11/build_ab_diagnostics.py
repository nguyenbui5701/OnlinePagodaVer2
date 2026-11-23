"""Controlled native-glTF material/geometry A/B of R10 and R11 (zero-cost)."""
from pathlib import Path
import trimesh,hashlib,json
ROOT=Path(__file__).resolve().parent; OLD=ROOT.parent/'r10'

def mats(path):
 scene=trimesh.load(path,force='scene')
 return {g.visual.material.name:g.visual.material for g in scene.geometry.values()}

old=mats(OLD/'sakura_hero.glb'); new=mats(ROOT/'sakura_hero.glb')
assert old.keys()==new.keys(),(old.keys(),new.keys())

def build(source,donor,out,apply_color=True,apply_emission=True):
 scene=trimesh.load(source,force='scene')
 for g in scene.geometry.values():
  mat=g.visual.material; src=donor[mat.name]
  if apply_color:mat.baseColorFactor=src.baseColorFactor.copy()
  if apply_emission:mat.emissiveFactor=src.emissiveFactor.copy() if src.emissiveFactor is not None else None
  mat.metallicFactor=src.metallicFactor; mat.roughnessFactor=src.roughnessFactor
  mat.doubleSided=src.doubleSided
 data=trimesh.exchange.gltf.export_glb(scene)
 out.write_bytes(data)
 print(out.name,'bytes',len(data),'SHA256',hashlib.sha256(data).hexdigest(),'triangles',sum(len(g.faces) for g in scene.geometry.values()))

build(OLD/'sakura_hero.glb',new,ROOT/'r10_palette_only.glb')
build(ROOT/'sakura_hero.glb',old,ROOT/'r11_geometry_only.glb')

build(OLD/'sakura_hero.glb',new,ROOT/'r10_emissive_only.glb',apply_color=False)
build(OLD/'sakura_hero.glb',new,ROOT/'r10_albedo_only.glb',apply_emission=False)
