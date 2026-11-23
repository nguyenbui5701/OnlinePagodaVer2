#!/usr/bin/env python3
"""R17 independent zero-cost Blender authoring and A/B Cycles runner.

Inputs: SHA-pinned R16 QUALITY/ECO GLB2 from PR #1, no geometry built from
screenshots. Run locally with Blender 4.5+, not in the AI worker environment.
All four R16 source art files and other PR branches remain READ-ONLY.
The script generates new R17 meshes, GLBs, editable .blend and genuine Cycles.
"""
import argparse
import bisect
import hashlib
import json
import math
import random
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

SCRIPT = Path(__file__).resolve()
REPO = SCRIPT.parents[4]
OUT = SCRIPT.parent
R16 = REPO / "Assets3D" / "Review" / "sakura_hero" / "r16"
BASELINES = {
    "quality": {
        "file": "sakura_hero.glb", "sha": "c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c",
        "bytes": 5055232, "triangles": 191288, "extraFlowers": 1200, "capTris": 250000, "seed": 17117,
    },
    "eco": {
        "file": "sakura_hero_eco.glb", "sha": "accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173",
        "bytes": 1393492, "triangles": 44412, "extraFlowers": 420, "capTris": 60000, "seed": 17118,
    },
}
OUTPUTS = {"quality": "sakura_hero_r17.glb", "eco": "sakura_hero_r17_eco.glb"}
VIEWS = {
    "hero_full_9x16": ((24.641505854426047,38.825045790301786,54.139118204520734),(.15,12.4,0),(0,1,0),50),
    "hero_wide_water_9x16": ((0,10,44),(0,9.5,0),(0,1,0),58),
    "hero_top_ring_9x16": ((18,34,40),(1,7,12),(0,1,0),62),
    "under_crown_9x16": ((3,4.8,18.5),(0,11.9,0),(0,1,0),44),
    "trunk_fork_9x16": ((4.8,4,11.5),(0,6.6,0),(0,1,0),56),
    "crown_close_9x16": ((3,54,10),(0,13.5,0),(0,0,-1),50),
}
LIGHTS = (
    ("R10_Key",(22,40,26),2.1,(1,.84,.82),.12),
    ("R10_Rim",(-18,23,-15),1.05,(1,.76,.89),.17),
    ("R10_LowerFill",(6,3,18),.72,(1,.74,.83),.32),
)

def checksum(path):
    digest=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            digest.update(chunk)
    return digest.hexdigest()

def audit_glb(path):
    raw=path.read_bytes()
    if len(raw)<20: raise RuntimeError("INVALID_GLB_SHORT "+str(path))
    magic,version,length=struct.unpack_from("<4sII",raw,0)
    if magic!=b"glTF" or version!=2 or length!=len(raw):
        raise RuntimeError("GLB2_HEADER_OR_LENGTH_BAD "+str(path))
    json_length,json_type=struct.unpack_from("<II",raw,12)
    if json_type!=0x4E4F534A: raise RuntimeError("MISSING_JSON_CHUNK "+str(path))
    model=json.loads(raw[20:20+json_length].decode("utf-8"))
    tris=0
    for mesh in model.get("meshes",[]):
        for prim in mesh.get("primitives",[]):
            if prim.get("mode",4)!=4: raise RuntimeError("NON_TRIANGLES "+str(path))
            at=prim.get("indices")
            position=prim.get("attributes",{}).get("POSITION")
            if position is None: raise RuntimeError("NO_POSITION_ATTRIBUTE "+str(path))
            count=model["accessors"][at if at is not None else position]["count"]
            if count%3: raise RuntimeError("NON_TRIANGULAR_PRIMITIVE "+str(path))
            tris+=count//3
    return {
        "sha256":hashlib.sha256(raw).hexdigest(),
        "bytes":len(raw),"triangles":tris,
        "meshes":len(model.get("meshes",[])),
        "materials":len(model.get("materials",[])),
        "textures":len(model.get("textures",[])),
        "images":len(model.get("images",[])),
        "animations":len(model.get("animations",[])),
        "cameras":len(model.get("cameras",[])),
    }

