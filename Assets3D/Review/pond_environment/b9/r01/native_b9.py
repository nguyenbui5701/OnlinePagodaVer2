"""Original B9 native art verification, master and Cycles evidence. Blender 4.5 LTS.
No runtime code; all new files local to this versioned asset directory.
"""
import bpy, sys, json, math, hashlib, struct, random, subprocess, re
from pathlib import Path
from mathutils import Vector
import numpy as np
ROOT=Path(__file__).resolve().parent
E=ROOT/'B9_Cycles_Evidence'
MAN=json.loads((ROOT/'asset_manifest.json').read_text(encoding='utf-8'))
PALETTES=('kohaku','sanke','yamabuki')
PROFILES=('eco','quality')
def require(v,msg):
    if not v: raise RuntimeError('B9_'+msg)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def meta(p):return {'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
def write(p,x):p.write_text(json.dumps(x,indent=2)+'\n',encoding='utf-8')
def verify():
    for row in MAN['files']:
        p=ROOT/row['file'];b=p.read_bytes()
        require(len(b)==row['bytes'] and sha(p)==row['sha256'],'GLB_SHA '+p.name)
        require(hashlib.sha1(('blob '+str(len(b))+'\0').encode()+b).hexdigest()==row['gitBlobSHA'],'GIT_BLOB '+p.name)
        magic,version,n=struct.unpack_from('<III',b);require((magic,version,n)==(0x46546c67,2,len(b)),'GLB_HEADER')
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s=bpy.context.scene;s.render.fps=20;s.render.fps_base=1;s.frame_start=0;s.frame_end=120
    s.unit_settings.system='METRIC';s.unit_settings.scale_length=1
    return s
def source_doc(path):
    b=path.read_bytes()
    n,kind=struct.unpack_from('<II',b,12)
    require(kind==0x4e4f534a and 20+n<=len(b),'GLB_JSON '+path.name)
    return json.loads(b[20:20+n])
def source_name(actual,expected):
    return actual==expected or re.fullmatch(re.escape(expected)+r'\.\d{3,}',actual) is not None
def hierarchy(o):
    result=[]
    while o.parent is not None:
        o=o.parent;result.append(o)
    return result
def describe(o,refs):
    return {'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,
      'collections':[{'name':c.name,'hide_render':c.hide_render,'hide_viewport':c.hide_viewport}
                     for c in o.users_collection],
      'hide_render':o.hide_render,'hide_viewport':o.hide_viewport,
      'materialSlots':len(o.data.materials) if o.type=='MESH' else None,
      'poseBoneCustomShapeRefs':refs.get(o,[])}
def check_source_meshes(objs,doc,row):
    nodes=[n for n in doc['nodes'] if 'mesh' in n]
    require(len(nodes)==row['meshes'] and len({n['name'] for n in nodes})==len(nodes),'SOURCE_NODE_COUNT')
    meshes=[o for o in objs if o.type=='MESH'];arms=[o for o in objs if o.type=='ARMATURE']
    require(len(meshes)==len(nodes),'SOURCE_MESH_COUNT '+row['file'])
    require(len(arms)==(1 if row['kind']=='koi' else 0),'SOURCE_ARMATURE_COUNT '+row['file'])
    require(all(o.type in ('MESH','ARMATURE') or (o.type=='EMPTY' and
      any(source_name(o.name,n.get('name','')) for n in doc['nodes'] if 'mesh' not in n))
      for o in objs),'SOURCE_UNEXPLAINED_OBJECT')
    root=doc['nodes'][doc['scenes'][doc.get('scene',0)]['nodes'][0]]['name']
    used=set();mapping=[]
    for n in nodes:
        candidates=[o for o in meshes if source_name(o.name,n['name'])]
        require(len(candidates)==1 and candidates[0] not in used,'SOURCE_NODE_MAPPING '+n['name'])
        o=candidates[0];used.add(o)
        prims=doc['meshes'][n['mesh']]['primitives']
        require(len(prims)==1 and prims[0].get('mode',4)==4,'SOURCE_PRIMITIVE '+n['name'])
        o.data.calc_loop_triangles()
        expected=doc['accessors'][prims[0]['indices']]['count']//3
        require(len(o.data.loop_triangles)==expected,'SOURCE_NODE_TRIANGLES '+n['name'])
        if 'skin' in n:
            require(len(arms)==1 and any(m.type=='ARMATURE' and m.object==arms[0] for m in o.modifiers),
                    'SOURCE_SKIN_BINDING '+n['name'])
            require(arms[0] in hierarchy(o) or any(source_name(a.name,root) for a in hierarchy(o)),
                    'SOURCE_SKIN_HIERARCHY '+n['name'])
        else:
            require(any(source_name(a.name,root) for a in hierarchy(o)),'SOURCE_NODE_HIERARCHY '+n['name'])
        mapping.append({'sourceNode':n['name'],'object':o.name,'triangles':expected})
    require(set(meshes)==used,'SOURCE_UNEXPLAINED_MESH')
    return mapping
def import_model(path,name,parent=None):
    before=set(bpy.data.objects)
    result=bpy.ops.import_scene.gltf(filepath=str(path))
    require('FINISHED' in result,'IMPORT_OPERATOR '+name)
    objs=set(bpy.data.objects)-before;require(bool(objs),'IMPORT_EMPTY '+name)
    doc=source_doc(path)
    source_names=[n.get('name','') for n in doc['nodes'] if 'mesh' in n]
    refs={}
    for arm in (o for o in objs if o.type=='ARMATURE'):
        for bone in arm.pose.bones:
            if bone.custom_shape is not None:
                refs.setdefault(bone.custom_shape,[]).append(arm.name+'/'+bone.name)
    print('B9_IMPORT_OBJECTS '+json.dumps({'file':path.name,'sourceMeshNodes':source_names,
      'objects':[describe(o,refs) for o in sorted(objs,key=lambda o:o.name)]}),flush=True)
    helpers=set()
    for o in refs:
        # Keep proven custom shapes in their original non-rendering collection.
        require(o.type=='MESH' and o.parent is None and not o.children and
                not any(source_name(o.name,n) for n in source_names if n) and
                len(o.users_collection)==1 and o.users_collection[0].name=='glTF_not_exported' and
                all(c.hide_render and c.hide_viewport for c in o.users_collection),
                'CUSTOM_SHAPE_UNPROVEN '+o.name)
        helpers.add(o)
    art=objs-helpers
    require(bool(art),'IMPORT_NO_ART '+name)
    require(all(o.parent is None or o.parent in art for o in art),'IMPORT_EXTERNAL_PARENT '+name)
    row=next((x for x in MAN['files'] if path.parent==ROOT and x['file']==path.name),None)
    if row:
        mapping=check_source_meshes(art,doc,row)
        print('B9_SOURCE_MAPPING '+json.dumps({'file':path.name,'meshes':mapping,
          'helpers':[describe(o,refs) for o in sorted(helpers,key=lambda o:o.name)]}),flush=True)
    col=bpy.data.collections.new(name)
    (parent.children if parent else bpy.context.scene.collection.children).link(col)
    for o in art:
        prev=list(o.users_collection);col.objects.link(o)
        for c in prev:c.objects.unlink(o)
    require(not (set(col.all_objects)&helpers),'HELPER_COLLECTION_LEAK')
    require(all(b.custom_shape in helpers for o in art if o.type=='ARMATURE'
                for b in o.pose.bones if b.custom_shape is not None),'HELPER_REFERENCE_LOST')
    bpy.context.view_layer.update()
    return col
def geometry(col,evaluated=False):
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get();points=[];count=0;minimum=float('inf')
    for o in sorted(col.all_objects,key=lambda x:x.name):
        if o.type!='MESH':continue
        ev=o.evaluated_get(dg) if evaluated else o
        m=ev.to_mesh() if evaluated else o.data
        try:
            m.calc_loop_triangles()
            v=np.asarray([tuple(ev.matrix_world@x.co) for x in m.vertices],dtype=np.float64)
            f=np.asarray([tuple(x.vertices) for x in m.loop_triangles],dtype=np.int64)
            require(len(f)>0 and np.isfinite(v).all(),'NATIVE_FINITE '+o.name)
            require(all(math.isfinite(n) for x in m.vertices for n in x.normal),'NATIVE_NORMAL '+o.name)
            areas=np.linalg.norm(np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]),axis=1)
            require(np.isfinite(areas).all() and min(areas)>1e-12,'NATIVE_DEGENERATE '+o.name)
            minimum=min(minimum,float(min(areas)));count+=len(f);points.extend(v.tolist())
            require(len(m.materials)>0 and all(x is not None for x in m.materials),'NATIVE_MATERIAL '+o.name)
            require(all(math.isfinite(n) for uv in m.uv_layers for x in uv.data for n in x.uv),'NATIVE_UV '+o.name)
        finally:
            if evaluated:ev.to_mesh_clear()
    require(count>0,'NO_MESH')
    return count,np.asarray(points),minimum
