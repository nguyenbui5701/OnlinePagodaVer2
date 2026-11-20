"""OnlinePagodaV2 — original procedural visual-artist sakura study.
Generates REAL watertight-ish bark mesh, separate flower/canopy 3D geometry, and GLB LOD.
No use of TikTok video pixels in meshes.  Runs locally with numpy + trimesh.
Editable source prototype; Blender .blend authoring awaits local Blender availability.
"""
import os, math, random, json, hashlib, io, argparse
from collections import defaultdict
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

OUTPUT = os.environ.get('SAKURA_OUTPUT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output'))
os.makedirs(OUTPUT,exist_ok=True)

PALETTE={
 'bark_dark': ('Trunk_bark_plumblack', [30, 13, 35, 255]),
 'bark_mid': ('Branches_plum', [42, 19, 49, 255]),
 'gold': ('Golden_bark_veins', [255, 191, 110, 255]),
 'shade': ('Canopy_depth_rose', [214, 133, 164, 255]),
 'rose': ('Canopy_rose', [238, 148, 175, 255]),
 'peach': ('Canopy_peach', [245, 177, 174, 255]),
 'pink': ('Sakura_petal_pink', [248, 181, 199, 255]),
 'blush': ('Sakura_petal_blush', [252, 209, 212, 255]),
 'cream': ('Sakura_petal_cream', [251, 220, 202, 255]),
 'warm': ('Sakura_petal_warm_rose', [248, 159, 177, 255]),
 'flower_center':('Sakura_flower_gold', [255, 208, 132, 255]),
}

