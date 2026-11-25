"""R18a editable master and final evidence, authorized by AI Visual17 §10.
No export, rebuild, old audit or preview rerun.
"""
import sys,hashlib,struct,os
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT))
import author_r18a as g
sys.path.insert(0,str(g.PARENT))
import render_r18 as old
a=g.a
E=ROOT/'R18a_Cycles_Evidence'
VIEWS=old.VIEWS
def gitpin(path,digest):
    data=path.read_bytes()
    def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
    g.require(digest in (blob(data),blob(data.replace(b'\r\n',b'\n'))),'RIG_PIN '+path.name)
def meta(path):
    return {'path':os.path.relpath(path,ROOT).replace('\\','/'),'bytes':path.stat().st_size,'sha256':g.sha(path)}
def check(path,row):
    g.require(path.is_file() and path.stat().st_size==row['bytes'] and g.sha(path)==row['sha256'],'EVIDENCE_SHA '+str(path))
def png(path):
    with path.open('rb') as f:h=f.read(24)
    g.require(h[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',h[16:24])==(720,1280),'PNG_DIMENSIONS')
def state():
    bpy.context.view_layer.update()
    out={}
    for lod in a.LODS:
        c=bpy.data.collections['R18a_'+lod.upper()+'_Editable']
        meshes=sorted((o for o in c.all_objects if o.type=='MESH'),key=lambda x:x.name)
        rows=[];mats={}
        for o in meshes:
            o.data.calc_loop_triangles();counts={}
            for t in o.data.loop_triangles:
                m=o.data.materials[t.material_index];counts[m.name]=counts.get(m.name,0)+1
                if m.name not in mats:
                    n=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
                    mats[m.name]={k:(list(n.inputs[k].default_value) if hasattr(n.inputs[k].default_value,'__len__') else float(n.inputs[k].default_value)) for k in ('Base Color','Metallic','Roughness','Emission Color','Emission Strength','Alpha') if k in n.inputs}
            rows.append({'name':o.name,'triangles':len(o.data.loop_triangles),'materials':counts,'matrixWorld':[list(row) for row in o.matrix_world]})
        out[lod]={'meshCount':len(meshes),'triangles':sum(x['triangles'] for x in rows),'materialCount':len(mats),'materials':mats,'objects':rows,'hideRender':c.hide_render,'hideViewport':c.hide_viewport}
    return out
def editable(models):
    dest=ROOT/'sakura_hero_r18a_editable.blend';receipt=ROOT/'editable_reopen.json'
    hashes={k:v['sha256'] for k,v in models.items()}
    if receipt.exists() and dest.exists():
        j=a.read(receipt)
        if j.get('sourceHashes')==hashes and j.get('sha256')==g.sha(dest):
            bpy.ops.wm.open_mainfile(filepath=str(dest));g.require(state()==j['collections'],'EDITABLE_REUSE')
            print('R18A_EDITABLE_REUSE_PASS',flush=True);return j
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for lod in a.LODS:
        before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/g.NAMES[lod]))
        new=set(bpy.data.objects)-before;col=bpy.data.collections.new('R18a_'+lod.upper()+'_Editable')
        bpy.context.scene.collection.children.link(col)
        for o in new:
            prev=list(o.users_collection);col.objects.link(o)
            for c in prev:c.objects.unlink(o)
        bpy.context.view_layer.update();col.hide_render=(lod=='eco');col.hide_viewport=(lod=='eco')
    original=state()
    for lod,s in original.items():
        g.require(s['triangles']==models[lod]['triangles'] and s['materialCount']==models[lod]['materials'] and s['meshCount']==models[lod]['meshes'],'EDITABLE_COUNTS '+lod)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(dest));bpy.ops.wm.open_mainfile(filepath=str(dest))
    g.require(state()==original,'EDITABLE_REOPEN')
    for lod in a.LODS:
        c=bpy.data.collections['R18a_'+lod.upper()+'_Editable'];c.hide_render=(lod=='quality');c.hide_viewport=(lod=='quality')
    switched=state()
    g.require(switched['quality']['hideRender'] and switched['quality']['hideViewport'] and not switched['eco']['hideRender'] and not switched['eco']['hideViewport'],'EDITABLE_SWITCH')
    bpy.ops.wm.open_mainfile(filepath=str(dest));g.require(state()==original,'EDITABLE_RESTORE')
    j={**meta(dest),'sourceHashes':hashes,'collections':original,'ownerReopen':True,'visibilitySwitch':True,
       'master':'QUALITY full-detail editable R18a plus ECO derivative collection; source recipe retained, no decimation or optional HIGH QUALITY export in this revision.'}
    a.write(receipt,j);print('R18A_EDITABLE_REOPEN_PASS',flush=True);return j
