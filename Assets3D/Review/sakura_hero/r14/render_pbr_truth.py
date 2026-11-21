"""Original fixed PBR evaluation rig. No Phong interpolation or vtkProperty ambient/diffuse overrides.
Use SAME camera, PBR materials, tone mapping and light positions for R06/R07, QUALITY/ECO.
R09: 5 aerial poses and original top 50deg. Top is a reproducible approximate perspective checkpoint for footage ~15s, not pixel-matched.

"""
import vtk, os, argparse
from PIL import Image
from vtk.util.numpy_support import numpy_to_vtk
import numpy as np
from pathlib import Path

VIEWS={
 'aerial_e':((15,54,7),(0,13.5,0),(0,0,-1)),
 'aerial_w':((-13,54,8),(0,13.5,0),(0,0,-1)),
 'aerial_n':((5,54,-15),(0,13.5,0),(0,0,-1)),
 'aerial_s':((-6,54,18),(0,13.5,0),(0,0,-1)),
 'under':((3.0,4.8,18.5),(0,11.9,0),(0,1,0)),
 'top':((3,54,10),(0,13.5,0),(0,0,-1)),
 'three_quarter':((31,25,31),(0,11.6,0),(0,1,0)),
 'side':((32,14,2),(0,11.0,0),(0,1,0)),
 'trunk_33s':((4.8,4.0,11.5),(0,6.6,0),(0,1,0)),
 'hero_full_9x16':((24.641505854426047,38.825045790301786,54.139118204520734),(.15,12.4,0),(0,1,0)),
 'hero_medium_9x16':((18.22713557959851,31.90427786219839,39.95998391279671),(.15,12.4,0),(0,1,0)),
 'hero_close_9x16':((3,54,10),(0,13.5,0),(0,0,-1)),
}

def render(model, output, view='under', size=(560,650), lighting='ibl_fill', label=''):
    renderer=vtk.vtkRenderer(); renderer.AutomaticLightCreationOff()
    renderer.GradientBackgroundOn();renderer.SetBackground(0.15,0.13,0.23);renderer.SetBackground2(0.76,0.58,0.67)
    win=vtk.vtkRenderWindow();win.SetOffScreenRendering(True);win.SetSize(*size);win.AddRenderer(renderer);win.SetMultiSamples(0)
    imp=vtk.vtkGLTFImporter();imp.SetFileName(str(model));imp.SetRenderWindow(win);imp.Update()
    props=[]
    for a in renderer.GetActors():
        p=a.GetProperty()
        props.append((p.GetInterpolationAsString(),p.GetEmissiveFactor()))
        if p.GetInterpolationAsString()!='Physically based rendering':
            raise RuntimeError('Non PBR material: '+repr(p.GetInterpolationAsString()))
    # Analytic sky & earth bounce IBL; pastel environment shared for ALL tested GLBs.
    w,h=256,128
    img=np.empty((h,w,3),dtype=np.uint8)
    sky=np.array([216,181,195],float);mid=np.array([172,132,165],float);ground=np.array([124,98,142],float)
    for y in range(h):
        v=y/(h-1)
        if v<.50: col=sky*(1-v*2)+mid*v*2
        else: col=mid*(2-2*v)+ground*(2*v-1)
        img[y,:,:]=np.clip(col,0,255).astype(np.uint8)
    vtkimg=vtk.vtkImageData();vtkimg.SetDimensions(w,h,1);vtkimg.AllocateScalars(vtk.VTK_UNSIGNED_CHAR,3)
    # VTK order bottom-to-top, pixel_x fastest
    vtkimg.GetPointData().GetScalars().DeepCopy(numpy_to_vtk(img[::-1].reshape(-1,3),deep=True,array_type=vtk.VTK_UNSIGNED_CHAR))
    tex=vtk.vtkTexture();tex.SetInputData(vtkimg);tex.SetColorModeToDirectScalars();tex.MipmapOn();tex.InterpolateOn()
    if lighting=='ibl_fill':
        renderer.SetEnvironmentTexture(tex,True);renderer.UseImageBasedLightingOn()
    renderer.RemoveAllLights()
    def add(pos, intensity, color):
        light=vtk.vtkLight();light.SetLightTypeToSceneLight();light.SetPositional(False)
        light.SetPosition(*pos);light.SetFocalPoint(0,9,0);light.SetIntensity(intensity);light.SetColor(*color);renderer.AddLight(light)
    add((22,40,26),1.25,(1,.84,.82))
    add((-18,23,-15),.65,(1,.76,.89))
    add((6,3,18),.84,(1,.74,.83))  # lower fill is a real scene light, not a material override
    renderer.UseFXAAOn()
    ren_cam=renderer.GetActiveCamera();pos,target,up=VIEWS[view]
    ren_cam.ParallelProjectionOff();ren_cam.SetPosition(*pos);ren_cam.SetFocalPoint(*target);ren_cam.SetViewUp(*up);ren_cam.SetViewAngle(50 if view.startswith('aerial') or view in ('top','hero_full_9x16','hero_medium_9x16','hero_close_9x16') else 56 if view=='trunk_33s' else 44);ren_cam.SetClippingRange(.05,400)
    win.Render()
    f=vtk.vtkWindowToImageFilter();f.SetInput(win);f.SetInputBufferTypeToRGB();f.ReadFrontBufferOff();f.Update()
    out=Path(output);out.parent.mkdir(parents=True,exist_ok=True)
    writer=vtk.vtkPNGWriter();writer.SetFileName(str(out));writer.SetInputConnection(f.GetOutputPort());writer.Write()
    win.Finalize()
    print(out,'model',Path(model).name,view,'PBR:',len(props),'lights=',renderer.GetLights().GetNumberOfItems(),flush=True)
    return out

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('model');p.add_argument('out');p.add_argument('--view',choices=VIEWS,default='under');p.add_argument('--no-ibl',action='store_true');p.add_argument('--w',type=int,default=560);p.add_argument('--h',type=int,default=650)
 a=p.parse_args();render(a.model,a.out,a.view,(a.w,a.h),'no_ibl' if a.no_ibl else 'ibl_fill')
