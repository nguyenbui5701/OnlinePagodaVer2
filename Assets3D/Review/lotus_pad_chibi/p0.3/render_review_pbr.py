"""P0-01 actual GLB native VTK glTF PBR reviewer (NOT Blender Cycles).
Same real 3D meshes from exported GLB under 8 perspectives; animated actor
loaded through vtkGLTFImporter and sampled at actual glTF time values.
"""
from pathlib import Path
import numpy as np
import vtk
import trimesh
from vtk.util.numpy_support import numpy_to_vtk
from PIL import Image,ImageOps,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'PBR_Review';OUT.mkdir(exist_ok=True)

def combined_scene():
    scene=trimesh.Scene()
    for file,prefix,delta in [('lotus_pad_01.glb','Pad',np.array([0,0,0])),('meditator_base.glb','Chibi',np.array([0,.195,0]))]:
        src=trimesh.load(str(ROOT/file),force='scene')
        for node in src.graph.nodes_geometry:
            T,geo=src.graph[node]
            m=src.geometry[geo].copy()
            T=T.copy();T[:3,3]+=delta
            scene.add_geometry(m,geom_name=prefix+'_'+geo,node_name=prefix+'_'+node,transform=T)
    p=ROOT/'lotus_chibi_seated_review_only.glb'
    p.write_bytes(trimesh.exchange.gltf.export_glb(scene,include_normals=True))
    return p

def lighting(ren):
    ren.AutomaticLightCreationOff()
    ren.GradientBackgroundOn()
    ren.SetBackground(.105,.10,.195)
    ren.SetBackground2(.69,.50,.64)
    w,h=256,128
    arr=np.empty((h,w,3),dtype=np.uint8)
    top=np.array([214,169,210]);mid=np.array([164,136,202]);bot=np.array([76,72,118])
    for row in range(h):
        t=row/(h-1)
        color=top*(1-2*t)+mid*(2*t) if t<.5 else mid*(2-2*t)+bot*(2*t-1)
        arr[row,:,:]=np.clip(color,0,255)
    im=vtk.vtkImageData();im.SetDimensions(w,h,1);im.AllocateScalars(vtk.VTK_UNSIGNED_CHAR,3)
    im.GetPointData().GetScalars().DeepCopy(numpy_to_vtk(arr[::-1].reshape(-1,3),deep=True,array_type=vtk.VTK_UNSIGNED_CHAR))
    tex=vtk.vtkTexture();tex.SetInputData(im);tex.SetColorModeToDirectScalars();tex.MipmapOn();tex.InterpolateOn()
    ren.SetEnvironmentTexture(tex,True);ren.UseImageBasedLightingOn()
    for pos,strength,color in [((5,8,12),1.7,(1,.91,.85)),((-7,5,2),1.0,(.74,.78,1)),((1,6,-9),1.3,(1,.57,.76))]:
        lt=vtk.vtkLight();lt.SetPositional(False);lt.SetLightTypeToSceneLight()
        lt.SetPosition(*pos);lt.SetFocalPoint(0,.35,0);lt.SetIntensity(strength);lt.SetColor(*color);ren.AddLight(lt)

def add_water(ren):
    plane=vtk.vtkPlaneSource();plane.SetOrigin(-6,0,-6);plane.SetPoint1(-6,0,6);plane.SetPoint2(6,0,-6);plane.SetResolution(1,1)
    mapper=vtk.vtkPolyDataMapper();mapper.SetInputConnection(plane.GetOutputPort());actor=vtk.vtkActor();actor.SetMapper(mapper)
    actor.GetProperty().SetInterpolationToPBR();actor.GetProperty().SetColor(.035,.066,.17)
    actor.GetProperty().SetRoughness(.18);actor.GetProperty().SetMetallic(.25)
    ren.AddActor(actor)

def add_debug(ren,actor_only=False):
    centers=[('SEAT',(0,.195,0),(.15,1.,.4)),('HEAD',(0,1.03,.04),(.28,.86,1)),('NAME',(0,1.53,.03),(1,.85,.22)),('FX',(.37,1.,.16),(1,.37,.80))]
    if actor_only:centers=[(n,(x,y-.195,z),c) for n,(x,y,z),c in centers]
    for name,point,color in centers:
        sphere=vtk.vtkSphereSource();sphere.SetCenter(*point);sphere.SetRadius(.045 if name!='SEAT' else .03)
        sphere.SetThetaResolution(14);sphere.SetPhiResolution(10)
        a=vtk.vtkActor();m=vtk.vtkPolyDataMapper();m.SetInputConnection(sphere.GetOutputPort());a.SetMapper(m);a.GetProperty().SetColor(*color)
        a.GetProperty().SetAmbient(.5);ren.AddActor(a)
        vec=vtk.vtkVectorText();vec.SetText(name)
        mm=vtk.vtkPolyDataMapper();mm.SetInputConnection(vec.GetOutputPort())
        tt=vtk.vtkFollower();tt.SetMapper(mm);tt.SetScale(.085,.085,.085);tt.SetPosition(point[0]+.07,point[1]+.03,point[2]);tt.GetProperty().SetColor(*color);ren.AddActor(tt)
    return centers