def animation(col,repeat):
    arms=[o for o in col.all_objects if o.type=='ARMATURE'];require(len(arms)==1,'ARMATURE_COUNT')
    arm=arms[0];ad=arm.animation_data;require(ad is not None and len(arm.data.bones)==8,'ANIMATION_RIG')
    tracks=[t for t in ad.nla_tracks if len(t.strips)]
    if not tracks:
        require(ad.action is not None,'MISSING_ACTION')
        action=ad.action;slot=getattr(ad,'action_slot',None);lo,hi=action.frame_range
        ad.action=None;track=ad.nla_tracks.new();strip=track.strips.new(action.name,int(lo),action)
        if slot is not None and hasattr(strip,'action_slot'):strip.action_slot=slot
        tracks=[track]
    require(len(tracks)==1 and len(tracks[0].strips)==1,'CLIP_COUNT')
    t=tracks[0];st=t.strips[0]
    require('swim_loop' in st.action.name or 'swim_loop' in t.name or 'swim_loop' in st.name,'CLIP_NAME')
    # Blender 4.5 glTF importer stashes a locked/muted strip with an explicit action slot.
    # Preserve that slot, activate only the NLA path and unlock the editable track.
    require(st.action_slot is not None,'NLA_ACTION_SLOT')
    ad.action=None;t.mute=False;t.lock=False;st.mute=False
    require(ad.use_nla and not st.use_animated_time and not st.use_reverse,'NLA_EVALUATION_MODE')
    st.repeat=1;st.scale=1
    lo=float(st.frame_start);duration=float(st.action_frame_end-st.action_frame_start)
    require(abs(duration-60)<.01,'CLIP_DURATION '+str(duration))
    st.repeat=repeat
    require(abs(float(st.frame_end)-lo-duration*repeat)<.01,'NLA_REPEAT_RANGE '+str((lo,st.frame_end,repeat)))
    require(abs(float(st.scale)-1)<.0001 and abs(float(st.repeat)-repeat)<.0001,'NLA_REPEAT_SCALE')
    print('B9_NLA '+json.dumps({'armature':arm.name,'action':st.action.name,'slot':st.action_slot.identifier,
      'track':t.name,'start':lo,'end':float(st.frame_end),'period':duration,'repeat':float(st.repeat),
      'scale':float(st.scale),'locked':t.lock}),flush=True)
    return arm,lo,duration
