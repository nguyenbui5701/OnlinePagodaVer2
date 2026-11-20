"""Sakura Hero R07: independent zero-cost 3D authoring, PYTHON/TRIMESH.

R07 geometrical response to SA R06 reviews (2026-11-20):
* Fewer exposed LOW-POLY ECO core surfaces: recessed cores + blossom surface coverage,
  quasi-uniform stratified directions biased to top/edge without indiscriminately doubling tris.
* Shared lobe layout QUALITY/ECO; layered, overlapping irregular crown; filled inner ring.
* Taller offset leader instead of low equal-width Y split; tapered braided roots;
  short randomized golden bark fissures in place of continuous parallel ribbons.
* Keeps single-surface glTF doubleSided petals for all primary assets.
* PBR material factors are stable relative to R06 (no Phong material override).

Usage:
  python procedural_sakura_source.py  # writes QUALITY/ECO GLB and editable OBJ
  python procedural_sakura_source.py --quality-only
Requires: numpy, trimesh. No paid services and no runtime renderer code.
"""
import os, math, random, argparse
from collections import defaultdict
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

OUTPUT=os.environ.get('SAKURA_OUTPUT',os.path.join(os.path.dirname(os.path.abspath(__file__)),'output'))
os.makedirs(OUTPUT,exist_ok=True)
PALETTE={
 'bark_dark':('Trunk_bark_plumblack',[29,12,34,255]),
 'bark_mid':('Branches_plum',[42,19,48,255]),
 'gold':('Golden_bark_veins',[255,190,108,255]),
 'shade':('Canopy_depth_rose',[211,128,156,255]),
 'rose':('Canopy_rose',[238,148,173,255]),
 'peach':('Canopy_peach',[246,176,172,255]),
 'pink':('Sakura_petal_pink',[249,183,197,255]),
 'blush':('Sakura_petal_blush',[251,207,208,255]),
 'cream':('Sakura_petal_cream',[248,215,198,255]),
 'warm':('Sakura_petal_warm_rose',[248,158,173,255]),
 'flower_center':('Sakura_flower_gold',[255,208,132,255])}

