"""VTK default PBR diagnostic: no Phong override, reveal dark-underside risk.
Set SAKURA_OUTPUT to folder with sakura_hero.glb and optional graphics display backend.
Never cite Phong preview as proof this PBR issue is fixed.
"""
import os
import vtk
base=os.environ.get('SAKURA_OUTPUT',os.path.dirname(os.path.abspath(__file__)))
rw=vtk.vtkRenderWindow();rw.SetOffScreenRendering(1);rw.SetSize(850,950)
ren=vtk.vtkRenderer();ren.GradientBackgroundOn();ren.SetBackground(.16,.15,.27);ren.SetBackground2(.78,.63,.72);rw.AddRenderer(ren)
imp=vtk.vtkGLTFImporter();imp.SetFileName(os.path.join(base,'sakura_hero.glb'));imp.SetRenderWindow(rw);imp.Update()
cam=ren.GetActiveCamera();cam.ParallelProjectionOn();cam.SetPosition(.5,4.7,14.4);cam.SetFocalPoint(0,11.7,0);cam.SetViewUp(0,1,0);cam.SetParallelScale(12.8);cam.SetClippingRange(.1,200)
for pos,intensity in [((18,42,30),1.25),((-30,20,-5),.72),((8,4,-25),1.05)]:
 l=vtk.vtkLight();l.SetLightTypeToSceneLight();l.SetPosition(*pos);l.SetFocalPoint(0,9,0);l.SetIntensity(intensity);ren.AddLight(l)
rw.Render()
w2i=vtk.vtkWindowToImageFilter();w2i.SetInput(rw);w2i.Update()
w=vtk.vtkPNGWriter();w.SetFileName(os.path.join(base,'sakura_hero_pbr_under_diagnostic.png'));w.SetInputConnection(w2i.GetOutputPort());w.Write()
rw.Finalize()
print('Diagnostic only, not a validated production PBR render')
