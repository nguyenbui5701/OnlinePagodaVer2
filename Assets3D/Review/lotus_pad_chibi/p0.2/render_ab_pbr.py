"""Native GLB importer PBR p0.1 / p0.2 matching-camera art A/B.
The generated pair is review-only; not a runtime GLB.
No Blender/Cycles claim. All images are native vtkGLTFImporter PBR.
"""
from pathlib import Path
import os
import vtk, math, numpy as np
from PIL import Image,ImageDraw,ImageFont
from vtk.util.numpy_support import numpy_to_vtk
import render_review_pbr as r
BASE=Path(__file__).resolve().parent
OUT=BASE/'PBR_Review'
OUT.mkdir(exist_ok=True)
ROOTS={'p01':BASE/'p01_baseline','p02':BASE}
ORIGINAL_LIGHT=r.lighting

def warmer_dusk(ren):
    # Fixed for every single p01 / p02 view; no model-specific lighting.
    ren.AutomaticLightCreationOff();ren.GradientBackgroundOn()
    ren.SetBackground(.055,.045,.115);ren.SetBackground2(.79,.55,.57)
    w,h=256,128;arr=np.empty((h,w,3),dtype=np.uint8)
    top=np.array([245,195,186]);mid=np.array([199,151,195]);bot=np.array([57,62,111])
    for row in range(h):
        t=row/(h-1)
        color=top*(1-2*t)+mid*(2*t) if t<.5 else mid*(2-2*t)+bot*(2*t-1)
        arr[row,:,:]=np.clip(color,0,255)
    im=vtk.vtkImageData();im.SetDimensions(w,h,1);im.AllocateScalars(vtk.VTK_UNSIGNED_CHAR,3)
    im.GetPointData().GetScalars().DeepCopy(numpy_to_vtk(arr[::-1].reshape(-1,3),deep=True,array_type=vtk.VTK_UNSIGNED_CHAR))
    tex=vtk.vtkTexture();tex.SetInputData(im);tex.SetColorModeToDirectScalars();tex.MipmapOn();tex.InterpolateOn()
    ren.SetEnvironmentTexture(tex,True);ren.UseImageBasedLightingOn()
    for pos,strength,color in [((4,8,10),2.05,(1.,.87,.78)),((-7,5,1),1.15,(.75,.80,1)),((2,6,-9),1.20,(1.,.69,.78))]:
        l=vtk.vtkLight();l.SetPositional(False);l.SetLightTypeToSceneLight();l.SetPosition(*pos)
        l.SetFocalPoint(0,.35,0);l.SetIntensity(strength);l.SetColor(*color);ren.AddLight(l)

r.lighting=warmer_dusk
r.VIEWS.update({
    'pair_medium_9x16':((1.75,1.26,4.1),(0,.59,0),(0,1,0),47),
    'pair_close_9x16':((1.30,1.22,2.55),(0,.74,.04),(0,1,0),43),
})
VIEWS=['pad_top','pad_waterlevel','pad_side','chibi_front','chibi_side','chibi_back','chibi_three_quarter','pair_front','pair_three_quarter','pair_medium_9x16','pair_close_9x16','pair_top']

def draw_montage(files, dest, cols=2,thumb=(420,490)):
    w,h=thumb;n=len(files);rows=math.ceil(n/cols)
    canvas=Image.new('RGB',(cols*w,rows*(h+38)),(24,23,39));d=ImageDraw.Draw(canvas)
    for i,fn in enumerate(files):
        pic=Image.open(fn).convert('RGB');pic.thumbnail((w,h),Image.Resampling.LANCZOS)
        x=(i%cols)*w+(w-pic.width)//2; y=(i//cols)*(h+38)+(h-pic.height)//2
        canvas.paste(pic,(x,y));d.text(((i%cols)*w+13,(i//cols)*(h+38)+h+7),fn.parent.name.upper()+"  "+fn.stem.upper(),fill=(240,238,235))
    canvas.save(dest,quality=91)
    print('MONTAGE',dest,canvas.size,flush=True)

def render_all():
    allfiles={}
    for case,root in ROOTS.items():
        case_out=OUT/case;case_out.mkdir(exist_ok=True)
        r.ROOT=root;r.OUT=case_out
        both=r.combined_scene()
        out={}
        for view in VIEWS:
            if view.startswith('pad_'):model=root/'lotus_pad_01.glb'
            elif view.startswith('chibi_'):model=root/'meditator_base.glb'
            else:model=both
            size=(500,890) if view.endswith('9x16') else (540,580)
            out[view]=r.render(model,view,size=size,water=view in ('pad_waterlevel','pad_side') or view.startswith('pair_'))
        for t in [0,.5,1.,1.5,2.]:
            out[f'idle_{t:g}']=r.render(root/'meditator_base.glb','idle_front',size=(450,520),time_value=t)
        allfiles[case]=out
    for group,views in [
        ('LEAF_TOP_SIDE_WATERLINE_AB',['pad_top','pad_waterlevel','pad_side']),
        ('CHIBI_FRONT_SIDE_BACK_AB',['chibi_front','chibi_side','chibi_three_quarter','chibi_back']),
        ('PAIR_MEDIUM_CLOSE_AB',['pair_medium_9x16','pair_close_9x16']),
        ('PAIR_CONTACT_AB',['pair_front','pair_three_quarter','pair_top']),
        ('SIT_IDLE_5_PHASES_AB',[f'idle_{t:g}' for t in [0,.5,1.,1.5,2.]])
    ]:
        # Each row has p01 then p02, enabling proper matched lighting/camera A/B.
        paths=[]
        for v in views:paths.extend([allfiles['p01'][v],allfiles['p02'][v]])
        draw_montage(paths,OUT/(group+'.jpg'),2,(410,680) if 'MEDIUM' in group else (410,405))
    print('COMPLETE',len(VIEWS),'matched cameras x2 + idle frames')

if __name__=='__main__':render_all()