class Aggregate:
 def __init__(self,petal_detail=3):
  self.chunks=defaultdict(list)
  self.petal_detail=petal_detail  # QUALITY 3 / ECO 2 triangles per petal; 1 sheet only
 def add(self,mat,verts,faces):
  if len(verts) and len(faces):self.chunks[mat].append((np.asarray(verts,dtype=np.float32),np.asarray(faces,dtype=np.int32)))
 def tube(self,mat,pts,radii,sides=8,rough=.0,seed=0):
  pts=np.asarray(pts,dtype=float); n=len(pts)
  if n<2:return
  verts=[];faces=[];rng=random.Random(seed)
  for i,p in enumerate(pts):
   t=pts[min(n-1,i+1)]-pts[max(0,i-1)];t=t/(np.linalg.norm(t)+1e-10)
   a=np.array([0.,0.,1.])
   if abs(float(np.dot(a,t)))>.94:a=np.array([1.,0.,0.])
   b=np.cross(t,a);b/=np.linalg.norm(b)+1e-10;c=np.cross(t,b)
   for j in range(sides):
    th=2*math.pi*j/sides;rad=float(radii[i])*(1+(rng.random()*2-1)*rough)
    verts.append(p+rad*(math.cos(th)*b+math.sin(th)*c))
  for i in range(n-1):
   for j in range(sides):
    aa=i*sides+j;bb=i*sides+(j+1)%sides;cc=(i+1)*sides+j;dd=(i+1)*sides+(j+1)%sides
    faces.extend([(aa,bb,cc),(bb,dd,cc)])
  start=len(verts);verts.append(pts[0]);end=len(verts);verts.append(pts[-1])
  for j in range(sides):
   faces.append((start,(j+1)%sides,j));k=(n-1)*sides;faces.append((end,k+j,k+(j+1)%sides))
  self.add(mat,verts,faces)
 def ico(self,mat,center,axes,sub,noise,seed):
  rng=np.random.default_rng(seed);m=trimesh.creation.icosphere(subdivisions=sub,radius=1)
  v=m.vertices.copy(); az=np.arctan2(v[:,2],v[:,0]);el=v[:,1]
  warp=1+.055*np.sin(az*3+seed*.3)+.08*np.sin(5*el+1.1*az)+rng.normal(0,noise,len(v))
  v*=np.clip(warp,.72,1.25)[:,None]
  self.add(mat,v*np.asarray(axes)+np.asarray(center),m.faces)
 def flower(self,material,loc,norm,scale,rot,center=False):
  norm=np.asarray(norm,dtype=float);norm/=np.linalg.norm(norm)+1e-10
  ref=np.array([0.,1.,0.])
  if abs(float(np.dot(ref,norm)))>.91:ref=np.array([0.,0.,1.])
  u=np.cross(ref,norm);u/=np.linalg.norm(u)+1e-10;v=np.cross(norm,u)
  loc=np.asarray(loc,dtype=float);vertices=[];faces=[]
  for k in range(5):
   ang=rot+2*math.pi*k/5;dire=np.cos(ang)*u+np.sin(ang)*v;side=-np.sin(ang)*u+np.cos(ang)*v
   p0=loc+norm*(.016*scale)
   p1=loc+dire*(.49*scale)+side*(.32*scale)+norm*(.14*scale)
   p2=loc+dire*(.90*scale)+norm*(.23*scale)
   p3=loc+dire*(.49*scale)-side*(.32*scale)+norm*(.14*scale)
   i=len(vertices)
   if self.petal_detail==3:
    p4=loc+dire*(.55*scale)+norm*(.30*scale)
    vertices.extend([p0,p1,p2,p3,p4]);faces.extend([(i,i+4,i+1),(i+1,i+4,i+2),(i+4,i+3,i+2)])
   else:
    vertices.extend([p0,p1,p2,p3]);faces.extend([(i,i+1,i+2),(i,i+2,i+3)])
  self.add(material,vertices,faces)
  if center:
   r=scale*.12;c=loc+norm*(scale*.28)
   self.add('flower_center',[c+norm*r,c+u*r,c+v*r,c-u*r,c-v*r],[(0,1,2),(0,2,3),(0,3,4),(0,4,1)])
 def make_scene(self):
  s=trimesh.Scene()
  for name,chunks in self.chunks.items():
   verts=[];faces=[];offset=0
   for v,f in chunks:verts.append(v);faces.append(f+offset);offset+=len(v)
   verts=np.concatenate(verts,axis=0);faces=np.concatenate(faces,axis=0)
   mat=PBRMaterial(name=PALETTE[name][0],baseColorFactor=PALETTE[name][1],metallicFactor=0.,roughnessFactor=.88,
       doubleSided=name in ('pink','blush','cream','warm'))
   if name in ('pink','blush','cream','warm'):mat.emissiveFactor=[.38,.20,.23]
   if name in ('shade','rose','peach'):mat.emissiveFactor=[.20,.09,.12]
   if name=='gold':mat.emissiveFactor=[.46,.20,.04];mat.roughnessFactor=.65
   mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False,visual=TextureVisuals(material=mat))
   mesh.fix_normals(multibody=True)
   s.add_geometry(mesh,geom_name=PALETTE[name][0],node_name=PALETTE[name][0])
  return s

def trunk_curve(t):
 # Extended slanted leader to eliminate low symmetrical Y, S-curve with slight torsion.
 return np.array([2.10*np.sin(1.56*t)+.80*t*t+.21*np.sin(10.5*t)*t,
                  12.5*t,
                  1.22*np.sin(2.45*t)-.10+.34*np.sin(8.5*t+.2)*t])

def trunk_radius(t):
 return 2.64*(1-.74*t**.62)*(1+.075*np.sin(12*t)+.042*np.sin(29*t))