def at(scene,f):scene.frame_set(math.floor(f),subframe=f-math.floor(f));bpy.context.view_layer.update()
def identity():
    return {'sourceSHA256':sha(Path(__file__)),'runnerSHA256':sha(ROOT/'run_b9.ps1'),
      'inputManifestSHA256':sha(ROOT/'asset_manifest.json'),
      'contextPinsSHA256':sha(ROOT/'context_pins.json'),'blenderVersion':bpy.app.version_string}
def require_receipt(name,status):
    p=ROOT/name;require(p.is_file(),'RECEIPT_MISSING '+name)
    v=json.loads(p.read_text(encoding='utf-8'))
    require(v.get('status')==status and v.get('identity')==identity(),'STALE_RECEIPT '+name)
    return v
def focused():
    s=reset()
    row=next(x for x in MAN['files'] if x['file']=='koi_kohaku_eco.glb')
    c=import_model(ROOT/row['file'],'B9_focus')
    tris,p,_=geometry(c);require(tris==row['triangles'],'FOCUS_TRIANGLES')
    arms=[o for o in c.all_objects if o.type=='ARMATURE']
    helpers={b.custom_shape for a in arms for b in a.pose.bones if b.custom_shape is not None}
    require(bool(helpers) and not (helpers&set(c.all_objects)),'FOCUS_HELPER_PROOF')
    body=next(o for o in c.all_objects if o.type=='MESH' and source_name(o.name,'Koi_body'))
    saved=list(body.data.materials);indices=[x.material_index for x in body.data.polygons]
    require(bool(saved),'FOCUS_NEGATIVE_SETUP')
    try:
        body.data.materials.clear()
        try:
            geometry(c)
        except RuntimeError as ex:
            require(str(ex)=='B9_NATIVE_MATERIAL '+body.name,'FOCUS_WRONG_FAILURE '+str(ex))
            print('B9_NEGATIVE_AUTHORED_MATERIAL_PASS '+body.name,flush=True)
        else:
            require(False,'FOCUS_NEGATIVE_NOT_REJECTED')
    finally:
        for m in saved:body.data.materials.append(m)
        for poly,index in zip(body.data.polygons,indices):poly.material_index=index
    require(geometry(c)[0]==tris,'FOCUS_RESTORE')
    arm,start,period=animation(c,2)
    poses=[]
    for i in range(121):
        at(s,start+i);n,q,_=geometry(c,True);require(n==tris,'FOCUS_DEFORM_COUNT');poses.append(q)
    seam=max(float(np.max(np.abs(poses[i]-poses[i+60]))) for i in range(61))
    excursion=float(np.max(np.abs(poses[15]-poses[45])))
    require(seam<.0002 and excursion>.015,'FOCUS_LOOP '+str((seam,excursion)))
    write(ROOT/'focused_validation.json',{'status':'B9_FOCUSED_PASS','identity':identity(),
      'file':row['file'],'triangles':tris,'helperCount':len(helpers),'negativeMaterialRejected':True,
      'seam':seam,'excursion':excursion,'periodFrames':period})
    print('B9_FOCUSED_PASS',flush=True)