class Aggregate:
 def __init__(self, petal_mode='single'):
  self.chunks=defaultdict(list)
  self.petal_mode=petal_mode
 def add(self,mat,verts,faces):
  if not len(verts) or not len(faces):return
  self.chunks[mat].append((np.asarray(verts,dtype=np.float32),np.asarray(faces,dtype=np.int32)))
 def tube(self,mat,pts,radii,sides=8,rough=0.0,seed=0):
  pts=np.asarray(pts,dtype=float); n=len(pts)
  if n<2:return
  # Use Frenet-like tangent with stable reference axis.
  verts=[]; faces=[]
  rng=random.Random(seed)
  for i,p in enumerate(pts):
   t=pts[min(n-1,i+1)]-pts[max(0,i-1)]; t=t/(np.linalg.norm(t)+1e-10)
   a=np.array([0.,0.,1.]);
   if abs(float(np.dot(a,t)))>.94:a=np.array([1.,0.,0.])
   b=np.cross(t,a); b=b/(np.linalg.norm(b)+1e-10)
   c=np.cross(t,b)
   for j in range(sides):
    th=2*math.pi*j/sides
    factor=1+(rng.random()*2-1)*rough
    verts.append(p+float(radii[i])*factor*(math.cos(th)*b+math.sin(th)*c))
  for i in range(n-1):
   for j in range(sides):
    a=i*sides+j; b=i*sides+(j+1)%sides; c=(i+1)*sides+j; d=(i+1)*sides+(j+1)%sides
    faces.extend([(a,b,c),(b,d,c)])
  # end caps
  start=len(verts);verts.append(pts[0]);end=len(verts);verts.append(pts[-1]);
  for j in range(sides):
   faces.append((start,(j+1)%sides,j))
   k=(n-1)*sides;faces.append((end,k+j,k+(j+1)%sides))
  self.add(mat,verts,faces)
 def ico(self,mat,center,axes,sub=1,noise=0.06,seed=0):
  rng=np.random.default_rng(seed)
  m=trimesh.creation.icosphere(subdivisions=sub,radius=1.0)
  v=m.vertices.copy()
  # Irregular but smooth-ish radial silhouette at each lobe
  v*=np.clip(1+rng.normal(0,noise,len(v)),0.7,1.3)[:,None]
  self.add(mat,v*np.asarray(axes)+np.asarray(center),m.faces)
 def flower(self,material,loc,norm,scale,rot,center=False):
  norm=np.asarray(norm,dtype=float); norm=norm/(np.linalg.norm(norm)+1e-12)
  up=np.array([0.,1.,0.])
  if abs(float(np.dot(up,norm)))>.91:up=np.array([0.,0.,1.])
  u=np.cross(up,norm);u=u/(np.linalg.norm(u)+1e-12)
  v=np.cross(norm,u)
  loc=np.asarray(loc,dtype=float)
  vertices=[]; faces=[]
  # 5 broad cherry petals, with realistic petal gaps and gentle 3D curl (3 triangles/petal).
  for k in range(5):
   ang=rot+2*math.pi*k/5
   dire=math.cos(ang)*u+math.sin(ang)*v
   side=-math.sin(ang)*u+math.cos(ang)*v
   p0=loc+norm*(0.012*scale)
   p1=loc+dire*(0.47*scale)+side*(0.28*scale)+norm*(0.15*scale)
   p2=loc+dire*(0.84*scale)+norm*(0.24*scale)
   p3=loc+dire*(0.47*scale)-side*(0.28*scale)+norm*(0.15*scale)
   p4=loc+dire*(0.53*scale)+norm*(0.31*scale)
   ix=len(vertices);vertices.extend([p0,p1,p2,p3,p4]);faces.extend([(ix,ix+4,ix+1),(ix+1,ix+4,ix+2),(ix+4,ix+3,ix+2)])
  # SA B3 ablation: normally ONE actual petal surface plus glTF doubleSided PBR.
  # Optional R06 test: duplicate offset back faces for matched PBR comparison.
  # Explicit backs are not automatically a shading fix; need compare on GLB render.
  if self.petal_mode=='explicit':
   n=len(vertices)
   back=[np.asarray(p)-norm*(.018*scale) for p in vertices]
   backfaces=[(i+n,k+n,j+n) for i,j,k in faces]
   self.add(material,vertices+back,faces+backfaces)
  else:
   self.add(material,vertices,faces)
  if center:
   # A few golden flower hearts, rather than all flowers to keep material bandwidth small.
   r=scale*.12;c=loc+norm*(scale*.29)
   self.add('flower_center',[c+norm*r,c+u*r,c+v*r,c-u*r,c-v*r],[(0,1,2),(0,2,3),(0,3,4),(0,4,1)])
 def make_scene(self,assetId):
  s=trimesh.Scene()
  for name,pack in self.chunks.items():
   if not pack:continue
   vertex=[]; face=[];ofs=0
   for v,f in pack:
    vertex.append(v);face.append(f+ofs);ofs+=len(v)
   v=np.concatenate(vertex,axis=0);f=np.concatenate(face,axis=0)
   color=PALETTE[name][1]
   mat=PBRMaterial(name=PALETTE[name][0],baseColorFactor=color,metallicFactor=0.0,roughnessFactor=.88,
          doubleSided=True if name in ['pink','blush','cream','warm'] else False)
   if name in ['pink','blush','cream','warm']:
    mat.emissiveFactor=[0.38,0.20,0.23]
   if name in ['shade','rose','peach']:
    mat.emissiveFactor=[0.20,0.09,0.12]
   if name=='gold':
    mat.emissiveFactor=[0.46,0.20,0.04];mat.roughnessFactor=.65
   mesh=trimesh.Trimesh(vertices=v,faces=f,process=False,visual=TextureVisuals(material=mat))
   mesh.fix_normals(multibody=True)
   s.add_geometry(mesh,geom_name=PALETTE[name][0],node_name=PALETTE[name][0])
  return s

def lerp(a,b,t):return a*(1-t)+b*t

def trunk_curve(t):
 # Asymmetric ancient-trunk sweep; twisted lateral lean and changing curvature.
 return np.array([1.75*math.sin(1.66*t)+.90*t*t +.31*math.sin(7.4*t)*t,
                  10.3*t, 1.12*math.sin(2.30*t+.13)-.14+.41*math.sin(8.3*t)*t])