VIEWS={
'pad_top':((.0,3.9,1.8),(0,.1,0),(0,0,-1),42),
'pad_waterlevel':((2.6,.39,3.6),(0,.11,0),(0,1,0),40),
'pad_side':((3.1,.25,.35),(0,.08,0),(0,1,0),40),
'chibi_front':((0,.75,2.75),(0,.61,0),(0,1,0),33),
'chibi_side':((2.7,.68,.12),(0,.61,0),(0,1,0),36),
'chibi_back':((.3,.7,-2.8),(0,.61,0),(0,1,0),36),
'chibi_three_quarter':((2.05,1.32,2.55),(0,.61,0),(0,1,0),41),
'pair_front':((0,1.04,3.0),(0,.67,0),(0,1,0),42),
'pair_three_quarter':((2.55,1.52,2.85),(0,.55,0),(0,1,0),47),
'pair_9x16':((1.5,1.23,3.5),(0,.70,0),(0,1,0),43),
'pair_top':((1.5,3.8,2.2),(0,.55,0),(0,0,-1),49),
'pair_anchor_debug':((1.75,1.45,3.4),(0,.77,0),(0,1,0),43),
'idle_front':((0,.7,2.6),(0,.56,0),(0,1,0),38),
}

def render(file,view,size=(550,610),time_value=None,water=False,debug=False):
    ren=vtk.vtkRenderer();lighting(ren)
    win=vtk.vtkRenderWindow();win.SetOffScreenRendering(True);win.SetMultiSamples(0);win.SetSize(*size);win.AddRenderer(ren)
    imp=vtk.vtkGLTFImporter();imp.SetFileName(str(file));imp.SetRenderWindow(win);imp.Update()
    if time_value is not None:
        assert imp.GetNumberOfAnimations()==1,('animation missing',imp.GetNumberOfAnimations())
        assert imp.GetAnimationName(0)=='sit_idle',imp.GetAnimationName(0)
        imp.EnableAnimation(0);imp.UpdateAtTimeValue(time_value)
    models=[]
    for a in ren.GetActors():
        prop=a.GetProperty();mode=prop.GetInterpolationAsString()
        if mode!='Physically based rendering':
            raise RuntimeError('Not native glTF PBR mesh: '+str(mode))
        models.append(a)
    if not models:raise RuntimeError('No actual imported GLB meshes')
    if water:add_water(ren)
    if debug:add_debug(ren,actor_only=(file.name=='meditator_base.glb'))
    pos,target,up,fov=VIEWS[view]
    camera=ren.GetActiveCamera();camera.ParallelProjectionOff();camera.SetPosition(*pos);camera.SetFocalPoint(*target)
    camera.SetViewUp(*up);camera.SetViewAngle(fov);camera.SetClippingRange(.02,150)
    for a in ren.GetActors():
        if isinstance(a,vtk.vtkFollower):a.SetCamera(camera)
    win.Render()
    capture=vtk.vtkWindowToImageFilter();capture.SetInput(win);capture.SetInputBufferTypeToRGB();capture.ReadFrontBufferOff();capture.Update()
    path=OUT/((view if time_value is None else f'{view}_t{time_value:.2f}')+'.png')
    writer=vtk.vtkPNGWriter();writer.SetFileName(str(path));writer.SetInputConnection(capture.GetOutputPort());writer.Write()
    win.Finalize()
    print('RENDER',view,'time',time_value,'actors',len(models),'file',path,flush=True)
    return path

def montage(files,output,cols=3,thumb=(350,375)):
    w,h=thumb;rows=(len(files)+cols-1)//cols
    dst=Image.new('RGB',(cols*w,rows*(h+38)),(27,25,44));d=ImageDraw.Draw(dst)
    for i,file in enumerate(files):
        pic=Image.open(file).convert('RGB');pic.thumbnail((w,h),Image.Resampling.LANCZOS)
        x=(i%cols)*w+(w-pic.width)//2;y=(i//cols)*(h+38)+(h-pic.height)//2
        dst.paste(pic,(x,y));d.text(((i%cols)*w+12,(i//cols)*(h+38)+h+7),file.stem.replace('_',' ').upper(),fill=(243,232,238))
    dest=OUT/output;dst.save(dest,quality=90);return dest

if __name__=='__main__':
    both=combined_scene()
    plan=[('lotus_pad_01.glb','pad_top',(550,610),False,False),
          ('lotus_pad_01.glb','pad_waterlevel',(550,610),True,False),
          ('lotus_pad_01.glb','pad_side',(550,610),True,False),
          ('meditator_base.glb','chibi_front',(550,610),False,False),
          ('meditator_base.glb','chibi_side',(550,610),False,False),
          ('meditator_base.glb','chibi_back',(550,610),False,False),
          ('meditator_base.glb','chibi_three_quarter',(550,610),False,False),
          (both.name,'pair_front',(550,610),True,False),
          (both.name,'pair_three_quarter',(550,610),True,False),
          (both.name,'pair_top',(550,610),False,False),
          (both.name,'pair_9x16',(540,960),True,False),
          (both.name,'pair_anchor_debug',(540,960),True,True)]
    paths=[]
    for file,view,size,water,debug in plan:
        paths.append(render(ROOT/file,view,size,water=water,debug=debug))
    frames=[]
    for t in [0,.5,1.0,1.5,2.0]:
        frames.append(render(ROOT/'meditator_base.glb','idle_front',(500,580),time_value=t))
    print('CONTACT_SHEETS',montage(paths[:7],'asset_turnaround_contact.jpg',cols=4),montage(paths[7:],'pair_hero_contact.jpg',cols=3),montage(frames,'sit_idle_5_frames.jpg',cols=5,thumb=(225,290)))