def validate_master():
    require_receipt('focused_validation.json','B9_FOCUSED_PASS')
    s=reset();report=[]
    for lod in PROFILES:
        group=bpy.data.collections.new('B9_'+lod.upper()+'_Editable');s.collection.children.link(group)
        for row in [x for x in MAN['files'] if x['lod']==lod]:
            c=import_model(ROOT/row['file'],row['file'].replace('.glb',''),group)
            tris,p,minarea=geometry(c);require(tris==row['triangles'],'TRIANGLE_COUNT '+row['file'])
            # Blender maps GLTF (x,y,z) to (x,-z,y).
            p_gl=np.column_stack([p[:,0],p[:,2],-p[:,1]])
            measured=[p_gl.min(0).tolist(),p_gl.max(0).tolist()]
            require(np.allclose(measured,row['bounds'],atol=.002,rtol=0),'IMPORT_BOUNDS '+row['file'])
            item={'file':row['file'],'triangles':tris,'boundsYUpMeters':measured,'minRestDoubleArea':minarea}
            if row['kind']=='koi':
                arm,start,period=animation(c,2)
                # Evaluate actual NLA over two successive periods, including interpolation.
                sampled=[];min_deformed=float('inf')
                for i in range(121):
                    at(s,start+i);n,p0,ar=geometry(c,True);require(n==tris,'DEFORM_COUNT')
                    sampled.append(p0);min_deformed=min(min_deformed,ar)
                seam=max(float(np.max(np.abs(sampled[i]-sampled[i+60]))) for i in range(61))
                excursion=float(np.max(np.abs(sampled[15]-sampled[45])))
                require(seam<.0002 and excursion>.015,'LOOP_SEAM '+str((seam,excursion)))
                item.update({'clip':'swim_loop','bones':len(arm.data.bones),'durationSeconds':period/20,
                  'twoPeriodsSamples':121,'maxPeriodVertexErrorM':seam,'motionExcursionM':excursion,'minDeformedDoubleArea':min_deformed})
                # Layout for editable master only, all roots offset together, no export.
                shift=(-2+2*PALETTES.index(row['palette']),0,1)
                for o in c.objects:
                    if o.parent is None:o.location+=Vector(shift)
            report.append(item)
        group.hide_render=(lod=='eco');group.hide_viewport=(lod=='eco')
    at(s,0);bpy.context.preferences.filepaths.save_version=0
    dest=ROOT/'b9_editable_master.blend';bpy.ops.wm.save_as_mainfile(filepath=str(dest))
    bpy.ops.wm.open_mainfile(filepath=str(dest))
    for lod in PROFILES:
        g=bpy.data.collections.get('B9_'+lod.upper()+'_Editable')
        require(g is not None and len(g.children)==4,'MASTER_REOPEN '+lod)
        for c in g.children:
            row=next(x for x in MAN['files'] if c.name==x['file'].replace('.glb',''))
            require(geometry(c)[0]==row['triangles'],'MASTER_REOPEN_TRIANGLES '+c.name)
            for arm in (o for o in c.all_objects if o.type=='ARMATURE'):
                require(len(arm.data.bones)==8,'MASTER_REOPEN_RIG')
                for b in arm.pose.bones:
                    helper=b.custom_shape
                    require(helper is not None and helper not in set(c.all_objects) and len(helper.users_collection)==1
                      and helper.users_collection[0].name=='glTF_not_exported'
                      and all(k.hide_render and k.hide_viewport for k in helper.users_collection),'MASTER_REOPEN_HELPER '+b.name)
    write(ROOT/'native_validation.json',{'status':'B9_NATIVE_IMPORT_AND_LOOP_PASS','identity':identity(),'blenderVersion':bpy.app.version_string,'profiles':report,'master':meta(dest),'masterReopened':True,'nativeUV':'No authored UV required: COLOR_0 vertex colors, no textures; finite existing UVs checked'})
    print('B9_NATIVE_IMPORT_AND_LOOP_PASS',flush=True)
