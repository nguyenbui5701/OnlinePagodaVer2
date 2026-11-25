"""Native R18 matched render + editable handoff, only after validated build.
No source geometry or runtime/camera changes; these cameras are offline evidence only.
"""
import sys, math, json, hashlib, struct
from pathlib import Path
import bpy
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parent
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT))
import author_r18 as a
import author_r17_blender as rig
from author_r17b_preview import camera as make_camera
E=ROOT/'R18_Cycles_Evidence'
VIEWS=('aerial','wide','under_tree','branch_close','low_water','seat_gift_composition')
OLD={'aerial':'true_aerial_9x16','wide':'hero_wide_water_9x16','under_tree':'under_crown_9x16'}
def camera_from_record(c):
    cam=bpy.data.cameras.new('R18_matched');ob=bpy.data.objects.new('R18_matched',cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world=Matrix(c['matrix']);cam.lens=c['lens'];cam.sensor_fit=c['sensorFit']
    cam.sensor_width=c['sensorWidth'];cam.sensor_height=c['sensorHeight'];cam.clip_start=c['clipStart'];cam.clip_end=c['clipEnd']
    bpy.context.scene.camera=ob;return ob
def camera_info(o):
    bpy.context.view_layer.update();c=o.data
    return {'matrix':[list(row) for row in o.matrix_world],'lens':c.lens,'sensorFit':c.sensor_fit,'sensorWidth':c.sensor_width,'sensorHeight':c.sensor_height,'clipStart':c.clip_start,'clipEnd':c.clip_end}
def shot(view,lod,diagnostics,old):
    if view in OLD:return camera_from_record(old[(lod,OLD[view])]['camera'])
    if view=='branch_close':
        gaps=diagnostics['profiles'][lod]['attachmentFindings']
        if gaps:
            gap=max(gaps,key=lambda x:x.get('oldGapMeters',x.get('gapMetersVertexToSurface',0)))
            target=(Vector(gap['childPoint'])+Vector(gap['parentPoint']))*.5
        else:
            stem=diagnostics['profiles'][lod]['drapedStems'][0]['boundsBlenderMeters']
            target=(Vector(stem[0])+Vector(stem[1]))*.5
        radial=Vector((target.x,target.y,0))
        if radial.length<.1:radial=Vector((1,0,0))
        radial.normalize()
        eye=target+radial*8+Vector((0,0,-3.5))
        return make_camera(view,(list(eye),list(target),[0,0,1],50))
    if view=='low_water':
        return make_camera(view,([0,-35,1.2],[0,0,10],[0,0,1],62))
    # Camera-only seat/gift scale composition. No props, seats, lotus or actor delivery.
    return make_camera(view,([8,-18,2.8],[1,0,10],[0,0,1],55))
def editable(models):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for lod in a.LODS:
        before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/a.NAMES[lod]))
        new=set(bpy.data.objects)-before;col=bpy.data.collections.new('R18_'+lod.upper()+'_Editable')
        bpy.context.scene.collection.children.link(col)
        for ob in new:
            users=list(ob.users_collection);col.objects.link(ob)
            for old in users:old.objects.unlink(ob)
        bpy.context.view_layer.update();col.hide_viewport=lod=='eco';col.hide_render=lod=='eco'
    def state():
        out={}
        for lod in a.LODS:
            col=bpy.data.collections['R18_'+lod.upper()+'_Editable'];meshes=[o for o in col.all_objects if o.type=='MESH']
            mats={}
            for o in meshes:
                o.data.calc_loop_triangles()
                for t in o.data.loop_triangles:
                    mat=o.data.materials[t.material_index];mats[mat.name]=mats.get(mat.name,0)+1
            a.require(sum(mats.values())==models[lod]['triangles'] and len(mats)==models[lod]['materials'],'editable count mismatch '+lod)
            pbr={}
            for name in mats:
                n=next(n for n in bpy.data.materials[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
                pbr[name]={'emissive':list(n.inputs['Emission Color'].default_value),'strength':n.inputs['Emission Strength'].default_value,'base':list(n.inputs['Base Color'].default_value)}
            out[lod]={'meshes':len(meshes),'triangles':sum(mats.values()),'materials':mats,'pbr':pbr,'hideViewport':col.hide_viewport,'hideRender':col.hide_render}
        return out
    bpy.context.preferences.filepaths.save_version=0
    dst=ROOT/'sakura_hero_r18_editable.blend';before=state()
    bpy.ops.wm.save_as_mainfile(filepath=str(dst));bpy.ops.wm.open_mainfile(filepath=str(dst))
    a.require(before==state(),'editable reopen mismatch')
    for lod in a.LODS:
        c=bpy.data.collections['R18_'+lod.upper()+'_Editable'];c.hide_viewport=lod=='quality';c.hide_render=lod=='quality'
    switched=state();a.require(switched['quality']['hideRender'] and not switched['eco']['hideRender'],'visibility switch')
    bpy.ops.wm.open_mainfile(filepath=str(dst));a.require(state()==before,'default visibility restore')
    return {**a.filemeta(dst),'ownerReopen':True,'visibilitySwitch':True,'collections':before}
def render_image(path):
    sc=bpy.context.scene;sc.render.filepath=str(path);bpy.ops.render.render(write_still=True)
    with path.open('rb') as f:h=f.read(24)
    a.require(h[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',h[16:24])==(720,1280),'invalid native image')
    return a.filemeta(path)
def audit_views():
    a.pins();diag=a.read(ROOT/'attachment_audit.json');out=ROOT/'R18_Attachment_Audit';out.mkdir(exist_ok=True)
    rows=[]
    old={(r['lod'],r['view']):r for r in a.read(a.BASE/'final/cycles_manifest.json') if r['revision']=='r17b'}
    for lod in a.LODS:
        model=a.BASE/a.PIN[lod][0];rig.render_setup(model)
        ob=shot('branch_close',lod,diag,old);bpy.context.view_layer.update();target=ob.location+ob.matrix_world.to_quaternion()@Vector((0,0,-8))
        for view,offset in [('underside',None),('front',Vector((0,-9,0))),('side',Vector((9,0,0)))]:
            if offset is not None:ob=make_camera('audit_'+view,(list(target+offset),list(target),[0,0,1],50))
            rows.append({**render_image(out/f'{lod}_{view}_baseline.png'),'lod':lod,'view':view,'camera':camera_info(ob),'modelSHA256':a.sha(model)})
    a.write(out/'audit_views.json',rows)
    print('R18_NATIVE_ATTACHMENT_AUDIT_VIEWS_COMPLETE 6',flush=True)

def preview():
    a.pins()
    out=ROOT/'R18_Repair_Preview';out.mkdir(exist_ok=True)
    marker=out/'preview_manifest.json'
    if marker.exists():marker.unlink()
    val=a.read(ROOT/'validation.json');diag=a.read(ROOT/'attachment_diagnostics.json')
    a.require(val['status']=='NATIVE_GLB_VALIDATION_PASS_EDITABLE_RENDER_PENDING' and diag['status']=='NATIVE_REPAIR_PROXY_PASS_VISUAL_REVIEW_REQUIRED','focused build not passed')
    a.require(diag['sourceAuditSHA256']==a.repair.AUDIT_SHA,'audit drift')
    old={(r['lod'],r['view']):r for r in a.read(a.BASE/'final/cycles_manifest.json') if r['revision']=='r17b'}
    rows=[];poses={}
    for lod in a.LODS:
        candidate=ROOT/a.NAMES[lod];model=val['profiles'][lod]
        a.require(a.sha(candidate)==model['sha256'] and candidate.stat().st_size==model['bytes'],'candidate SHA drift')
        # Focus on largest original gap and include both original and moved stem
        # bounds, using an exterior side camera (not a camera inside the canopy).
        gap=max(diag['profiles'][lod]['attachmentFindings'],key=lambda x:x['oldGapMeters'])
        oldstem=next(x for x in diag['profiles'][lod]['drapedStems'] if x['id']==gap['id'])
        pts=[Vector((x,y,z)) for low,hi in (oldstem['boundsBlenderMeters'],gap['newBoundsBlenderMeters']) for x in (low[0]-.8,hi[0]+.8) for y in (low[1]-.8,hi[1]+.8) for z in (low[2]-.8,hi[2]+.8)]
        target=sum(pts,Vector((0,0,0)))/len(pts)
        radial=Vector((target.x,target.y,0))
        if radial.length<.1:radial=Vector((1,0,0))
        radial.normalize()
        rig.render_setup(a.BASE/a.PIN[lod][0])
        for distance in (18,22,26,32,40):
            eye=target+radial*distance+Vector((0,0,-4.5))
            ob=make_camera('repair_side',(list(eye),list(target),[0,0,1],48))
            bpy.context.view_layer.update()
            uv=[world_to_camera_view(bpy.context.scene,ob,x) for x in pts]
            if all(v.z>0 and .05<=v.x<=.95 and .05<=v.y<=.95 for v in uv):break
        else:raise RuntimeError('R18 focused side framing failed '+lod)
        info=camera_info(ob);poses[lod]=info
        for rev in ('r17b','r18'):
            path=a.BASE/a.PIN[lod][0] if rev=='r17b' else candidate
            rig.render_setup(path)
            # Under-tree historical R17B image reused with exact SHA and camera;
            # render just R18 counterpart and a matched exterior side pair.
            for view in ('under_tree','repair_side'):
                if view=='under_tree':
                    ref=old[(lod,'under_crown_9x16')]
                    ob=camera_from_record(ref['camera'])
                    if rev=='r17b':
                        prior=a.BASE/'final'/ref['path']
                        a.require(a.sha(prior)==ref['sha256'] and prior.stat().st_size==ref['bytes'],'baseline under-tree SHA mismatch')
                        im={'path':'../r17-lush/r17b/final/'+ref['path'],'sha256':ref['sha256'],'bytes':ref['bytes']}
                        origin='REUSED_R17B_FROZEN_RIG'
                    else:im=render_image(out/f'{lod}_{rev}_{view}.png');origin='NATIVE_CYCLES'
                else:
                    ob=camera_from_record(info)
                    im=render_image(out/f'{lod}_{rev}_{view}.png');origin='NATIVE_CYCLES'
                rows.append({**im,'lod':lod,'revision':rev,'view':view,'origin':origin,'camera':camera_info(ob),'modelSHA256':a.sha(path),'width':720,'height':1280,'samples':32})
                print('R18_FOCUSED_PREVIEW_FRAME',lod,rev,view,origin,flush=True)
    a.require(len(rows)==8 and sum(x['origin']=='NATIVE_CYCLES' for x in rows)==6,'preview frame count')
    for lod in a.LODS:
        for view in ('under_tree','repair_side'):
            pair=[x for x in rows if x['lod']==lod and x['view']==view]
            a.require(len(pair)==2 and pair[0]['camera']==pair[1]['camera'],'preview camera mismatch')
    a.write(marker,{'status':'R18_FOCUSED_PREVIEW_READY_SA_REVIEW_PENDING','baseline':a.HEAD,'sourceAuditSHA256':a.repair.AUDIT_SHA,
        'frames':rows,'sideCameraPoses':poses,'candidateHashes':{k:v['sha256'] for k,v in val['profiles'].items()},
        'notes':'Six new native images plus two SHA-reused baseline under-tree images. New exterior side pair replaces unusable old QUALITY side for review; old audit remains immutable. Offline evidence only.',
        'finalCycles':'HOLD','ownerArtGO':'PENDING','gate':'P10B8_ART_SA_REVIEW_REQUIRED'})
    print('R18_FOCUSED_PREVIEW_COMPLETE 6 NEW + 2 REUSED; FINAL_HOLD',flush=True)

def final_after_future_sa_go():
    a.pins();E.mkdir(exist_ok=True)
    val=a.read(ROOT/'validation.json');diag=a.read(ROOT/'attachment_diagnostics.json')
    a.require(val['status']=='NATIVE_GLB_VALIDATION_PASS_EDITABLE_RENDER_PENDING' and diag['status']=='NATIVE_REPAIR_PROXY_PASS_VISUAL_REVIEW_REQUIRED','build not passed')
    models=val['profiles']
    for lod,m in models.items():
        p=ROOT/a.NAMES[lod];a.require(a.sha(p)==m['sha256'] and p.stat().st_size==m['bytes'],'candidate changed')
    val['editable']=editable(models)
    old={(r['lod'],r['view']):r for r in a.read(a.BASE/'final/cycles_manifest.json') if r['revision']=='r17b'}
    rows=[];looks=[]
    for lod in a.LODS:
        for rev in ('r17b','r18'):
            path=a.BASE/a.PIN[lod][0] if rev=='r17b' else ROOT/a.NAMES[lod]
            rig.render_setup(path)
            for view in VIEWS:
                ob=shot(view,lod,diag,old);info=camera_info(ob)
                name=f'{lod}_{rev}_{view}_cycles.png'
                if rev=='r17b' and view in OLD:
                    ref=old[(lod,OLD[view])]
                    prior=a.BASE/'final'/ref['path']
                    a.require(prior.is_file() and a.sha(prior)==ref['sha256'] and prior.stat().st_size==ref['bytes'] and ref['samples']==32 and ref['width']==720 and ref['height']==1280,'old R17B frame mismatch')
                    # Matrix reconstruction may differ by float ulps; exact pose
                    # receipt is retained, and actual camera is checked numerically.
                    a.require(all(abs(x-y)<1e-5 for row1,row2 in zip(info['matrix'],ref['camera']['matrix']) for x,y in zip(row1,row2)),'old camera mismatch')
                    image={'path':'../r17-lush/r17b/final/'+ref['path'],'bytes':ref['bytes'],'sha256':ref['sha256']}
                    origin='REUSED_R17B_FROZEN_RIG'
                else:
                    image=render_image(E/name);origin='NATIVE_CYCLES'
                rows.append({**image,'lod':lod,'revision':rev,'view':view,'camera':info,'origin':origin,'modelSHA256':a.sha(path),'width':720,'height':1280,'samples':32})
                print('R18_CYCLES_FRAME',lod,rev,view,origin,flush=True)
            if rev=='r18':
                # Isolate the offline warm fill change from the matched material A/B.
                ob=shot('under_tree',lod,diag,old)
                data=bpy.data.lights.new('R18_LOOK_ONLY_WARM_FILL','AREA');data.energy=950;data.color=(1,.62,.32);data.shape='DISK';data.size=7
                light=bpy.data.objects.new(data.name,data);bpy.context.scene.collection.objects.link(light)
                light.location=(2,-8,5);light.rotation_euler=(Vector((0,0,10))-light.location).to_track_quat('-Z','Y').to_euler()
                im=render_image(E/f'{lod}_r18_gold_look_only.png')
                looks.append({**im,'lod':lod,'view':'under_tree','camera':camera_info(ob),'additionalLight':{'energyW':950,'color':[1,.62,.32],'sizeM':7},'note':'Render-only controlled warm fill; not runtime lighting or mesh.'})
    a.require(len(rows)==24 and len(looks)==2,'render count')
    for lod in a.LODS:
        for view in VIEWS:
            pair=[x for x in rows if x['lod']==lod and x['view']==view]
            a.require(len(pair)==2 and pair[0]['camera']==pair[1]['camera'],'A/B camera mismatch')
    a.write(ROOT/'cycles_manifest.json',{'frames':rows,'lookOnly':looks,'lighting':'Pinned original R17 rig, AgX None EV0, same light/lens/exposure; separate warm fill pair only. Water render-only; seat composition camera-only, no runtime seats.'})
    val['status']='R18_NATIVE_EVIDENCE_READY_VISUAL_SA_REVIEW_PENDING';val['cycles']={'count':24,'nativeNew':18,'reused':6,'lookOnlyNew':2};val['blenderVersion']=bpy.app.version_string
    for lod,m in models.items():a.require(a.sha(ROOT/a.NAMES[lod])==m['sha256'],'candidate changed after render')
    a.pins();a.write(ROOT/'validation.json',val);print('R18_FINAL_COMPLETE 24 matched + 2 look-only; SA REVIEW REQUIRED',flush=True)
def main():
    phase=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'preview'
    a.require(phase=='preview','R18 Final Cycles HOLD until explicit SA preview decision; audit already complete')
    preview()
if __name__=='__main__':main()