def verify_r16():
    source={}
    for lod,reference in BASELINES.items():
        p=R16/reference["file"]
        if not p.is_file():
            raise RuntimeError("R17_SOURCE_BLOCKED_MISSING_R16_GLB "+str(p))
        actual=audit_glb(p)
        for k,v in (("sha256",reference["sha"]),("bytes",reference["bytes"]),("triangles",reference["triangles"])):
            if actual[k]!=v: raise RuntimeError("R17_SOURCE_BLOCKED_R16_"+k.upper()+"_MISMATCH "+lod)
        source[lod]=actual
        print("R17_PINNED_R16_SOURCE_SHA_PASS",lod,actual["bytes"],actual["triangles"],actual["sha256"],flush=True)
    return source

def load_original(lod):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    p=R16/BASELINES[lod]["file"]
    bpy.ops.import_scene.gltf(filepath=str(p))
    bpy.context.view_layer.update()
    objects=list(bpy.context.scene.objects)
    meshes=[o for o in objects if o.type=="MESH"]
    if len(meshes)<2: raise RuntimeError("R17_SOURCE_BLOCKED_NOT_IMPORTED "+lod)
    return objects,meshes

def candidate_crown(meshes):
    """Sample actual original R16 world-space crown faces (not invented root/branch coords)."""
    choices=[]
    weighted=[]
    total=0.0
    for o in sorted(meshes,key=lambda item:item.name):
        world=o.matrix_world
        slots=list(o.material_slots)
        for poly in o.data.polygons:
            if poly.material_index>=len(slots): continue
            mat=slots[poly.material_index].material
            if mat is None or not (mat.name.startswith("Canopy_") or mat.name.startswith("Sakura_petal_")):
                continue
            p=world @ poly.center
            radius=math.hypot(p.x,p.y)
            if not (13.0<p.z<27.5 and 2.1<radius<15.5):
                continue
            weight=math.sqrt(max(poly.area,1e-8))
            total+=weight
            choices.append(p.copy());weighted.append(total)
    if len(choices)<400 or total<=0:
        raise RuntimeError("R17_SOURCE_BLOCKED_NO_REAL_CANOPY_SURFACE; inspect R16 imported geometry")
    return choices,weighted,total

def choose_centers(candidates,weights,total,lod):
    info=BASELINES[lod]
    rng=random.Random(info["seed"])
    count=info["extraFlowers"]
    spacing=.35 if lod=="quality" else .59
    cells={}
    selections=[]
    tries=0
    while len(selections)<count and tries<count*90:
        tries+=1
        i=bisect.bisect_left(weights,rng.random()*total)
        p=candidates[min(i,len(candidates)-1)].copy()
        radial=Vector((p.x,p.y,0))
        if radial.length<.001:continue
        radial.normalize()
        p += radial*rng.uniform(-.22,1.05)
        p.z += rng.uniform(-.58,.84)
        if not(13.25<p.z<27.15):continue
        if p.xy.length<2.45:continue
        cell=(math.floor(p.x/spacing),math.floor(p.y/spacing),math.floor(p.z/spacing))
        near=False
        for x in range(cell[0]-1,cell[0]+2):
            for y in range(cell[1]-1,cell[1]+2):
                for z in range(cell[2]-1,cell[2]+2):
                    for q in cells.get((x,y,z),[]):
                        if (p-q).length<spacing: near=True;break
                    if near:break
                if near:break
            if near:break
        if near:continue
        selections.append((p,rng.uniform(.45,.91),rng.random()*math.tau))
        cells.setdefault(cell,[]).append(p)
    if len(selections)!=count:
        raise RuntimeError("R17_CANOPY_DENSITY_UNACHIEVABLE expected="+str(count)+" actual="+str(len(selections)))
    return selections