def generate(density='quality',seed=12606,petal_mode='single'):
 rng=random.Random(seed)
 a=Aggregate(petal_mode)
 high=(density=='quality')
 ring=22 if high else 15
 tvals=np.linspace(0,1,ring)
 tpts=[trunk_curve(t) for t in tvals]
 rads=[2.56*(1-.69*t**.68)*(1+.09*math.sin(11*t)+.05*math.sin(23*t)) for t in tvals]
 a.tube('bark_dark',tpts,rads,16 if high else 11,rough=.08,seed=1)
 # buttress roots around base, dimension ~5-6m across
 for k in range(11 if high else 8):
  ang=(k/11)*2*math.pi+.26*math.sin(k*6.7)
  d=np.array([math.cos(ang),0,math.sin(ang)])
  pts=[]
  for j in range(8):
   t=j/7
   pos=trunk_curve(.09*(1-t))+d*(1.22+t*(4.45+.87*math.sin(k*2.3)))+np.array([.4*math.sin(4*t+k)*t,0,.3*math.sin(3*t+k)*t])
   pos[1]=1.04*(1-t)**1.8 - .28*t
   pts.append(pos)
  a.tube('bark_dark',pts,[.94*(1-j/8)**1.35+.06 for j in range(8)],9 if high else 7,rough=.09,seed=101+k)
 # Major twisting limbs; these are 3D and not flattened into canopy planes.
 branch_paths=[]; twigs=[]
 for i in range(10 if high else 8):
  phase=2*math.pi*i/10+.43*math.sin(3.2*i)+.16*math.cos(2.3*i)
  root_t=.45+.36*((i*7)%9)/9
  origin=trunk_curve(root_t)
  length=7.6+6.4*rng.random()
  h=12.0+5.3*rng.random()
  az=np.array([math.cos(phase),0,math.sin(phase)])
  tangent=np.array([-math.sin(phase),0,math.cos(phase)])
  pts=[]
  for j in range(10):
   t=j/9
   xz=az*length*(t**1.16)+tangent*(2.05*math.sin(t*math.pi)+.93*math.sin(t*5.3+i))
   y=(h-origin[1])*t+3.1*math.sin(t*math.pi)*(1-t*.4)+.72*math.sin(t*6.4+i)*t
   pts.append(origin+xz+np.array([0,y,0]))
  rs=[(.93+.22*math.sin(i))*(1-t)**1.28+.055 for t in np.linspace(0,1,len(pts))]
  a.tube('bark_mid',pts,rs,10 if high else 7,rough=.07,seed=i+3)
  branch_paths.append((pts,rs))
  # twigs & drooping tributaries towards the eye-level canopy perimeter
  for j in range(4 if high else 2):
   frac=.47+.15*j+.08*rng.random();idx=int(frac*9)
   p=pts[idx];sgn=(-1 if j%2 else 1)
   zdir=(az*(.15+.5*rng.random())+tangent*sgn*.75);zdir=zdir/(np.linalg.norm(zdir)+1e-12)
   ext=(2.0+3.2*rng.random())
   dest=p+zdir*ext+np.array([0,(.5+.8*rng.random()) if j==0 else -(1.3+rng.random()),0])
   sp=[lerp(p,dest,t)+np.array([.35*math.sin(t*math.pi+j),1.05*math.sin(math.pi*t),.25*math.sin(t*6.0+i)*t]) for t in np.linspace(0,1,9)]
   a.tube('bark_mid',sp,[.25*(1-t)+.032 for t in np.linspace(0,1,9)],7 if high else 6,seed=i*13+j)
   twigs.append(dest)
 # Broken/split golden bark ridges; avoid uniform fluorescent parallel stripes
 for k in range(15 if high else 10):
  ang=2*math.pi*k/15+.34*math.sin(k*5.0)
  low_t=.06+.33*rng.random();end_t=min(.98,low_t+.28+.44*rng.random())
  pts=[];rads=[]
  for j in range(18):
   t=low_t+(end_t-low_t)*j/17
   p=trunk_curve(t);rad=2.56*(1-.69*t**.68)*(1+.09*math.sin(11*t)+.05*math.sin(23*t))
   ag=ang+1.12*t+.20*math.sin(9*t+k)+.11*math.sin(21*t+k*.5)
   pts.append(p+(rad*1.065)*np.array([math.cos(ag),0,math.sin(ag)]))
   rads.append((.075+.038*math.sin(4*k))*(math.sin(math.pi*j/17)**.5)+.007)
  a.tube('gold',pts,rads,5 if high else 4,seed=k)
 # additional fine luminous vein paths through larger primary branches, tapered
 for i in range(9 if high else 6):
  bp,rs=branch_paths[i]
  vpts=[]
  for j,p in enumerate(bp):
   tangent=(bp[min(len(bp)-1,j+1)]-bp[max(0,j-1)])
   tangent/=np.linalg.norm(tangent)+1e-9
   radial=np.cross(tangent,np.array([0,1.,0]));radial/=np.linalg.norm(radial)+1e-9
   vpts.append(p+radial*(rs[j]*1.08))
  a.tube('gold',vpts,[.072*(1-j/len(vpts))+.010 for j in range(len(vpts))],5,seed=33+i)
 # Volumetric canopy lobe geometry, optional smooth shape breakup; fully 3D.
 lobes=[]
 n_lobes=84 if high else 46
 for k in range(n_lobes):
  # broad canopy, distributed across projected disk with some open gaps in the centre
  # Cluster into eight uneven bough fans, leave natural breaks/gaps between them.
  fan=k%8
  th=(fan/8)*math.tau+rng.gauss(0,.37)+.22*math.sin(fan*2.0)
  rr=.22+.77*math.sqrt(rng.random())
  x=rr*11.7*math.cos(th);z=rr*10.5*math.sin(th)
  highcap=18.8+2.4*math.sqrt(max(0.,1-rr*rr))
  base=11.3+2.8*(1-rr)
  y=base+(highcap-base)*(.26+.72*rng.random())
  if k%7==0:y-=2.4
  center=np.array([x+.3,y,z-.25])
  ax=np.array([1.84+1.10*rng.random(),.84+.92*rng.random(),1.44+1.16*rng.random()])
  if rr>.80:ax*=.94
  if k%11==0:ax*=1.20
  lobe_tone=('shade' if k%8==0 else ('rose' if k%4==0 else 'peach'))
  # Sculptural lobe volumes are populated by curved five-petal 3D flowers; no rock-like backing spheres.
  # Real, non-billboard closed 3D blossom core with visible warm underside.
  # Surface flowers remain separate mesh and camera parallax persists through gaps.
  a.ico(['rose','peach','shade'][k%3],center,ax*.90,sub=2 if high else 1,noise=.045 if high else .05,seed=1800+k)
  lobes.append((center,ax,k))
 # Scatter individual flowers across 3D lobe surfaces: geometry ~3D curls, not billboard.
 mat_choices=['pink','blush','cream','warm']
 for center,ax,k in lobes:
  n_per=(69 if high else 27) +rng.randrange(21 if high else 9)
  for j in range(n_per):
   nz=rng.uniform(-1,1);phi=rng.uniform(0,math.tau);xy=math.sqrt(1-nz*nz)
   normal=np.array([xy*math.cos(phi), nz, xy*math.sin(phi)])
   pt=center+ax*normal*(.90+.12*rng.random())
   outward=normal/(np.linalg.norm(normal)+1e-12)
   # emphasize visible silhouette around lobe boundaries; still all-angle volumetric
   scale=.72+ .42*rng.random()
   mat=mat_choices[rng.choices([0,1,2,3],weights=[3.0,3.0,2.9,1.1])[0]]
   a.flower(mat,pt,outward,scale,rng.random()*math.tau,center=(j%13==0 and high))
 # dangling blossoms, especially attractive from below
 for i in range(22 if high else 10):
  th=rng.random()*math.tau
  rr=8.0+4*rng.random();center=np.array([rr*math.cos(th),11.8-1.0*rng.random(),rr*.92*math.sin(th)])
  top=center+np.array([.1,1.5,0]);a.tube('bark_mid',[top,lerp(top,center,.5),center],[.037,.026,.012],5,seed=770+i)
  for j in range(18 if high else 7):
   az=rng.random()*math.tau;nz=rng.random()*1.8-.9
   normal=np.array([math.cos(az)*math.sqrt(1-nz*nz),nz,math.sin(az)*math.sqrt(1-nz*nz)])
   a.flower('pink' if j%2 else 'blush',center+normal*(.30+.5*rng.random()),normal,.4+.1*rng.random(),az)
 return a.make_scene('sakura_hero')

