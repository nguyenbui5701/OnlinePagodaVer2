"""OnlinePagodaV2 — original procedural visual-artist sakura study.
Generates REAL polygon bark mesh, separate flower/canopy 3D geometry, and GLB LOD.
No use of TikTok video pixels in meshes. Runs locally with numpy + trimesh.
Editable source prototype; Blender .blend authoring awaits local Blender availability.
"""
import os, math, random
from collections import defaultdict
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

OUTPUT = os.environ.get("SAKURA_OUTPUT", os.path.dirname(os.path.abspath(__file__)))
os.makedirs(OUTPUT,exist_ok=True)

PALETTE={
 'bark_dark': ('Trunk_bark_plumblack', [29, 13, 32, 255]),
 'bark_mid': ('Branches_plum', [42, 20, 43, 255]),
 'gold': ('Golden_bark_veins', [255, 185, 100, 255]),
 'shade': ('Canopy_depth_rose', [161, 88, 124, 255]),
 'rose': ('Canopy_rose', [224, 139, 166, 255]),
 'peach': ('Canopy_peach', [250, 173, 164, 255]),
 'pink': ('Sakura_petal_pink', [255, 184, 206, 255]),
 'blush': ('Sakura_petal_blush', [255, 211, 215, 255]),
 'cream': ('Sakura_petal_cream', [255, 225, 196, 255]),
 'warm': ('Sakura_petal_warm_rose', [242, 155, 171, 255]),
 'flower_center':('Sakura_flower_gold', [255, 208, 132, 255]),
}

class Aggregate:
 def __init__(self):self.chunks=defaultdict(list)
 def add(self,mat,verts,faces):
  if not len(verts) or not len(faces):return
  self.chunks[mat].append((np.asarray(verts,dtype=np.float32),np.asarray(faces,dtype=np.int32)))
 def tube(self,mat,pts,radii,sides=8,rough=0.0,seed=0):
  pts=np.asarray(pts,dtype=float);n=len(pts)
  if n<2:return
  verts=[];faces=[]
  rng=random.Random(seed)
  for i,p in enumerate(pts):
   t=pts[min(n-1,i+1)]-pts[max(0,i-1)];t=t/(np.linalg.norm(t)+1e-10)
   a=np.array([0.,0.,1.]);
   if abs(float(np.dot(a,t)))>.94:a=np.array([1.,0.,0.])
   b=np.cross(t,a);b=b/(np.linalg.norm(b)+1e-10)
   c=np.cross(t,b)
   for j in range(sides):
    th=2*math.pi*j/sides
    factor=1+(rng.random()*2-1)*rough
    verts.append(p+float(radii[i])*factor*(math.cos(th)*b+math.sin(th)*c))
  for i in range(n-1):
   for j in range(sides):
    a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+j;d=(i+1)*sides+(j+1)%sides
    faces.extend([(a,b,c),(b,d,c)])
  start=len(verts);verts.append(pts[0]);end=len(verts);verts.append(pts[-1])
  for j in range(sides):
   faces.append((start,(j+1)%sides,j))
   k=(n-1)*sides;faces.append((end,k+j,k+(j+1)%sides))
  self.add(mat,verts,faces)
 def flower(self,material,loc,norm,scale,rot,center=False):
  norm=np.asarray(norm,dtype=float);norm=norm/(np.linalg.norm(norm)+1e-12)
  up=np.array([0.,1.,0.])
  if abs(float(np.dot(up,norm)))>.91:up=np.array([0.,0.,1.])
  u=np.cross(up,norm);u=u/(np.linalg.norm(u)+1e-12)
  v=np.cross(norm,u)
  loc=np.asarray(loc,dtype=float)
  vertices=[];faces=[]
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
  self.add(material,vertices,faces)
  if center:
   r=scale*.12;c=loc+norm*(scale*.29)
   self.add('flower_center',[c+norm*r,c+u*r,c+v*r,c-u*r,c-v*r],[(0,1,2),(0,2,3),(0,3,4),(0,4,1)])
 def make_scene(self,assetId):
  s=trimesh.Scene()
  for name,pack in self.chunks.items():
   if not pack:continue
   vertex=[];face=[];ofs=0
   for v,f in pack:
    vertex.append(v);face.append(f+ofs);ofs+=len(v)
   v=np.concatenate(vertex,axis=0);f=np.concatenate(face,axis=0)
   color=PALETTE[name][1]
   mat=PBRMaterial(name=PALETTE[name][0],baseColorFactor=color,metallicFactor=0.0,roughnessFactor=.88,
          doubleSided=True if name in ['pink','blush','cream','warm'] else False)
   if name in ['pink','blush','cream','warm']:
    mat.emissiveFactor=[0.33,0.20,0.24]
   if name=='gold':
    mat.emissiveFactor=[0.55,0.24,0.05];mat.roughnessFactor=.65
   mesh=trimesh.Trimesh(vertices=v,faces=f,process=False,visual=TextureVisuals(material=mat))
   mesh.fix_normals()
   s.add_geometry(mesh,geom_name=PALETTE[name][0],node_name=PALETTE[name][0])
  return s