def material(name,rgb,rough,emission):
    mat=bpy.data.materials.new(name)
    mat.diffuse_color=(*rgb,1)
    mat.use_nodes=True
    if hasattr(mat, 'use_backface_culling'):
        mat.use_backface_culling=False
    bs=next(n for n in mat.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    bs.inputs["Base Color"].default_value=(*rgb,1)
    bs.inputs["Roughness"].default_value=rough
    bs.inputs["Metallic"].default_value=0.0
    if "Emission Color" in bs.inputs:
        bs.inputs["Emission Color"].default_value=(*rgb,1)
        bs.inputs["Emission Strength"].default_value=emission
    return mat

def make_lush_mesh(centers,lod):
    """Cupped 3-D petal sheets with individual normals; bounded triangle delta, no billboards."""
    materials=[
        material("R17_Lush_DeepRose",(.79,.34,.50),.86,.025),
        material("R17_Lush_Blush",(.92,.53,.60),.87,.025),
        material("R17_Lush_Peach",(.94,.65,.55),.89,.017),
        material("R17_Lush_Gold",(.94,.69,.38),.77,.06),
    ]
    rng=random.Random(BASELINES[lod]["seed"]+223)
    vertices=[]
    faces=[]
    mat_indices=[]
    n_petals=5 if lod=="quality" else 4
    def vert(pos):
        vertices.append(tuple(float(x) for x in pos))
        return len(vertices)-1
    def face(triple,mi):
        faces.append(tuple(triple));mat_indices.append(mi)
    for position,size,rotation in centers:
        radial=Vector((position.x,position.y,0))
        radial.normalize()
        normal=(radial*rng.uniform(.5,.95)+Vector((rng.uniform(-.3,.3),rng.uniform(-.3,.3),rng.uniform(.20,.68)))).normalized()
        u=normal.cross(Vector((0,0,1))) if abs(normal.z)<.92 else normal.cross(Vector((0,1,0)))
        u.normalize()
        v=normal.cross(u).normalized()
        tone=rng.randrange(3)
        for j in range(n_petals):
            angle=rotation+j*math.tau/n_petals+rng.uniform(-.055,.055)
            direction=u*math.cos(angle)+v*math.sin(angle)
            tangent=-u*math.sin(angle)+v*math.cos(angle)
            scale=size*rng.uniform(.87,1.08)
            base=position+normal*(.014*scale)
            a=position+direction*(.38*scale)+tangent*(.245*scale)+normal*(.088*scale)
            b=position+direction*(.59*scale)+tangent*(.155*scale)+normal*(.17*scale)
            c=position+direction*(.655*scale)+normal*(.14*scale)
            d=position+direction*(.59*scale)-tangent*(.155*scale)+normal*(.165*scale)
            e=position+direction*(.38*scale)-tangent*(.245*scale)+normal*(.09*scale)
            if lod=="quality":
                ix=[vert(p) for p in (base,a,b,c,d,e)]
                for k in range(1,5): face((ix[0],ix[k],ix[k+1]),tone)
            else:
                ix=[vert(p) for p in (base,a,c,e)]
                face((ix[0],ix[1],ix[2]),tone)
                face((ix[0],ix[2],ix[3]),tone)
        # Original, muted gold center; not luminous wire or a high-contrast blob.
        tip=position+normal*(size*.18)
        gold=[tip,position+u*(size*.085)+normal*(size*.07),
            position+v*(size*.085)+normal*(size*.07),
            position-u*(size*.085)+normal*(size*.07),
            position-v*(size*.085)+normal*(size*.07)]
        gx=[vert(p) for p in gold]
        for k in range(1,5):face((gx[0],gx[k],gx[1+(k%4)]),3)
    mesh=bpy.data.meshes.new("R17_Lush_Cupped_Flower_Mesh_"+lod)
    mesh.from_pydata(vertices,[],faces)
    mesh.update(calc_edges=True)
    if not vertices or not faces:raise RuntimeError("R17_EMPTY_CROWN")
    for mat in materials:mesh.materials.append(mat)
    for p,index in zip(mesh.polygons,mat_indices):p.material_index=index
    ob=bpy.data.objects.new("R17_Lush_Additional_Crown_"+lod,mesh)
    bpy.context.scene.collection.objects.link(ob)
    return ob,len(faces),len(vertices)

def build_profile(lod):
    objs,meshes=load_original(lod)
    candidates,weights,total=candidate_crown(meshes)
    centers=choose_centers(candidates,weights,total,lod)
    crown,added_faces,added_vertices=make_lush_mesh(centers,lod)
    all_meshes=meshes+[crown]
    orig_bounds=[o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
    new_bounds=[o.matrix_world @ Vector(v) for o in all_meshes for v in o.bound_box]
    bottom_original=min(p.z for p in orig_bounds)
    bottom_new=min(p.z for p in new_bounds)
    if abs(bottom_original-bottom_new)>.001:
        raise RuntimeError("R17_WATERLINE_ROOT_CHANGED "+lod)
    # Export original R16 nodes/meshes plus one new real geometry layer.
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs+[crown]:ob.select_set(True)
    if crown.type=="MESH":bpy.context.view_layer.objects.active=crown
    path=OUT/OUTPUTS[lod]
    bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",
                              use_selection=True,export_yup=True,
                              export_cameras=False,export_lights=False,
                              export_animations=False)
    report=audit_glb(path)
    if not (BASELINES[lod]["triangles"]<report["triangles"]<=BASELINES[lod]["capTris"]):
        raise RuntimeError("R17_TRIANGLE_BUDGET_FAILED "+lod+" "+str(report))
    if report["textures"] or report["images"] or report["animations"] or report["cameras"]:
        raise RuntimeError("R17_UNEXPECTED_EXTERNAL_OR_ANIMATED_DATA "+lod)
    print("R17_GLB2_EXPORTED_TECH_STRUCTURE_PASS",lod,report,flush=True)
    return {
        "output":OUTPUTS[lod],"sourceR16":BASELINES[lod]["file"],
        "addedFlowers":len(centers),"addedMeshTriangles":added_faces,
        "addedMeshVertices":added_vertices,
        "sourceCrownCandidateFaces":len(candidates),
        "originalBottomZ":bottom_original,**report,
    }

def to_blender(p):
    x,y,z=p
    return Vector((x,-z,y))

def set_camera(view):
    pos,tar,up,fov=VIEWS[view]
    eye=to_blender(pos);target=to_blender(tar);up=to_blender(up)
    direction=(target-eye).normalized()
    right=direction.cross(up).normalized()
    true_up=right.cross(direction).normalized()
    matrix=Matrix(((right.x,true_up.x,-direction.x),
                   (right.y,true_up.y,-direction.y),
                   (right.z,true_up.z,-direction.z)))
    cam=bpy.data.cameras.new("R17_Matched_"+view)
    obj=bpy.data.objects.new("R17_Matched_"+view,cam)
    bpy.context.scene.collection.objects.link(obj)
    obj.location=eye
    obj.rotation_euler=matrix.to_quaternion().to_euler()
    cam.type="PERSP"
    cam.sensor_fit="VERTICAL"
    cam.angle=math.radians(fov)
    cam.clip_start=.05
    cam.clip_end=500
    bpy.context.scene.camera=obj

def render_setup(glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    scene=bpy.context.scene
    source_meshes=[o for o in scene.objects if o.type=="MESH"]
    if not source_meshes:raise RuntimeError("R17_RENDER_GLB_IMPORT_FAILED "+str(glb))
    scene.render.engine="CYCLES"
    scene.cycles.device="CPU"
    scene.cycles.samples=32
    scene.render.resolution_percentage=100
    scene.render.resolution_x=720
    scene.render.resolution_y=1280
    scene.render.image_settings.file_format="PNG"
    scene.render.film_transparent=False
    scene.view_settings.view_transform="AgX"
    scene.view_settings.look="None"
    scene.view_settings.exposure=0
    world=bpy.data.worlds.new("R16_R17_Matched_Dusk")
    world.use_nodes=True
    bg=world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value=(.69,.47,.60,1)
    bg.inputs["Strength"].default_value=.65
    scene.world=world
    for name,xyz,energy,color,angle in LIGHTS:
        data=bpy.data.lights.new(name,"SUN")
        data.energy=energy;data.color=color;data.angle=angle
        ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob)
        pos=to_blender(xyz);target=to_blender((0,9,0))
        ob.location=pos;ob.rotation_euler=(target-pos).to_track_quat("-Z","Y").to_euler()
    # Water is a render-only neutral dark mirror, never part of the exported GLB.
    # Use identical plane and shader for each R16/R17 matched pair.
    bpy.ops.mesh.primitive_plane_add(size=160,location=(0,0,-.75))
    plane=bpy.context.object;plane.name="R17_AB_RENDER_ONLY_WATER"
    mirror=material("R17_AB_Water_Only",(.045,.058,.10),.19,0.0)
    shader=next(n for n in mirror.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    shader.inputs["Metallic"].default_value=.23
    plane.data.materials.append(mirror)

def capture_ab(source_report):
    gallery=OUT/"R17_Cycles_Evidence"
    gallery.mkdir(exist_ok=True)
    photos=[]
    for lod in ("quality","eco"):
        for iteration,name in (("r16",BASELINES[lod]["file"]),("r17",OUTPUTS[lod])):
            path=(R16/name) if iteration=="r16" else (OUT/name)
            verified=audit_glb(path)
            if iteration=="r16" and verified["sha256"]!=BASELINES[lod]["sha"]:
                raise RuntimeError("R17_AB_R16_CHECKSUM_CHANGED")
            render_setup(path)
            for view in VIEWS:
                set_camera(view)
                image_name=f"{lod}_{iteration}_{view}_cycles.png"
                dest=gallery/image_name
                bpy.context.scene.render.filepath=str(dest)
                bpy.ops.render.render(write_still=True)
                if not dest.is_file() or dest.stat().st_size<100:
                    raise RuntimeError("R17_CYCLES_IMAGE_MISSING "+image_name)
                photos.append({"file":image_name,"lod":lod,"revision":iteration,
                               "camera":view,"bytes":dest.stat().st_size,
                               "sha256":checksum(dest),"width":720,"height":1280,
                               "samples":32,"renderer":"Blender Cycles CPU"})
                print("R17_CYCLES_SAVED",image_name,flush=True)
    if len(photos)!=24:raise RuntimeError("R17_CYCLES_IMAGE_COUNT_EXPECTED_24")
    (gallery/"cycles_manifest.json").write_text(json.dumps(photos,indent=2)+"\n",encoding="utf-8")
    return photos

def save_editable():
    """One editable .blend holds BOTH R17 exported ECO and QUALITY meshes."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for lod in ("quality","eco"):
        before=set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(OUT/OUTPUTS[lod]))
        new=set(bpy.data.objects)-before
        collection=bpy.data.collections.new("R17_"+lod.upper()+"_Editable")
        bpy.context.scene.collection.children.link(collection)
        for ob in new:
            for old in list(ob.users_collection):
                old.objects.unlink(ob)
            collection.objects.link(ob)
            ob.hide_render=(lod=="eco")
    bpy.context.preferences.filepaths.save_version=0
    dest=OUT/"sakura_hero_r17_editable.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(dest))
    if not dest.is_file():raise RuntimeError("R17_EDITABLE_SOURCE_NOT_CREATED")
    return {"name":dest.name,"bytes":dest.stat().st_size,"sha256":checksum(dest)}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--skip-render",action="store_true")
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    args=parser.parse_args(argv)
    OUT.mkdir(parents=True,exist_ok=True)
    sources=verify_r16() # HARD STOP before touching any R17 binaries.
    outcomes={}
    for lod in ("quality","eco"):outcomes[lod]=build_profile(lod)
    blend=save_editable()
    photos=[] if args.skip_render else capture_ab(sources)
    data={
        "status":"R17_LOCAL_BUILD_WITH_NATIVE_CYCLES" if photos else "R17_LOCAL_BUILD_CYCLES_NOT_RUN",
        "sourceArtCommit":"d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9",
        "r16SourceVerified":sources,"r17":outcomes,
        "editableSource":blend,"blenderVersion":bpy.app.version_string,
        "cycles": {"count":len(photos),"samples":32,"originalGlbImport":bool(photos),
                   "manifest":"R17_Cycles_Evidence/cycles_manifest.json" if photos else None},
        "ownerArtGO":"PENDING","gate":"R17_SA_ART_REVIEW_REQUIRED",
        "notProven":["Native Viewer R17 9:16 rings","RTX physical FPS","TikTok LIVE"],
    }
    (OUT/"R17_BUILD_RESULT.json").write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
    print("R17_NATIVE_BUILD_COMPLETE",data["status"],len(photos),"PNG",flush=True)

if __name__=="__main__":main()