def export_variant(scene,filename):
 fn=os.path.join(OUTPUT,filename)
 with open(fn,'wb') as f:f.write(trimesh.exchange.gltf.export_glb(scene))
 return fn

if __name__=='__main__':
 ap=argparse.ArgumentParser(description='Zero-cost R06 Sakura asset producer')
 ap.add_argument('--petal-mode',choices=['single','explicit'],default='single',help='A/B test: one doubleSided petal surface versus duplicated rear faces')
 ap.add_argument('--quality-only',action='store_true')
 args=ap.parse_args()
 scenes={}
 for level,name in [('quality','sakura_hero.glb'),('eco','sakura_hero_eco.glb')]:
  if args.quality_only and level=='eco':continue
  s=generate(level,petal_mode=args.petal_mode)
  fn=export_variant(s,name)
  scenes[level]=(s,fn)
  print(name,os.path.getsize(fn),'tris',sum(len(x.faces) for x in s.geometry.values()),'meshes',len(s.geometry),'bounds',s.bounds.round(2).tolist(),flush=True)
 if not args.quality_only:
  text=trimesh.exchange.obj.export_obj(scenes['quality'][0],include_texture=False,return_texture=False)
  with open(os.path.join(OUTPUT,'sakura_hero_editable.obj'),'w') as f:f.write(text)
  print('OBJ source emitted')