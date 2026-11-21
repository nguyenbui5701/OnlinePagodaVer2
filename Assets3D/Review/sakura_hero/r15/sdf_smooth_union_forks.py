"""R15 P0: deterministic SDF smooth UNION, original zero-cost implementation.

The three principal QUALITY arms and the entire ancient S-shaped trunk are
sampled as ONE continuous implicit solid. Their fields undergo polynomial
smooth-min and ONE marching-cubes iso extraction, rather than drawing any
intersecting stem/branch pipes or adding collar bulges. Source bark ring radii
are interpolated from actual R14 old_bark_surface, preserving its twisted
surface/fissures away from fused fork zones. Does not affect ECO.

Requires numpy, scipy, scikit-image, trimesh. Stable CPU implementation.
"""
import math
import numpy as np
import trimesh
from scipy.ndimage import map_coordinates
from skimage.measure import marching_cubes
import vtk
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray, vtk_to_numpy

FUSED_BRANCH_IDS=(0,5,9)
VOXEL_PITCH_M=.16
SMOOTH_UNION_K_M=.56


def trunk_center(t):
 t=np.asarray(t,dtype=np.float32)
 return np.stack([
  2.48*np.sin(1.31*t)+1.25*t*t+.35*np.sin(5.8*t+.3)*t+.80*np.sin(6.0*t+.1)*np.sin(np.pi*t)+.60*t*t-.14*np.sin(12.2*t)*np.sin(np.pi*t),
  13.15*t,
  1.65*np.sin(2.27*t)-.10+.53*np.sin(5.6*t+.18)*t+.92*np.sin(4.1*t+.28)*np.sin(np.pi*t)+.36*t*t+.16*np.sin(10.1*t)*np.sin(np.pi*t)],axis=-1)


def bark_table(base):
 # Match the actual 73×58 R14 bark surface, including its long helical flutes.
 fissures=base.make_fissures()
 vals=np.empty((73,58),np.float32)
 for i in range(73):
  t=i/72
  for j in range(58):
   vals[i,j]=base.old_bark_surface(t,2*np.pi*j/58,fissures,detail=True)[1]
 return np.concatenate([vals[:,-1:],vals,vals[:,:1]],axis=1)


def evaluate_trunk(points,bark):
 t=np.clip(points[:,1]/13.15,0.,1.).astype(np.float32)
 center=trunk_center(t)
 e=.0007
 tangent=trunk_center(np.minimum(1.,t+e))-trunk_center(np.maximum(0.,t-e))
 tangent/=np.maximum(np.linalg.norm(tangent,axis=1,keepdims=True),1e-8)
 reference=np.zeros_like(tangent);reference[:,2]=1
 mask=np.abs(tangent[:,2])>.92
 reference[mask]=[1,0,0]
 u=np.cross(tangent,reference);u/=np.maximum(np.linalg.norm(u,axis=1,keepdims=True),1e-8)
 v=np.cross(tangent,u)
 rel=points-center
 # R14 radius is defined in normal plane to tangent, not world XZ.
 rU=np.sum(rel*u,axis=1);rV=np.sum(rel*v,axis=1)
 theta=np.mod(np.arctan2(rV,rU),2*np.pi)
 radius=map_coordinates(bark,np.stack((t*72,theta*(58/(2*np.pi))+1)),order=1,mode='nearest')
 sd=np.sqrt(rU*rU+rV*rV)-radius
 # End-cap parent trunk while keeping original S curve above and below.
 return np.maximum(np.maximum(sd,-points[:,1]),points[:,1]-13.15)


def evaluate_arm(points,centers,radii):
 # Piecewise capsule cone SDF of the *same R14 centerline/taper* as its old
 # main limb tube, but now fused to parent by smooth MIN, not overlapping.
 best=np.full(len(points),np.inf,dtype=np.float32)
 for i in range(len(centers)-1):
  a=centers[i];v=centers[i+1]-a
  t=np.clip(((points-a)@v)/(v@v+1e-12),0.,1.)
  rel=points-(a+t[:,None]*v)
  r=radii[i]+t*(radii[i+1]-radii[i])
  best=np.minimum(best,np.sqrt(np.sum(rel*rel,axis=1))-r)
 return best