def lerp(a,b,t):return a*(1-t)+b*t

def build_lobes(rng):
 # A shared 94-lobe golden-angle arrangement. Top fills the central hole, outer tiers
 # alternate heights and aspect ratios, overlap neighbours to avoid R06 fan-islands.
 lobes=[];N=94
 for k in range(N):
  rr=(.055+.93*math.sqrt((k+.5)/N));th=(k*2.399963229728653+ .32*np.sin(k*1.33))%(2*math.pi)
  # jitter, but keep quasi-uniform projected disk coverage
  rr=np.clip(rr+rng.uniform(-.048,.048),.055,.995)
  theta=th+rng.uniform(-.095,.095)
  x=rr*10.9*math.cos(theta);z=rr*10.1*math.sin(theta)
  # inner top layer blocks large hole, outer low skirts give soft depth from camera 15s
  layer=(k*7)%5
  top=18.8+1.8*math.sqrt(max(0.,1-rr*rr))
  y=top +(-3.5 if layer==0 else -1.9 if layer==1 else -.5 if layer==2 else .7 if layer==3 else 1.25)
  y+=rng.uniform(-.75,.75) +.34*np.sin(th*5.0)
  ax=np.array([1.88+rng.random()*1.13,
               1.10+rng.random()*.86,
               1.75+rng.random()*1.08])
  ax*=.94 if rr>.8 else 1.0
  ax*=1+.09*np.sin(4*th+layer)
  c=np.array([x+.25,y,z-.28]);lobes.append((c,ax,k))
 return lobes

def flower_directions(n,k):
 # Balanced hemisphere coverage: ECO spends its petals preferentially where an aerial
 # camera sees them, while still covering the underside. Deterministic, less clumpy
 # than independent random samples and provides petal coverage at silhouettes.
 golden=2.399963229728653
 upper=int(round(n*.71))
 for j in range(n):
  if j<upper:
   nz=.03+.95*(j+.5)/upper       # upper hemisphere stratified
  else:
   nz=-.96+.90*(j-upper+.5)/(n-upper)  # underside stratified
  phi=((j*golden)+.73*k+.12*np.sin(j*1.37+k))%(2*math.pi)
  side=math.sqrt(max(0,1-nz*nz))
  yield j,np.array([side*math.cos(phi),nz,side*math.sin(phi)])

