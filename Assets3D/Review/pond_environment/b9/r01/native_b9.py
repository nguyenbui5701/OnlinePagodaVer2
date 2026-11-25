"""Original B9 native art verification, master and Cycles evidence. Blender 4.5 LTS.
No runtime code; all new files local to this versioned asset directory.
"""
import bpy, sys, json, math, hashlib, struct, random, subprocess
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
def import_model(path,name,parent=None):
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path))
    objs=set(bpy.data.objects)-before;require(bool(objs),'IMPORT_EMPTY '+name)
    col=bpy.data.collections.new(name)
    (parent.children if parent else bpy.context.scene.collection.children).link(col)
    for o in objs:
        prev=list(o.users_collection);col.objects.link(o)
        for c in prev:c.objects.unlink(o)
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
    ad.action=None;t.mute=False;st.mute=False
    st.repeat=1;st.scale=1
    lo=float(st.frame_start);duration=float(st.action_frame_end-st.action_frame_start)
    require(abs(duration-60)<.01,'CLIP_DURATION '+str(duration))
    st.repeat=repeat
    return arm,lo,duration
def at(scene,f):scene.frame_set(math.floor(f),subframe=f-math.floor(f));bpy.context.view_layer.update()
def validate_master():
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
    write(ROOT/'native_validation.json',{'status':'B9_NATIVE_IMPORT_AND_LOOP_PASS','blenderVersion':bpy.app.version_string,'profiles':report,'master':meta(dest),'masterReopened':True,'nativeUV':'No authored UV required: COLOR_0 vertex colors, no textures; finite existing UVs checked'})
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
    if '--validate-only' in sys.argv:
        require(not (ROOT/'native_validation.json').exists(),'VALIDATION_EXISTS_USE_RENDER_PHASE')
        validate_master();return
    require((ROOT/'native_validation.json').exists(),'VALIDATION_REQUIRED')
    v=json.loads((ROOT/'native_validation.json').read_text(encoding='utf-8'))
    require(v['status']=='B9_NATIVE_IMPORT_AND_LOOP_PASS' and sha(ROOT/v['master']['path'])==v['master']['sha256'],'MASTER_RECEIPT')
    d=context();rows=[];layouts=[]
    for lod in PROFILES:
        layouts.append(habitat(lod,d,rows));closeups(lod,rows)
    verify();require(len(rows)==22,'FRAME_COUNT')
    write(ROOT/'cycles_manifest.json',{'status':'B9_NATIVE_CYCLES_COMPLETE','frames':rows,'layout':layouts,'artProxy':'Water transparent mixture, no runtime shader; fixed seed/camera/lights across profiles. No real actors, seat/gift camera-only. No GPU claim.'})
    inventory=[meta(ROOT/x['file']) for x in MAN['files']]+[meta(ROOT/n) for n in ('b9_editable_master.blend','native_validation.json','cycles_manifest.json')]+rows
    write(ROOT/'native_manifest.json',{'status':'B9_NATIVE_EVIDENCE_READY_SA_REVIEW_PENDING','blenderVersion':bpy.app.version_string,'inventory':inventory,'gates':{'SA':'P10B9_ART_SA_REVIEW_REQUIRED','ownerArt':'PENDING','codex':'HOLD'},'costVND':0})
    (ROOT/'owner_sha256.txt').write_text(''.join(x['sha256']+'  '+x['path']+'\n' for x in inventory+[meta(ROOT/'native_manifest.json')]),encoding='utf-8')
    print('B9_NATIVE_CYCLES_COMPLETE 12 HABITAT + 10 SWIM; P10B9_ART_SA_REVIEW_REQUIRED',flush=True)
if __name__=='__main__':main()