def smin(a,b,k):
 # Proper smooth union: k physically spans the sleeve-free blended throat.
 h=np.maximum(k-np.abs(a-b),0)/k
 return np.minimum(a,b)-.25*k*h*h


def smooth_and_reduce(mesh):
 # VTK CPU topology-preserving smoothing and target-only quadric decimation.
 # We smooth only the fused trunk+3 limbs, NEVER the crown or ECO.
 poly=vtk.vtkPolyData()
 pts=vtk.vtkPoints();pts.SetData(numpy_to_vtk(np.asarray(mesh.vertices,dtype=np.float32),deep=True))
 poly.SetPoints(pts)
 faces=np.asarray(mesh.faces,dtype=np.int64)
 cells=vtk.vtkCellArray()
 cells.SetCells(len(faces),numpy_to_vtkIdTypeArray(np.concatenate([np.full((len(faces),1),3,dtype=np.int64),faces],axis=1).ravel(),deep=True))
 poly.SetPolys(cells)
 smoothing=vtk.vtkWindowedSincPolyDataFilter()
 smoothing.SetInputData(poly)
 smoothing.SetNumberOfIterations(11)
 smoothing.SetPassBand(.095)
 smoothing.NormalizeCoordinatesOn()
 smoothing.BoundarySmoothingOff()
 smoothing.NonManifoldSmoothingOff()
 smoothing.FeatureEdgeSmoothingOff()
 smoothing.Update()
 dec=vtk.vtkDecimatePro()
 dec.SetInputConnection(smoothing.GetOutputPort())
 dec.SetTargetReduction(.55)
 dec.PreserveTopologyOn()
 dec.SplittingOff()
 dec.BoundaryVertexDeletionOff()
 dec.Update()
 out=dec.GetOutput()
 verts=vtk_to_numpy(out.GetPoints().GetData()).copy().astype(np.float32)
 offsets=vtk_to_numpy(out.GetPolys().GetData())
 if len(offsets)%4 or not np.all(offsets[::4]==3):
  raise RuntimeError('Decimation changed triangle-only topology')
 faces=offsets.reshape(-1,4)[:,1:].astype(np.int32)
 result=trimesh.Trimesh(vertices=verts,faces=faces,process=False)
 result.fix_normals()
 return result