def generate(density='quality',seed=12707):
 high=(density=='quality');rng=random.Random(seed)
 a=Aggregate(petal_detail=3 if high else 2)
 tvals=np.linspace(0,1,31 if high else 22)
 a.tube('bark_dark',[trunk_curve(t) for t in tvals],[trunk_radius(t) for t in tvals],21 if high else 15,rough=.055,seed=21)
 # Braided, off-center buttress roots: nonuniform length, curved sweep, tapered organically.
 root_count=11 if high else 8
 for k in range(root_count):
  angle=2*math.pi*(k/root_count)+.20*np.sin(k*3.3)
  direction=np.array([math.cos(angle),0,math.sin(angle)])
  perp=np.array([-math.sin(angle),0,math.cos(angle)])
  pts=[];rr=[];length=3.6+1.5*rng.random()
  for j in range(10):
   t=j/9
   p=trunk_curve(.085*(1-t))+direction*(1.28+length*t**.86)+perp*(.65*np.sin(math.pi*t)+.27*np.sin(7*t+k)*t)
   p[1]=1.10*(1-t)**1.8-.22*t+.10*np.sin(9*t+k)*t
   pts.append(p);rr.append(.98*(1-t)**1.62+.045)
  a.tube('bark_dark',pts,rr,9 if high else 7,rough=.10,seed=101+k)
 # Unequal branch origin heights and lengths, later branching under higher leader.
 branch_paths=[]
 for i in range(11 if high else 9):
  phase=2*math.pi*i/11+.50*np.sin(3.1*i)+.24*np.cos(2*i)
  root_t=.59+.31*((i*7)%11)/11
  origin=trunk_curve(root_t);length=6.8+6.1*rng.random();h=12+5.2*rng.random()
  radial=np.array([math.cos(phase),0,math.sin(phase)])
  perp=np.array([-math.sin(phase),0,math.cos(phase)])
  pts=[]
  for j in range(12):
   t=j/11
   bend=radial*length*t**1.15+perp*(1.30*np.sin(math.pi*t)+1.13*np.sin(t*5.2+i)*t)
   y=(h-origin[1])*t+2.2*np.sin(math.pi*t)*(1-.5*t)+.48*np.sin(t*8.4+i)*t
   pts.append(origin+bend+np.array([0,y,0]))
  rads=[(.72+.16*np.sin(i*1.2))*(1-t)**1.35+.04 for t in np.linspace(0,1,len(pts))]
  a.tube('bark_mid',pts,rads,9 if high else 7,rough=.1,seed=71+i)
  branch_paths.append((pts,rads))
  for j in range(3 if high else 2):
   q=min(9,int((.43+.13*j+.08*rng.random())*11));p=pts[q];sign=(-1 if j%2 else 1)
   go=radial*(.35+.25*rng.random())+perp*sign*(.65+.4*rng.random());go/=np.linalg.norm(go)+1e-10
   ext=2+2.6*rng.random();dest=p+go*ext+np.array([0,(-1.2 if j else .8)+rng.uniform(-.6,.6),0])
   branch=[lerp(p,dest,t)+np.array([.26*np.sin(5*t+i),.72*np.sin(math.pi*t),.30*np.sin(7*t+j)*t]) for t in np.linspace(0,1,8)]
   a.tube('bark_mid',branch,[.20*(1-t)**1.2+.02 for t in np.linspace(0,1,8)],6 if high else 5,rough=.05,seed=141+i*7+j)
 # Localized gold splinters and sinuous discontinuous bark fissures, NOT long cables.
 for k in range(30 if high else 19):
  angle=rng.uniform(0,2*math.pi);t0=.055+rng.random()*.78;dt=.06+.14*rng.random()
  pts=[];radii=[]
  samples=8 if high else 6
  for j in range(samples):
   u=j/(samples-1);t=min(.98,t0+u*dt)
   theta=angle+.38*np.sin(u*2*math.pi+k*.22)+.14*np.sin(7*u+k)
   pos=trunk_curve(t)+trunk_radius(t)*1.04*np.array([math.cos(theta),0,math.sin(theta)])
   pts.append(pos);radii.append(.008+.055*(math.sin(math.pi*u)**.65)*(.60+.35*np.sin(k*2.1)**2))
  a.tube('gold',pts,radii,4,rough=.11,seed=k+230)
 for i in range(9 if high else 5):
  bp,rs=branch_paths[i]
  for m in (0,1):
   if m==1 and not high:continue
   start=2+m*3;stop=min(len(bp)-1,start+4)
   vpts=[];radii=[]
   for j in range(start,stop+1):
    p=bp[j];tang=bp[min(len(bp)-1,j+1)]-bp[max(0,j-1)];tang/=np.linalg.norm(tang)+1e-8
    side=np.cross(tang,[0,1,0]);side/=np.linalg.norm(side)+1e-8
    vpts.append(p+side*(rs[j]*1.045));frac=(j-start)/max(1,stop-start)
    radii.append(.008+.038*np.sin(math.pi*frac)**.8)
   a.tube('gold',vpts,radii,4,seed=810+i*2+m)
 # Shared canopy distribution QUALITY/ECO (no independent 8-fan holes)
 lobes=build_lobes(random.Random(seed+33))
 if not high:
  # Distribution-preserving thinning: alternate golden-angle centers, not only some fans.
  selected=set(round(i*(len(lobes)-1)/57) for i in range(58))
  lobes=[v for idx,v in enumerate(lobes) if idx in selected]
  # ECO targeted bridges at central and lateral gaps seen from the SA 15s aerial.
  # Add only 5 strategic blossom groups, avoiding uniform global polygon doubling.
  bridges=[(-6.3, 3.7, 19.2, 2.50, 1.54, 2.34),
           (-4.3, 4.4, 19.7, 2.31, 1.45, 2.20),
           (-.1,-1.2, 19.8, 2.26, 1.42, 2.20),
           (3.9, .3, 18.8, 2.31, 1.50, 2.17),
           (1.2, 3.7, 18.3, 2.14, 1.48, 1.96)]
  for ii,(xx,zz,yy,aa,bb,cc) in enumerate(bridges):
   lobes.append((np.array([xx,yy,zz]),np.array([aa,bb,cc]),1000+ii))
 for c,ax,k in lobes:
  # Recess cores behind the flower surface: faceted ECO core no longer reaches petal tips.
  coreScale=.69 if high else .57
  a.ico(('shade' if k%9==0 else 'rose' if k%4==0 else 'peach'),c,ax*coreScale,
        sub=2 if high else 1,noise=.022 if high else .038,seed=1900+k)
 # Flower cover density is strategically optimized ECO: each flower uses 10 rather
 # than 15 tris, while 56-67 smaller overlapping blossoms distribute across the
 # visible lobe upper hemisphere (roughly same total triangles as R06 ECO).
 mats=['pink','blush','cream','warm']
 for c,ax,k in lobes:
  n=(68+(k*17)%22) if high else (44+(k*17)%12)
  for j,norm in flower_directions(n,k):
   # Complement visible cap + side; varying radius makes fuzzy non-convex silhouette.
   stretch=.85+.22*(.5+.5*np.sin(k*.67+j*2.39))+.08*rng.random()
   pt=c+ax*norm*stretch
   scale=(.72+.24*rng.random()) if high else (.93+.23*rng.random())
   # Keep warm peach-pink, avoid blown-out dominant pale cream.
   mat=mats[rng.choices([0,1,2,3],weights=[3.1,3.1,1.25,1.45])[0]]
   a.flower(mat,pt,norm,scale,rng.random()*2*math.pi,center=(high and j%22==0))
 # A few draped twig blossoms (small, low overhead)
 for i in range(21 if high else 10):
  angle=rng.random()*2*math.pi;rad=8.7+3*rng.random()
  loc=np.array([rad*math.cos(angle),11.4-rng.random()*1.2,rad*math.sin(angle)])
  a.tube('bark_mid',[loc+[0,1.4,0],loc+[.16,.7,-.14],loc],[.045,.03,.012],5,seed=912+i)
  for j in range(14 if high else 6):
   norm=np.array([math.cos(j*2.4),-.7+rng.random()*1.5,math.sin(j*2.4)]);norm/=np.linalg.norm(norm)
   a.flower('pink' if j%2 else 'blush',loc+norm*(.25+rng.random()*.5),norm,.36+.10*rng.random(),j)
 return a.make_scene()

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--quality-only',action='store_true');args=ap.parse_args()
 scenes={}
 for typ,name in [('quality','sakura_hero.glb'),('eco','sakura_hero_eco.glb')]:
  if args.quality_only and typ=='eco':continue
  scene=generate(typ);target=os.path.join(OUTPUT,name)
  data=trimesh.exchange.gltf.export_glb(scene)
  with open(target,'wb') as f:f.write(data)
  scenes[typ]=scene
  print(name,'bytes',len(data),'triangles',sum(len(g.faces) for g in scene.geometry.values()),'meshes',len(scene.geometry),'bounds',scene.bounds.round(3).tolist(),flush=True)
 if not args.quality_only:
  obj=trimesh.exchange.obj.export_obj(scenes['quality'],include_texture=False,return_texture=False)
  with open(os.path.join(OUTPUT,'sakura_hero_editable.obj'),'w') as f:f.write(obj)
  print('editable OBJ emitted',flush=True)
