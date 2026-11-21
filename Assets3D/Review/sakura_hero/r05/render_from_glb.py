"""Review render from the ACTUAL exported GLB via VTK glTF importer.
This is a look-dev preview in Phong/ambient, NOT evidence of PBR parity with Three.js.
Requires VTK with suitable graphics backend. Images are camera views of ONE GLB.
"""
import os
import vtk

base=os.environ.get('SAKURA_OUTPUT',os.path.dirname(os.path.abspath(__file__)))
model=os.path.join(base,'sakura_hero.glb')
views={
 'three_quarter':dict(position=(34,27,35),focal=(0,11.4,0),up=(0,1,0),scale=19.7),
 'side':dict(position=(37,14,1),focal=(0,11.1,0),up=(0,1,0),scale=17.7),
 'top':dict(position=(1,56,5),focal=(0,11,0),up=(0,0,-1),scale=19.4),
 'under':dict(position=(0.5,4.7,14.4),focal=(0,11.7,0),up=(0,1,0),scale=12.8),
}

for label,setting in views.items():
 ren=vtk.vtkRenderer()
 ren.GradientBackgroundOn();ren.SetBackground(.16,.15,.27);ren.SetBackground2(.78,.63,.72)
 rw=vtk.vtkRenderWindow();rw.SetOffScreenRendering(1);rw.SetAlphaBitPlanes(1);rw.AddRenderer(ren);rw.SetSize(850,950);rw.SetMultiSamples(8)
 importer=vtk.vtkGLTFImporter();importer.SetFileName(model);importer.SetRenderWindow(rw)
 importer.Update()
 print(label,'imported actors',ren.GetActors().GetNumberOfItems())
 # In this tool, VTK's default PBR has no IBL: glTF looks dark. This
 # Phong override is ONLY for silhouette/palette inspection, not final PBR validation.
 for actor in ren.GetActors():
  prop=actor.GetProperty()
  prop.SetInterpolationToPhong();prop.SetAmbient(.70);prop.SetDiffuse(.43);prop.SetSpecular(.02)
 ren.RemoveAllLights()
 for pos,intensity,color in [
  ((18,42,30),1.25,(1,.84,.80)),
  ((-30,20,-5),.72,(1,.75,.92)),
  ((8,4,-25),1.05,(1,.69,.82))
 ]:
  light=vtk.vtkLight();light.SetLightTypeToSceneLight();light.SetPosition(*pos);light.SetFocalPoint(0,9,0);light.SetIntensity(intensity);light.SetColor(*color);ren.AddLight(light)
 cam=ren.GetActiveCamera();cam.ParallelProjectionOn();cam.SetPosition(setting['position']);cam.SetFocalPoint(setting['focal']);cam.SetViewUp(setting['up']);cam.SetParallelScale(setting['scale']);cam.SetClippingRange(.1,200)
 txt=vtk.vtkTextActor();txt.SetInput('SAKURA HERO R05 / '+label.upper()+' / GLB MESH PREVIEW');txt.SetDisplayPosition(25,28)
 props=txt.GetTextProperty();props.SetFontSize(18);props.SetColor(1,1,1);props.SetOpacity(.88);props.SetBold(True);ren.AddActor2D(txt)
 rw.Render()
 image=vtk.vtkWindowToImageFilter();image.SetInput(rw);image.SetInputBufferTypeToRGB();image.ReadFrontBufferOff();image.Update()
 writer=vtk.vtkPNGWriter();writer.SetFileName(os.path.join(base,'sakura_hero_preview_'+label+'.png'));writer.SetInputConnection(image.GetOutputPort());writer.Write()
 rw.Finalize()