def fuse_primary_forks(trunk_v, specs,base,pitch=VOXEL_PITCH_M,k=SMOOTH_UNION_K_M):
 if sorted(s[0] for s in specs)!=list(FUSED_BRANCH_IDS):raise ValueError('incorrect selected forks')
 # A single grid contains the entire old trunk plus 3 connected main limbs.
 vs=[np.asarray(trunk_v)]
 for _,c,r in specs:
  c=np.asarray(c); r=np.asarray(r); vs.extend([c-r.max(),c+r.max()])
 mins=np.min(np.vstack(vs),axis=0)-.9
 maxs=np.max(np.vstack(vs),axis=0)+.9
 dims=np.ceil((maxs-mins)/pitch).astype(int)+1
 if np.prod(dims)>12_000_000:raise RuntimeError('SDF grid exceeds 12M voxel budget')
 bark=bark_table(base)
 field=np.empty(tuple(dims),dtype=np.float32)
 # Slabs keep peak RAM bounded. No GPU or paid service needed.
 for start in range(0,int(dims[0]),8):
  end=min(start+8,int(dims[0]))
  xyz=np.stack(np.meshgrid(np.arange(start,end),np.arange(dims[1]),np.arange(dims[2]),indexing='ij'),axis=-1)
  points=mins+xyz.reshape(-1,3).astype(np.float32)*pitch
  sd=evaluate_trunk(points,bark)
  for _,c,r in specs:
   arm=evaluate_arm(points,np.asarray(c),np.asarray(r))
   sd=smin(sd,arm,k)
  field[start:end,:,:]=sd.reshape((end-start,dims[1],dims[2]))
 verts,faces,normals,values=marching_cubes(field,level=0,spacing=(pitch,pitch,pitch),allow_degenerate=False)
 verts+=mins
 mesh=trimesh.Trimesh(vertices=verts.astype(np.float32),faces=faces.astype(np.int32),process=False)
 mesh.fix_normals()
 components_before=mesh.split(only_watertight=False)
 main=max(components_before,key=lambda c:len(c.faces))
 dust=[len(c.faces) for c in components_before if len(c.faces)!=len(main.faces)]
 # Tiny high-frequency bark voxel specks are not part of the joined solid.
 mesh=smooth_and_reduce(main)
 comps=mesh.split(only_watertight=False)
 report={
  'method':'implicit SDF polynomial smooth-min continuous trunk+3 full branches, one marching-cubes surface',
  'ids':list(FUSED_BRANCH_IDS),'voxelPitchMeters':pitch,'smoothUnionKmeters':k,
  'gridDimensions':dims.tolist(),'voxels':int(np.prod(dims)),
  'discardedTinyIsoIslands':len(dust),'discardedTinyFaces':sum(dust),
  'unifiedSurfaceTriangles':int(len(mesh.faces)),'unifiedSurfaceVertices':int(len(mesh.vertices)),
  'isWatertight':bool(mesh.is_watertight),'faceConnectedComponents':len(comps),
  'componentFaces':sorted((len(c.faces) for c in comps),reverse=True)[:20],
  'eulerNumber':int(mesh.euler_number),'windingConsistent':bool(mesh.is_winding_consistent),
  'degenerate':int(np.sum(mesh.area_faces<1e-10)),
  'bbox':np.round(mesh.bounds,4).tolist(),
 }
 if not report['isWatertight'] or report['faceConnectedComponents']!=1 or report['degenerate']:
  raise RuntimeError('SDF unified surface invalid: '+repr(report))
 return np.asarray(mesh.vertices),np.asarray(mesh.faces),report


def project_inset_gold_ribbons(gold_chunks, unified_vertices, unified_faces, surface_offset_m=.012):
 """Follow new fused SDF bark with ORIGINAL flat gold ribbon triangles.

 Closest-surface projection preserves the R14 narrow matte fissure motif,
 not a tube/wire. 12 mm above the polygon skin avoids voxel/decimation
 occlusion; source metallic/albedo/emissive remain byte-identical to R14.
 """
 poly=vtk.vtkPolyData()
 pts=vtk.vtkPoints();pts.SetData(numpy_to_vtk(np.asarray(unified_vertices,dtype=np.float32),deep=True))
 poly.SetPoints(pts)
 f=np.asarray(unified_faces,dtype=np.int64)
 cells=vtk.vtkCellArray()
 cells.SetCells(len(f),numpy_to_vtkIdTypeArray(np.column_stack((np.full(len(f),3),f)).astype(np.int64).ravel(),deep=True))
 poly.SetPolys(cells)
 locator=vtk.vtkStaticCellLocator();locator.SetDataSet(poly);locator.BuildLocator()
 updated=[];distances=[]
 for v,face in gold_chunks:
  new=[]
  for p in np.asarray(v):
   closest=[0.,0.,0.];cid=vtk.mutable(0);sid=vtk.mutable(0);dist2=vtk.mutable(0.)
   locator.FindClosestPoint([float(x) for x in p],closest,cid,sid,dist2)
   tri=np.asarray(unified_vertices)[f[int(cid)]]
   normal=np.cross(tri[1]-tri[0],tri[2]-tri[0]);norm=np.linalg.norm(normal)
   if norm<1e-12:raise RuntimeError('Invalid SDF triangle normal')
   normal/=norm
   new.append(np.asarray(closest)+normal*surface_offset_m)
   distances.append(float(math.sqrt(dist2)))
  updated.append((np.asarray(new,dtype=np.float32),face))
 return updated,{'goldRibbonCount':len(gold_chunks),'goldVertexCount':len(distances),
                 'goldProjectionMeanMeters':round(float(np.mean(distances)),5),
                 'goldProjectionMaxMeters':round(float(np.max(distances)),5),
                 'ribbonOffsetMeters':surface_offset_m,
                 'type':'flat inset triangles, not cylindrical emissive cords'}