def main():
    g.pin_inputs()
    for path,digest in ((a.R17/'author_r17_blender.py','a781fe8c0d41c5e328e5d65dc68843f768350d20'),(a.BASE/'author_r17b_preview.py','7512775f9005e1549c87ae9f240651b5193970a5'),(a.BASE/'final/cycles_manifest.json','894d6e64d9fe0984f2416470a0303b334d399496'),(g.PARENT/'render_r18.py','33ddc76adf94853e1c30bea6bcec90a694abfc54')):
        gitpin(path,digest)
    val=a.read(ROOT/'validation.json')
    g.require(val['status']=='R18A_GOLD_NATIVE_VALIDATION_PASS' and val['reviewedHead']==g.REVIEWED and val['policyTaskBlob']==g.POLICY and val['sourceHashes']=={k:v[2] for k,v in g.PIN.items()},'FINAL_AUTHORIZATION')
    models=val['profiles']
    for lod,m in models.items():
        check(ROOT/g.NAMES[lod],m)
        g.require(m['originalBinPrefixExact'] and m['nonGoldMaterialsExact'] and m['goldSurfaceProof']['status']=='NATIVE_SURFACE_DISTANCE_PASS','FINAL_VALIDATION')
    E.mkdir(exist_ok=True)
    # Use exact pinned R17B rig, original final-grade camera receipts,
    # and focused repair side camera for the branch underside/close view.
    ref={(r['lod'],r['view']):r for r in a.read(a.BASE/'final/cycles_manifest.json') if r['revision']=='r17b'}
    preview=a.read(g.PARENT/'R18_Repair_Preview/preview_manifest.json')['frames']
    pi={(r['lod'],r['revision'],r['view']):r for r in preview}
    diag=a.read(g.PARENT/'attachment_diagnostics.json')
    blend=editable(models)
    config={'reviewedHead':g.REVIEWED,'renderScriptSHA256':g.sha(Path(__file__)),'models':{k:v['sha256'] for k,v in models.items()},'blenderVersion':bpy.app.version_string}
    cache=ROOT/'render_checkpoint.json';done={}
    if cache.exists():
        j=a.read(cache)
        if j.get('config')==config:done=j['done']
    def render(name,identity):
        dest=E/name
        prior=done.get(name)
        if prior and all(prior.get(k)==v for k,v in identity.items()) and dest.is_file() and dest.stat().st_size==prior['bytes'] and g.sha(dest)==prior['sha256']:
            png(dest);print('R18A_FRAME_REUSED_CHECKPOINT',name,flush=True);return prior
        bpy.context.scene.render.filepath=str(dest);bpy.ops.render.render(write_still=True);png(dest)
        row={**identity,**meta(dest),'origin':'NATIVE_CYCLES'}
        done[name]=row;a.write(cache,{'config':config,'done':done})
        print('R18A_FRAME_RENDERED',name,flush=True);return row
    rows=[];looks=[];gold_controls=[]
    for lod in a.LODS:
        for rev in ('r17b','r18a'):
            model=a.BASE/a.PIN[lod][0] if rev=='r17b' else ROOT/g.NAMES[lod]
            a.rig.render_setup(model);sc=bpy.context.scene
            g.require(sc.render.engine=='CYCLES' and sc.cycles.samples==32 and sc.render.resolution_x==720 and sc.render.resolution_y==1280 and sc.view_settings.look=='None' and sc.view_settings.exposure==0,'RENDER_SETTINGS')
            for view in VIEWS:
                reuse=None
                if view in old.OLD:
                    rec=ref[lod,old.OLD[view]];ob=old.camera_from_record(rec['camera'])
                    if rev=='r17b':reuse=(a.BASE/'final'/rec['path'],rec)
                elif view=='branch_close':
                    rec=pi[lod,'r17b','repair_side'];ob=old.camera_from_record(rec['camera'])
                    if rev=='r17b':reuse=(g.PARENT/rec['path'],rec)
                else:ob=old.shot(view,lod,diag,ref)
                info=old.camera_info(ob)
                ident={'lod':lod,'revision':rev,'view':view,'camera':info,'modelSHA256':g.sha(model),'width':720,'height':1280,'samples':32,'renderer':'Blender Cycles CPU'}
                if reuse:
                    path,record=reuse;check(path,record);png(path)
                    g.require(record['modelSHA256']==ident['modelSHA256'] and [record['width'],record['height'],record['samples']]==[720,1280,32],'BASELINE_MODEL_SETTINGS')
                    # Actual camera reconstruction verified numerically, exact same for A/B.
                    g.require(all(abs(x-y)<1e-5 for r,s in zip(info['matrix'],record['camera']['matrix']) for x,y in zip(r,s)) and abs(info['lens']-record['camera']['lens'])<1e-5 and all(info[k]==record['camera'][k] for k in ('sensorFit','sensorWidth','sensorHeight','clipStart','clipEnd')),'BASELINE_CAMERA')
                    row={**ident,**meta(path),'origin':'REUSED_R17B_FROZEN_RIG'}
                else:row=render(f'{lod}_{rev}_{view}_cycles.png',ident)
                rows.append(row)
            if rev=='r18a':
                # Direct R18 -> R18a controls: reuse the already verified native
                # R18 side and under-tree frames, not another render of R18.
                for view,key in (('under_tree','under_tree'),('branch_close','repair_side')):
                    rec=pi[lod,'r18',key];p=g.PARENT/rec['path'];check(p,rec);png(p)
                    counterpart=next(x for x in rows if x['lod']==lod and x['revision']=='r18a' and x['view']==view)
                    g.require(rec['modelSHA256']==g.PIN[lod][2] and all(abs(x-y)<1e-5 for r,s in zip(rec['camera']['matrix'],counterpart['camera']['matrix']) for x,y in zip(r,s)) and abs(rec['camera']['lens']-counterpart['camera']['lens'])<1e-5 and all(rec['camera'][k]==counterpart['camera'][k] for k in ('sensorFit','sensorWidth','sensorHeight','clipStart','clipEnd')),'GOLD_CONTROL_CAMERA')
                    gold_controls.append({**rec,**meta(p),'view':view,'origin':'REUSED_R18_PREVIEW_FROZEN_RIG'})
                ob=old.camera_from_record(ref[lod,'under_crown_9x16']['camera'])
                data=bpy.data.lights.new('R18a_LOOK_ONLY_WARM_FILL','AREA');data.energy=950;data.color=(1,.62,.32);data.shape='DISK';data.size=7
                light=bpy.data.objects.new(data.name,data);bpy.context.scene.collection.objects.link(light)
                light.location=(2,-8,5);light.rotation_euler=(Vector((0,0,10))-light.location).to_track_quat('-Z','Y').to_euler()
                looks.append(render(f'{lod}_r18a_gold_look_only.png',{'lod':lod,'revision':'r18a','view':'under_tree','camera':old.camera_info(ob),'modelSHA256':models[lod]['sha256'],'width':720,'height':1280,'samples':32,'additionalLight':{'energyW':950,'color':[1,.62,.32],'sizeM':7},'note':'Offline look only; same model and camera, not runtime'}))
    g.require(len(rows)==24 and len(looks)==2 and len(gold_controls)==4,'FRAME_COUNT')
    for lod in a.LODS:
        for view in VIEWS:
            pair=[x for x in rows if x['lod']==lod and x['view']==view]
            g.require(len(pair)==2 and pair[0]['camera']==pair[1]['camera'],'AB_CAMERA')
    a.write(ROOT/'cycles_manifest.json',{'frames':rows,'lookOnly':looks,'goldControls':gold_controls,
       'lighting':'Pinned R17 rig, AgX None EV0. Matched light/exposure/lens/camera. Warm fill separate. Water render-only; seat/gift composition camera-only.',
       'counts':{'matched':24,'nativeNew':sum(x['origin']=='NATIVE_CYCLES' for x in rows),'reusedR17B':sum(x['origin'].startswith('REUSED') for x in rows),'reusedR18GoldControls':len(gold_controls),'lookOnlyNew':2}})
    for lod,m in models.items():check(ROOT/g.NAMES[lod],m)
    g.pin_inputs()
    a.write(ROOT/'final_result.json',{'status':'R18A_NATIVE_FINAL_EVIDENCE_READY_SA_REVIEW_PENDING','reviewedHead':g.REVIEWED,'review':g.REVIEW,'policyTaskBlob':g.POLICY,
        'validationSHA256':g.sha(ROOT/'validation.json'),'profiles':models,'editable':blend,'cycles':a.read(ROOT/'cycles_manifest.json')['counts'],'ownerArtGO':'PENDING',
        'independentSAHash':'PENDING','gate':'P10B8_ART_SA_REVIEW_REQUIRED','costVNDSoftwareLicense':0})
    print('R18A_FINAL_COMPLETE 24 MATCHED + 4 R18 CONTROLS + 2 LOOK ONLY',flush=True)
if __name__=='__main__':main()