# Context is checked from frozen source commits, never written into other branches.
CONTEXT=json.loads((ROOT/'context_pins.json').read_text(encoding='utf-8'))
def context():
    d=ROOT/'_context';d.mkdir(exist_ok=True)
    for x in CONTEXT:
        p=d/x['file']
        if not p.exists():
            b=subprocess.check_output(['git','show',x['commit']+':'+x['path']],cwd=ROOT)
            require(len(b)==x['bytes'] and hashlib.sha256(b).hexdigest()==x['sha256'],'CONTEXT_SHA '+x['file'])
            p.write_bytes(b)
        require(p.stat().st_size==x['bytes'] and sha(p)==x['sha256'],'CONTEXT_SHA '+x['file'])
    return d
def coords(v):return Vector((v[0],-v[2],v[1]))
def place(col,xyz,yaw=0,scale=1):
    e=bpy.data.objects.new(col.name+'_placement',None);bpy.context.scene.collection.objects.link(e)
    for o in col.objects:
        if o.parent is None:o.parent=e
    e.location=coords(xyz);e.rotation_euler.z=yaw;e.scale=(scale,)*3
    return e
def instance(col,xyz,yaw=0,scale=1):
    e=bpy.data.objects.new(col.name+'_instance',None);bpy.context.scene.collection.objects.link(e)
    e.instance_type='COLLECTION';e.instance_collection=col;e.location=coords(xyz);e.rotation_euler.z=yaw;e.scale=(scale,)*3
    return e
