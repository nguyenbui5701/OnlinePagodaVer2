"""R17b SA R3 frozen-GLB final evidence. No mesh/material edits, no GLB export."""
import hashlib, json, math, struct, sys
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
OUT=HERE/'final'
PRE=HERE/'preview'
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT))
import author_r17_blender as rig

HEAD='29790122d2aae80b9be6fd6852a881be21a7fc10'
REVIEW='https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6033131258'
PIN={
 'quality':{'file':'sakura_hero_r17b.glb','bytes':6981312,'sha256':'1ed05dd2c0451364122e20999955dedb3be213305a59a45c61853013495f0267','triangles':236888,'materials':15,'gitBlob':'cfcbaa2ed71bedafae959541487c91f6de42ab74'},
 'eco':{'file':'sakura_hero_r17b_eco.glb','bytes':2149264,'sha256':'3b7e87f61ed120a2c938e572e0d0fe2c858c6fbc8027657efe16c232906de770','triangles':58212,'materials':14,'gitBlob':'d5554055ab689680ca17744653cfc49197b1e773'}
}
LODS=('quality','eco')
VIEWS=('hero_full_9x16','hero_wide_water_9x16','true_aerial_9x16','under_crown_9x16','crown_close_9x16','trunk_fork_9x16')
REUSE=set(VIEWS[3:])
def require(ok,msg):
    if not ok:raise RuntimeError(msg)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,j):
    temp=p.with_suffix(p.suffix+'.tmp')
    temp.write_text(json.dumps(j,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    temp.replace(p)
def git_blob(p,expected):
    data=p.read_bytes()
    def digest(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
    require(expected in (digest(data),digest(data.replace(b'\r\n',b'\n'))),'pinned text Git blob changed '+p.name)
def png_size(p):
    with p.open('rb') as f:h=f.read(24)
    require(h[:8]==b'\x89PNG\r\n\x1a\n' and h[12:16]==b'IHDR','invalid PNG '+str(p))
    return list(struct.unpack('>II',h[16:24]))
def check(p,meta):
    require(p.is_file() and p.stat().st_size==meta['bytes'] and sha(p)==meta['sha256'],'frozen SHA/size mismatch '+str(p))
def meta(p):return {'bytes':p.stat().st_size,'sha256':sha(p)}
def paths_and_inputs():
    for p,s in (
      (ROOT/'author_r17_blender.py','a781fe8c0d41c5e328e5d65dc68843f768350d20'),
      (ROOT/'R17_BUILD_RESULT.json','321a2291bb268bf4153d810732f88ebfd97da71f'),
      (ROOT/'R17_Cycles_Evidence/cycles_manifest.json','c24cad83ef1e8dccb365a71992db69a7b39ea26e'),
      (PRE/'preview_manifest.json','34691961e5aa9678b99821ce5351e58f94637e31')):
        git_blob(p,s)
    preview=read(PRE/'preview_manifest.json')
    prior=read(ROOT/'R17_BUILD_RESULT.json')
    require(bpy.app.version_string==preview['blenderVersion']==prior['blenderVersion'],'use same Blender 4.5.16 LTS as native preview/baseline')
    result={}
    for lod in LODS:
        pin=PIN[lod];p=PRE/pin['file'];check(p,pin)
        for key in ('bytes','sha256','triangles','materials'):
            require(preview['candidate'][lod][key]==pin[key],'reviewed preview fact mismatch '+lod+' '+key)
        base=ROOT.parent/'r16'/prior['r17'][lod]['sourceR16']
        check(base,prior['r16SourceVerified'][lod])
        require(sha(base)==preview['sourceHashes'][lod]['r16'],'R16 source mismatch')
        result[lod]={'r16':base,'r17b':p}
    return result,preview,prior
def mesh_signature(collection):
    meshes=sorted((o for o in collection.all_objects if o.type=='MESH'),key=lambda o:o.name)
    rows=[];materials=set()
    for o in meshes:
        o.data.calc_loop_triangles()
        counts={}
        for t in o.data.loop_triangles:
            m=o.data.materials[t.material_index] if t.material_index<len(o.data.materials) else None
            require(m is not None,'missing editable material '+o.name)
            counts[m.name]=counts.get(m.name,0)+1
            materials.add(m.name)
        rows.append({'object':o.name,'triangles':len(o.data.loop_triangles),'materialTriangleCounts':counts,
                     'matrixWorld':[list(r) for r in o.matrix_world]})
    factors={}
    for name in sorted(materials):
        m=bpy.data.materials[name]
        node=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
        require(node is not None,'missing imported PBR '+name)
        factors[name]={'backfaceCulling':bool(getattr(m,'use_backface_culling',False)),
            'factors':{k:(list(node.inputs[k].default_value) if hasattr(node.inputs[k].default_value,'__len__') else float(node.inputs[k].default_value))
                       for k in ('Base Color','Metallic','Roughness','Emission Color','Emission Strength','Alpha') if k in node.inputs}}
    return {'meshCount':len(rows),'triangles':sum(x['triangles'] for x in rows),
            'usedMaterials':len(materials),'materials':factors,'objects':rows}
def collections_state():
    bpy.context.view_layer.update()
    out={}
    for lod in LODS:
        col=bpy.data.collections.get('R17b_'+lod.upper()+'_Editable')
        require(col is not None,'missing collection '+lod)
        sig=mesh_signature(col)
        require(sig['triangles']==PIN[lod]['triangles'],'editable triangle mismatch '+lod)
        require(sig['usedMaterials']==PIN[lod]['materials'],'editable material count mismatch '+lod)
        out[lod]={'signature':sig,'hideViewport':col.hide_viewport,'hideRender':col.hide_render}
    return out
def make_editable(paths):
    dest=OUT/'sakura_hero_r17b_editable.blend'
    receipt=OUT/'editable_reopen.json'
    if receipt.is_file() and dest.is_file():
        old=read(receipt)
        if old.get('approvedHead')==HEAD and old.get('sourceHashes')=={k:PIN[k]['sha256'] for k in LODS} and old.get('sha256')==sha(dest):
            bpy.ops.wm.open_mainfile(filepath=str(dest))
            require(collections_state()==old['reopenedCollections'],'existing editable verification mismatch')
            print('R17B_FINAL_EDITABLE_REUSED_SHA_PASS',flush=True)
            return old
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for lod in LODS:
        before=set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(paths[lod]['r17b']))
        new=set(bpy.data.objects)-before
        require(bool(new),'empty editable import '+lod)
        col=bpy.data.collections.new('R17b_'+lod.upper()+'_Editable')
        bpy.context.scene.collection.children.link(col)
        for o in new:
            # Link first to keep the original hierarchy and transforms.
            existing=list(o.users_collection);col.objects.link(o)
            for old in existing:old.objects.unlink(o)
        bpy.context.view_layer.update()
        col.hide_viewport=(lod=='eco');col.hide_render=(lod=='eco')
    state=collections_state()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(dest))
    bpy.ops.wm.open_mainfile(filepath=str(dest))
    reopened=collections_state()
    require(state==reopened,'editable reopened collections/materials/geometry differ')
    require(not reopened['quality']['hideViewport'] and not reopened['quality']['hideRender'] and reopened['eco']['hideViewport'] and reopened['eco']['hideRender'],'default LOD visibility wrong')
    # Verify switching the editable visibility without saving any modification.
    for lod in LODS:
        col=bpy.data.collections['R17b_'+lod.upper()+'_Editable']
        col.hide_viewport=(lod=='quality');col.hide_render=(lod=='quality')
    switched=collections_state()
    require(switched['quality']['hideViewport'] and switched['quality']['hideRender'] and not switched['eco']['hideViewport'] and not switched['eco']['hideRender'],'ECO switch failed')
    # Restore saved default by reopening, never resave the switch.
    bpy.ops.wm.open_mainfile(filepath=str(dest))
    require(collections_state()==reopened,'restore default LOD failed')
    info={'approvedHead':HEAD,'file':dest.name,**meta(dest),'opened':True,'sourceHashes':{k:PIN[k]['sha256'] for k in LODS},
          'reopenedCollections':reopened,'ecoVisibilitySwitchPass':True,
          'note':'Editable import of exact frozen GLBs; geometry/materials not authored or exported; default QUALITY visible, ECO hidden independently.'}
    write(receipt,info)
    print('R17B_FINAL_EDITABLE_REOPEN_PASS',flush=True)
    return info
def box_corners(bounds):
    lo,hi=bounds
    return [Vector((x,-z,y)) for x in (lo[0],hi[0]) for y in (lo[1],hi[1]) for z in (lo[2],hi[2])]
def camera(view,pose=None):
    if pose is None:
        rig.set_camera(view);return bpy.context.scene.camera
    eye,target,up,fov=pose
    eye,target,up=Vector(eye),Vector(target),Vector(up)
    d=(target-eye).normalized();right=d.cross(up).normalized();u=right.cross(d).normalized()
    mat=Matrix(((right.x,u.x,-d.x),(right.y,u.y,-d.y),(right.z,u.z,-d.z)))
    cam=bpy.data.cameras.new('R17b_Final_'+view);o=bpy.data.objects.new('R17b_Final_'+view,cam)
    bpy.context.scene.collection.objects.link(o)
    o.location=eye;o.rotation_euler=mat.to_quaternion().to_euler()
    cam.type='PERSP';cam.sensor_fit='VERTICAL';cam.lens=cam.sensor_height/(2*math.tan(math.radians(fov)/2))
    cam.clip_start=.05;cam.clip_end=500;bpy.context.scene.camera=o
    return o
def projection(obj,points):
    bpy.context.view_layer.update()
    uv=[world_to_camera_view(bpy.context.scene,obj,p) for p in points]
    require(all(p.z>0 for p in uv),'geometry behind camera')
    return [min(p.x for p in uv),max(p.x for p in uv),min(p.y for p in uv),max(p.y for p in uv)]
def camera_plan(preview):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc=bpy.context.scene;sc.render.resolution_x=720;sc.render.resolution_y=1280;sc.render.resolution_percentage=100
    points=box_corners(preview['unionBoundsYUp'])
    poses={k:v['poseBlender'] for k,v in preview['fixedCameras'].items()}
    # True overhead: vertical optical axis; fit entire union bounds from above.
    lo,hi=preview['unionBoundsYUp'];cx=(lo[0]+hi[0])/2;cz=(lo[2]+hi[2])/2
    target=[cx,-cz,(lo[1]+hi[1])/2]
    height=hi[1]+42
    for _ in range(30):
        pose=[[cx,-cz,height],target,[0,1,0],50]
        o=camera('true_aerial_9x16',pose);a,b,c,d=projection(o,points)
        if min(a,c)>=.045 and max(b,d)<=.955:break
        height=hi[1]+(height-hi[1])*1.10
    else:raise RuntimeError('aerial fit failed')
    poses['true_aerial_9x16']=pose
    for k,p in poses.items():
        o=camera(k,p);a,b,c,d=projection(o,points)
        require(min(a,c)>=.044 and max(b,d)<=.956,'full/wide/aerial crop '+k)
    return poses
def setup_camera(scene,view,poses):
    o=camera(view,poses.get(view))
    bpy.context.view_layer.update()
    return {'matrix':[list(row) for row in o.matrix_world],'lens':o.data.lens,'sensorFit':o.data.sensor_fit,
            'sensorWidth':o.data.sensor_width,'sensorHeight':o.data.sensor_height,
            'clipStart':o.data.clip_start,'clipEnd':o.data.clip_end}
def render(paths,preview,prior,poses):
    old=read(ROOT/'R17_Cycles_Evidence/cycles_manifest.json')
    existing={(x['lod'],x['camera']):x for x in old if x['revision']=='r16'}
    checkpoint=OUT/'render_checkpoint.json'
    config={'head':HEAD,'scriptSHA256':sha(Path(__file__)),'blenderVersion':bpy.app.version_string,'poses':poses,
            'sourceHashes':{lod:{rev:sha(p) for rev,p in v.items()} for lod,v in paths.items()},'resolution':[720,1280],'samples':32}
    done={}
    if checkpoint.is_file():
        last=read(checkpoint)
        if last.get('config')==config:done={x['file']:x for x in last.get('rows',[])}
    rows=[]
    for lod in LODS:
        for rev in ('r16','r17b'):
            model=paths[lod][rev]
            rig.render_setup(model)
            sc=bpy.context.scene
            require(sc.render.engine=='CYCLES' and sc.cycles.samples==32 and sc.render.resolution_x==720 and sc.render.resolution_y==1280,'wrong render rig')
            # Leave the original factory/default Cycles seed and settings intact for historical frame reuse.
            for view in VIEWS:
                camera_info=setup_camera(sc,view,poses)
                name=f'{lod}_{rev}_{view}_cycles.png'
                identity={'file':name,'lod':lod,'revision':rev,'view':view,'modelSHA256':config['sourceHashes'][lod][rev],
                          'width':720,'height':1280,'samples':32,'renderer':'Blender Cycles CPU','camera':camera_info}
                if rev=='r16' and view in REUSE:
                    ref=existing[(lod,view)]
                    require(ref['file']==name and [ref['width'],ref['height'],ref['samples']]==[720,1280,32] and ref['renderer']=='Blender Cycles CPU','old baseline settings mismatch')
                    p=ROOT/'R17_Cycles_Evidence'/ref['file'];check(p,ref)
                    require(png_size(p)==[720,1280],'old baseline dimensions mismatch')
                    row={**identity,**meta(p),'path':'../../R17_Cycles_Evidence/'+p.name,
                        'origin':'REUSED_R16_FINAL_GRADE_FROZEN_RIG_AND_SHA',
                        'provenance':'Original pinned rig and camera source, original native build/ledger, same Blender version; no rerender.'}
                    print('R17B_FINAL_REUSED_R16',name,flush=True)
                else:
                    p=OUT/name
                    prev=done.get(name)
                    if prev and p.is_file() and all(prev.get(k)==v for k,v in identity.items()) and p.stat().st_size==prev['bytes'] and sha(p)==prev['sha256'] and png_size(p)==[720,1280]:
                        row=prev
                        print('R17B_FINAL_RESUME_VERIFIED',name,flush=True)
                    else:
                        sc.render.filepath=str(p);bpy.ops.render.render(write_still=True)
                        require(p.is_file() and png_size(p)==[720,1280],'missing/invalid final PNG '+name)
                        row={**identity,**meta(p),'path':name,'origin':'NATIVE_FINAL_CYCLES'}
                        print('R17B_FINAL_RENDERED',name,flush=True)
                rows.append(row)
                done[name]=row
                write(checkpoint,{'config':config,'rows':list(done.values())})
    require(len(rows)==24 and sum(x['origin']=='NATIVE_FINAL_CYCLES' for x in rows)==18,'wrong final image count')
    for lod in LODS:
        for view in VIEWS:
            pair=[x for x in rows if x['lod']==lod and x['view']==view]
            require(len(pair)==2 and pair[0]['camera']==pair[1]['camera'],'A/B camera mismatch '+lod+' '+view)
    write(OUT/'cycles_manifest.json',rows)
    return rows
def main():
    OUT.mkdir(exist_ok=True)
    report=OUT/'R17B_FINAL_RESULT.json'
    if report.exists():report.unlink()
    paths,preview,prior=paths_and_inputs()
    print('R17B_FINAL_APPROVED_GLB_SHA_LOCK_PASS',flush=True)
    blend=make_editable(paths)
    poses=camera_plan(preview)
    rows=render(paths,preview,prior,poses)
    # Recheck the exact same source bytes after all rendering; no other audit repeated.
    for lod in LODS:
        check(paths[lod]['r17b'],PIN[lod]);check(paths[lod]['r16'],prior['r16SourceVerified'][lod])
    write(report,{'status':'R17B_FINAL_NATIVE_EVIDENCE_READY_OWNER_UPLOAD_SA_REVIEW_PENDING','approvedHead':HEAD,'review':REVIEW,
        'blenderVersion':bpy.app.version_string,'costVNDSoftwareLicense':0,
        'canonicalGLBs':{lod:{**preview['candidate'][lod],'path':'../preview/'+PIN[lod]['file'],'gitBlobSHA':PIN[lod]['gitBlob']} for lod in LODS},
        'auditStatus':'REUSED_APPROVED_PREVIEW_AUDIT_SAME_BYTES','editable':blend,
        'cycles':{'ledger':'cycles_manifest.json','count':len(rows),'newNativeCount':18,'reusedR16Count':6,'r17bCount':12,
                  'resolution':[720,1280],'samples':32,'cameraPoses':poses,
                  'lighting':'Pinned original R17 rig: three SUN lights, AgX None EV0; illustrative render-only water, no runtime rings.',
                  'rigGitBlob':'a781fe8c0d41c5e328e5d65dc68843f768350d20'},
        'independentSAHash':'PENDING','ownerArtGO':'PENDING','gate':'R17_SA_ART_REVIEW_REQUIRED','merge':'HOLD',
        'limitations':['No repeated geometry audit or re-export; original preview geometry audit reused by SHA.','Reused R16 close/under/trunk frames verified by frozen ledger and same original rig/settings; camera matrices reconstructed from pinned source.','No native Viewer ring/reflection, RTX or LIVE proof.','Visual final art review still required; do not auto-edit if defect found.']})
    print('R17B_FINAL_COMPLETE 12 R17B + 6 NEW R16 + 6 REUSED R16; STOP R17_SA_ART_REVIEW_REQUIRED',flush=True)
if __name__=='__main__':main()