def lerp(a,b,t):return a*(1-t)+b*t

def trunk_curve(t):
 return np.array([.65*math.sin(2.1*t)-.35*t,9.2*t, .46*math.sin(3.4*t)+.33*t])

def generate(density='quality',seed=12408):
 rng=random.Random(seed)
 a=Aggregate()
 high=(density=='quality')
 ring=22 if high else 15
 tvals=np.linspace(0,1,ring)
 tpts=[trunk_curve(t) for t in tvals]
 rads=[1.45*(1-.55*t**.5)*(1+.13*math.sin(15*t)) for t in tvals]
 a.tube('bark_dark',tpts,rads,13 if high else 10,rough=.07,seed=1)
 for k in range(8 if high else 6):
  ang=(k/8)*2*math.pi+.13*math.sin(k*17)
  d=np.array([math.cos(ang),0,math.sin(ang)])
  pts=[]
  for j in range(8):
   t=j/7
   pos=trunk_curve(.04*(1-t)) + d*(.72+t*(2.6+.4*math.sin(k)))
   pos[1]=.47*(1-t)**1.4 - .13*t
   pts.append(pos)
  a.tube('bark_dark',pts,[.50*(1-j/8)**1.3+.035 for j in range(8)],7,rough=.08,seed=101+k)
 branch_paths=[];twigs=[]
 for i in range(11):
  phase=2*math.pi*i/11+.16*math.sin(4*i)
  root_t=.54+.25*((i*7)%9)/9
  origin=trunk_curve(root_t)
  length=9.3+4.7*rng.random()
  h=10.8+3.7*rng.random()
  az=np.array([math.cos(phase),0,math.sin(phase)])
  tangent=np.array([-math.sin(phase),0,math.cos(phase)])
  pts=[]
  for j in range(10):
   t=j/9
   xz=az*length*(t**.84)+tangent*(.65*math.sin(t*math.pi)+.35*math.sin(t*6+i))
   y=(h-origin[1])*t+2.25*math.sin(t*math.pi)*(1-t*.5)
   pts.append(origin+xz+np.array([0,y,0]))
  rs=[(.54+.13*math.sin(i))*(1-t)**1.45+.038 for t in np.linspace(0,1,len(pts))]
  a.tube('bark_mid',pts,rs,8 if high else 6,rough=.055,seed=i+3)
  branch_paths.append((pts,rs))
  for j in range(3 if high else 2):
   frac=.47+.15*j+.08*rng.random();idx=int(frac*9)
   p=pts[idx];sgn=(-1 if j%2 else 1)
   zdir=(az*(.15+.5*rng.random())+tangent*sgn*.75);zdir=zdir/(np.linalg.norm(zdir)+1e-12)
   ext=(1.6+2.6*rng.random())
   dest=p+zdir*ext+np.array([0,(.5+.8*rng.random()) if j==0 else -(1.3+rng.random()),0])
   sp=[lerp(p,dest,t)+np.array([0,.65*math.sin(math.pi*t),0]) for t in np.linspace(0,1,7)]
   a.tube('bark_mid',sp,[.17*(1-t)+.022 for t in np.linspace(0,1,7)],6 if high else 5,seed=i*13+j)
   twigs.append(dest)
 for k in range(8 if high else 5):
  ang=2*math.pi*k/8+.27
  pts=[]
  for j in range(25):
   t=j/24*.93
   p=trunk_curve(t);rad=1.45*(1-.55*t**.5)*(1+.13*math.sin(15*t))
   ag=ang+1.25*t+0.14*math.sin(4*math.pi*t+k)
   pts.append(p+(rad*1.035)*np.array([math.cos(ag),0,math.sin(ag)]))
  a.tube('gold',pts,[.046*(1-t)+.012 for t in np.linspace(0,1,len(pts))],5,seed=k)
 for i in range(7 if high else 4):
  bp,rs=branch_paths[i]
  vpts=[]
  for j,p in enumerate(bp):
   tangent=(bp[min(len(bp)-1,j+1)]-bp[max(0,j-1)])
   tangent/=np.linalg.norm(tangent)+1e-9
   radial=np.cross(tangent,np.array([0,1.,0]));radial/=np.linalg.norm(radial)+1e-9
   vpts.append(p+radial*(rs[j]*1.08))
  a.tube('gold',vpts,[.035*(1-j/len(vpts))+.010 for j in range(len(vpts))],4,seed=33+i)
 lobes=[]
 n_lobes=125 if high else 76
 for k in range(n_lobes):
  th=rng.uniform(0,math.tau);rr=math.sqrt(rng.random())
  x=rr*11.0*math.cos(th);z=rr*10.4*math.sin(th)
  highcap=17.8+3.7*math.sqrt(max(0.,1-rr*rr))
  base=11.4+2.0*(1-rr)
  y=base+(highcap-base)*(.24+.7*rng.random())
  if k%11==0:y-=1.7
  center=np.array([x+.3,y,z-.25])
  ax=np.array([1.55+.8*rng.random(),1.08+.58*rng.random(),1.37+.84*rng.random()])
  if rr>.75:ax*=.85
  if k%13==0:ax*=1.2
  lobes.append((center,ax,k))
 mat_choices=['pink','blush','cream','warm']
 for center,ax,k in lobes:
  n_per=(112 if high else 52) +rng.randrange(22 if high else 14)
  for j in range(n_per):
   nz=rng.uniform(-1,1);phi=rng.uniform(0,math.tau);xy=math.sqrt(1-nz*nz)
   normal=np.array([xy*math.cos(phi),nz,xy*math.sin(phi)])
   pt=center+ax*normal*(.91+.13*rng.random())
   outward=normal/(np.linalg.norm(normal)+1e-12)
   scale=.59+.27*rng.random()
   mat=mat_choices[rng.choices([0,1,2,3],weights=[3.3,3.1,1.9,1.7])[0]]
   a.flower(mat,pt,outward,scale,rng.random()*math.tau,center=(j%13==0 and high))
 for i in range(33 if high else 17):
  th=rng.random()*math.tau
  rr=10.3+3*rng.random();center=np.array([rr*math.cos(th),10.4-1.8*rng.random(),rr*.92*math.sin(th)])
  top=center+np.array([.1,1.5,0]);a.tube('bark_mid',[top,lerp(top,center,.5),center],[.037,.026,.012],5,seed=770+i)
  for j in range(18 if high else 8):
   az=rng.random()*math.tau;nz=rng.random()*1.8-.9
   normal=np.array([math.cos(az)*math.sqrt(1-nz*nz),nz,math.sin(az)*math.sqrt(1-nz*nz)])
   a.flower('pink' if j%2 else 'blush',center+normal*(.30+.5*rng.random()),normal,.4+.1*rng.random(),az)
 return a.make_scene('sakura_hero')

def export_variant(scene,filename):
 fn=os.path.join(OUTPUT,filename)
 with open(fn,'wb') as f:f.write(trimesh.exchange.gltf.export_glb(scene))
 return fn

if __name__=='__main__':
 scenes={}
 for level,name in [('quality','sakura_hero.glb'),('eco','sakura_hero_eco.glb')]:
  scene=generate(level)
  fn=export_variant(scene,name)
  scenes[level]=(scene,fn)
  print(name,os.path.getsize(fn),'tris',sum(len(x.faces) for x in scene.geometry.values()),'meshes',len(scene.geometry),'bounds',scene.bounds.round(2).tolist())
 fullscene=scenes['quality'][0]
 obj=trimesh.exchange.obj.export_obj(fullscene,include_texture=False,return_texture=False)
 with open(os.path.join(OUTPUT,'sakura_hero_editable.obj'),'w') as f:f.write(obj)
 print('OBJ source emitted')