def sun(name,xyz,target,power,color):
    l=bpy.data.lights.new(name,'SUN');l.energy=power;l.color=color;l.angle=.18
    o=bpy.data.objects.new(name,l);bpy.context.scene.collection.objects.link(o);o.location=coords(xyz)
    o.rotation_euler=(coords(target)-o.location).to_track_quat('-Z','Y').to_euler()
def setup(s):
    s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True;s.cycles.seed=9
    s.cycles.max_bounces=6;s.cycles.transparent_max_bounces=8
    s.render.resolution_x=720;s.render.resolution_y=1280;s.render.resolution_percentage=100
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB'
    s.world=bpy.data.worlds.new('Twilight art proxy');s.world.use_nodes=True
    bg=s.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.24,.155,.32,1);bg.inputs['Strength'].default_value=.75
    s.view_settings.view_transform='AgX';s.view_settings.look='None';s.view_settings.exposure=0
    sun('Rose rim',(-30,40,-25),(0,4,0),1.9,(1,.55,.68));sun('Soft violet fill',(20,38,30),(0,4,0),1.2,(.75,.82,1))
    sun('Warm low fill',(6,8,25),(0,4,0),.65,(1,.76,.49))
def water():
    # Art-only thin transparent surface, not the opaque B8 shader.
    bpy.ops.mesh.primitive_plane_add(size=800,location=(0,0,0));o=bpy.context.object;o.name='Water_ART_PROXY'
    m=bpy.data.materials.new('Thin translucent violet water (offline proxy)');m.use_nodes=True
    nt=m.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');mix=nt.nodes.new('ShaderNodeMixShader')
    tr=nt.nodes.new('ShaderNodeBsdfTransparent');tr.inputs[0].default_value=(.77,.81,.93,1)
    bs=nt.nodes.new('ShaderNodeBsdfPrincipled');bs.inputs['Base Color'].default_value=(.035,.026,.095,1);bs.inputs['Roughness'].default_value=.22
    tex=nt.nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=1.3;tex.inputs['Detail'].default_value=2
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.05
    nt.links.new(tex.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    mix.inputs[0].default_value=.28;nt.links.new(tr.outputs[0],mix.inputs[1]);nt.links.new(bs.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs[0]);o.data.materials.append(m)
    bpy.ops.mesh.primitive_plane_add(size=800,location=(0,0,-1.8));floor=bpy.context.object;floor.name='Pond bed ART_PROXY'
    mat=bpy.data.materials.new('Deep purple pond bed');mat.diffuse_color=(.035,.027,.072,1);floor.data.materials.append(mat)
def camera(s,xyz,target,fov):
    data=bpy.data.cameras.new('Matched offline camera');data.sensor_fit='VERTICAL';data.sensor_height=36
    data.lens=18/math.tan(math.radians(fov)/2);data.clip_start=.05;data.clip_end=500
    o=bpy.data.objects.new('Matched offline camera',data);s.collection.objects.link(o);o.location=coords(xyz)
    o.rotation_euler=(coords(target)-o.location).to_track_quat('-Z','Y').to_euler();s.camera=o
    return {'positionYUp':xyz,'targetYUp':target,'verticalFovDegrees':fov,'lensMM':data.lens}
def render(s,lod,view,xyz,target,fov,frame,rows):
    cam=camera(s,xyz,target,fov);at(s,frame)
    p=E/(lod+'_'+view+'.png');s.render.filepath=str(p)
    identity={'lod':lod,'view':view,'camera':cam,'frame':frame,'samples':32,'sourceSHA256':sha(Path(__file__)),'inputManifestSHA256':sha(ROOT/'asset_manifest.json'),'contextPinsSHA256':sha(ROOT/'context_pins.json')}
    checkpoint=E/(p.stem+'.receipt.json')
    prior=json.loads(checkpoint.read_text(encoding='utf-8')) if checkpoint.exists() else None
    if not (prior and prior.get('identity')==identity and p.exists() and sha(p)==prior.get('sha256')):
        bpy.ops.render.render(write_still=True)
        write(checkpoint,{'identity':identity,'sha256':sha(p)})
    h=p.read_bytes()[:24];require(h[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',h[16:24])==(720,1280),'PNG')
    rows.append({**meta(p),'lod':lod,'view':view,'camera':cam,'frame':frame,'samples':32,'engine':'Blender Cycles','resolution':[720,1280]})
    print('B9_CYCLES_FRAME_PASS',p.name,flush=True)
def habitat(lod,d,rows):
    s=reset();setup(s);water()
    import_model(d/('tree_'+lod+'.glb'),'Immutable_R18a_context')
    import_model(ROOT/('distant_terrain_'+lod+'.glb'),'B9_terrain')
    # Shared source collections for approved lotus GLBs; not new authored assets.
    templates={}
    for kind in ('pad','bloom','bud'):
        f='lotus_pad_01.glb' if kind=='pad' else 'lotus_'+kind+'_p012b_'+lod+'.glb'
        c=import_model(d/f,'Context_'+kind);s.collection.children.unlink(c);templates[kind]=c
    rng=random.Random(9);occupied=[];placements=[]
    def put(kind,x,z,r,scale,y):
        instance(templates['pad' if kind=='leaf' else kind],(x,y,z),rng.random()*math.tau,scale)
        occupied.append((x,z,r));placements.append({'kind':kind,'position':[x,y,z],'radius':r,'scale':scale})
    turn=(9/100-.5)*.18
    angles=[0,-.85,.85,-2.25,2.25]+[(i+.5)*math.tau/7 for i in range(7)]
    for i,a in enumerate(angles):
        rad=13.8 if i<5 else 20.2;put('pad',math.sin(a+turn)*rad,math.cos(a+turn)*rad,1.1,1,.065)
    # Art-only representative fish slots in open water, exclude reserved seat disks.
    fish=[]
    for x,z in [(-4,28),(4,28),(-10,24),(10,25),(-14,15),(14,16),(-6,36),(6,37),(-18,26),(18,28),(-22,8),(22,8),(9,-25),(-9,-25),(-25,-7),(25,-7)]:
        if math.hypot(x,z)<8.5 or any(math.hypot(x-a,z-b)<r+2 for a,b,r in occupied):continue
        fish.append((x,z))
    fish=fish[:(6 if lod=='eco' else 12)];require(len(fish)==(6 if lod=='eco' else 12),'FISH_SLOT_COUNT')
    targets={'pad':18,'leaf':52,'bloom':23,'bud':16} if lod=='eco' else {'pad':52,'leaf':120,'bloom':56,'bud':40}
    for kind,total in targets.items():
        count=0
        for attempt in range(12000):
            if count==total:break
            a=rng.random()*math.tau;rad=rng.uniform(8.8,33.0);x=math.sin(a)*rad;z=math.cos(a)*rad
            scale=rng.uniform(.83,1.06) if kind=='pad' else rng.uniform(.28,.56) if kind=='leaf' else rng.uniform(.76,1.11)
            rr=(1.05 if kind in ('pad','leaf') else .54 if kind=='bloom' else .21)*scale
            if any(math.hypot(x-u,z-v)<rr+r+.22 for u,v,r in occupied) or any(math.hypot(x-u,z-v)<rr+1.8 for u,v in fish):continue
            if any(math.hypot(x-u,z-v)<rr+6.25 for u,v,_ in occupied[:3]):continue
            put(kind,x,z,rr,scale,.065 if kind=='pad' else .024 if kind=='leaf' else 0);count+=1
        require(count==total,'CONTEXT_PLACEMENT '+kind)
    for i,(x,z) in enumerate(fish):
        c=import_model(ROOT/('koi_'+PALETTES[i%3]+'_'+lod+'.glb'),'HabitatKoi_'+str(i))
        animation(c,2);scale=.67+.13*(i%3);depth=-.42-.075*(i%3)
        place(c,(x,depth,z),.6+i*1.74,scale)
    views=[('aerial',(19,43,32),(0,10,0),54),('wide',(0,10,44),(0,9.5,0),58),('under_tree',(8,3.4,24),(0,6.2,1.8),55),('branch_close',(3,4.8,18.5),(0,11.9,0),44),('low_water',(10,2.25,30),(2,1.15,13),53),('seat_gift_proxy',(-2.13745,1.14939,8.87026),(-1.01607,.66939,13.74289),50)]
    for view,p,t,f in views:render(s,lod,view,p,t,f,15,rows)
    return {'profile':lod,'fishCentersYUpXZ':fish,'contextLotus':placements,'note':'Representative seed9 art-only layout using approved meshes, NOT exact runtime generated positions; 3 reserved seat pads and 9 decorative pad proxies without actors/labels; no runtime clearance or visibility certification.'}
def closeups(lod,rows):
    s=reset();setup(s)
    for i,p in enumerate(PALETTES):
        c=import_model(ROOT/('koi_'+p+'_'+lod+'.glb'),'Close_'+p)
        animation(c,2);place(c,(0,0,(i-1)*1.55),math.pi/2)
    # Three fish lie parallel in the vertical composition, real models and animation.
    for frame in (0,15,30,45,60):
        render(s,lod,'swim_'+str(frame).zfill(3),(0,6.9,0.8),(0,0,0),43,frame,rows)
def main():
    verify();E.mkdir(exist_ok=True)
    print('B9_NATIVE_IDENTITY '+json.dumps(identity()),flush=True)
    if '--focused-only' in sys.argv:
        if (ROOT/'focused_validation.json').exists():
            require_receipt('focused_validation.json','B9_FOCUSED_PASS');print('B9_FOCUSED_RECEIPT_REUSED',flush=True)
        else:focused()
        return
    if '--validate-only' in sys.argv:
        if (ROOT/'native_validation.json').exists():
            v=require_receipt('native_validation.json','B9_NATIVE_IMPORT_AND_LOOP_PASS')
            require_receipt('focused_validation.json','B9_FOCUSED_PASS')
            require(sha(ROOT/v['master']['path'])==v['master']['sha256'],'MASTER_RECEIPT')
            print('B9_NATIVE_VALIDATION_RECEIPT_REUSED',flush=True)
        else:validate_master()
        return
    require((ROOT/'native_validation.json').exists(),'VALIDATION_REQUIRED')
    v=require_receipt('native_validation.json','B9_NATIVE_IMPORT_AND_LOOP_PASS')
    require_receipt('focused_validation.json','B9_FOCUSED_PASS')
    require(v['status']=='B9_NATIVE_IMPORT_AND_LOOP_PASS' and sha(ROOT/v['master']['path'])==v['master']['sha256'],'MASTER_RECEIPT')
    d=context();rows=[];layouts=[]
    for lod in PROFILES:
        layouts.append(habitat(lod,d,rows));closeups(lod,rows)
    verify();require(len(rows)==22,'FRAME_COUNT')
    write(ROOT/'cycles_manifest.json',{'status':'B9_NATIVE_CYCLES_COMPLETE','frames':rows,'layout':layouts,'artProxy':'Water transparent mixture, no runtime shader; fixed seed/camera/lights across profiles. No real actors, seat/gift camera-only. No GPU claim.'})
    inventory=[meta(ROOT/x['file']) for x in MAN['files']]+[meta(ROOT/n) for n in ('b9_editable_master.blend','focused_validation.json','native_validation.json','cycles_manifest.json')]+rows
    write(ROOT/'native_manifest.json',{'status':'B9_NATIVE_EVIDENCE_READY_SA_REVIEW_PENDING','blenderVersion':bpy.app.version_string,'inventory':inventory,'gates':{'SA':'P10B9_ART_SA_REVIEW_REQUIRED','ownerArt':'PENDING','codex':'HOLD'},'costVND':0})
    (ROOT/'owner_sha256.txt').write_text(''.join(x['sha256']+'  '+x['path']+'\n' for x in inventory+[meta(ROOT/'native_manifest.json')]),encoding='utf-8')
    print('B9_NATIVE_CYCLES_COMPLETE 12 HABITAT + 10 SWIM; P10B9_ART_SA_REVIEW_REQUIRED',flush=True)
if __name__=='__main__':main()
