"""Sakura Hero R16: selective SDF refinement from immutable R15, PYTHON/TRIMESH.

R16 targeted response to SA R15 Cycles review #6004773600:
* QUALITY palette and low-emissive values byte-for-byte unchanged from R14.
* Curled asymmetric oval petals within original FOUR triangles/petal.
* No serialized flower NORMAL arrays: palette-only Cycles A/B shows no 49% byte-cost benefit.
* All 11 main arms and one selected secondary joined to trunk via true SDF smooth union.
* ECO geometry, materials and SHA are EXACT original R10 carry-forward.
* Embedded gold fissures preserved; no extra external textures or paid assets.

Usage:
  python procedural_sakura_source.py  # writes QUALITY/ECO GLB and editable OBJ
  python procedural_sakura_source.py --quality-only
Requires: numpy, scipy, scikit-image, vtk, trimesh. No paid services and no runtime renderer code.
"""
import os, math, random, argparse
from collections import defaultdict
import numpy as np
import trimesh
from r16_fork_union import FUSED_BRANCH_IDS, fuse_primary_forks, project_inset_gold_ribbons
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

OUTPUT=os.environ.get('SAKURA_OUTPUT',os.path.join(os.path.dirname(os.path.abspath(__file__)),'output'))
os.makedirs(OUTPUT,exist_ok=True)
PALETTE={
 'bark_dark':('Trunk_bark_plumblack',[29,12,34,255]),
 'bark_mid':('Branches_plum',[42,19,48,255]),
 'gold':('Golden_bark_veins',[247,173,101,255]),
 'shade':('Canopy_depth_rose',[211,128,156,255]),
 'rose':('Canopy_rose',[238,148,173,255]),
 'peach':('Canopy_peach',[246,176,172,255]),
 'pink':('Sakura_petal_pink',[249,183,197,255]),
 'blush':('Sakura_petal_blush',[251,207,208,255]),
 'cream':('Sakura_petal_cream',[248,215,198,255]),
 'warm':('Sakura_petal_warm_rose',[248,158,173,255]),
 'flower_center':('Sakura_flower_gold',[255,208,132,255])}

# R11 QUALITY-only warm petal study. R10's high pastel reflectance plus
# emissive color (.30,.17,.18) under the Blender dusk rig appeared washed.
# Keep GOLD and ECO palette untouched. A/B will isolate emission, base color,
# geometry under SAME Blender Cycles light rig and EV. No extra geometry here.
QUALITY_PALETTE={
 'pink': ('Sakura_petal_pink',[231,144,167,255]),
 'blush':('Sakura_petal_blush',[237,174,182,255]),
 'cream':('Sakura_petal_cream',[245,204,186,255]),
 'warm': ('Sakura_petal_warm_rose',[228,127,153,255]),
 'shade':('Canopy_depth_rose',[194,112,148,255]),
 'rose': ('Canopy_rose',[224,133,160,255]),
 'peach':('Canopy_peach',[244,167,160,255]),
}

class Aggregate:
 def __init__(self,petal_detail=3,quality_detail=False):
  self.quality_detail=quality_detail
  self.chunks=defaultdict(list)
  self.custom_normals=defaultdict(list)
  self.petal_detail=petal_detail  # QUALITY 4 / ECO 2 triangles per petal; 1 sheet only
 def add(self,mat,verts,faces,normals=None):
  if len(verts) and len(faces):
   vv=np.asarray(verts,dtype=np.float32);ff=np.asarray(faces,dtype=np.int32)
   self.chunks[mat].append((vv,ff))
   self.custom_normals[mat].append(None if normals is None else np.asarray(normals,dtype=np.float32))
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
    th=2*math.pi*j/sides
    # Very cheap procedural bark grooves along curved ring frames; no texture/UV cost.
    # Tube geometry is still smooth in longitudinal profile, not repeated cylinders.
    grain=(.021*math.sin(6*th+.41*i+seed*.17)+.012*math.sin(11*th-.19*i+seed*.7)) if mat in ('bark_dark','bark_mid') else 0.
    rad=float(radii[i])*(1+(rng.random()*2-1)*rough*.64+grain)
    verts.append(p+rad*(math.cos(th)*b+math.sin(th)*c))
  for i in range(n-1):
   for j in range(sides):
    aa=i*sides+j;bb=i*sides+(j+1)%sides;cc=(i+1)*sides+j;dd=(i+1)*sides+(j+1)%sides
    faces.extend([(aa,bb,cc),(bb,dd,cc)])
  start=len(verts);verts.append(pts[0]);end=len(verts);verts.append(pts[-1])
  for j in range(sides):
   faces.append((start,(j+1)%sides,j));k=(n-1)*sides;faces.append((end,k+j,k+(j+1)%sides))
  self.add(mat,verts,faces)
 def old_trunk(self, quality=True):
  # Main body sampled on one continuous swept mesh; smooth winding relief and
  # true radial fissure indentations are built INTO the surface rather than
  # copying yellow tubes over unmodified bark.  Surface frame is also used
  # for gold strips so they remain attached after twisting.
  rings=73 if quality else 36; sides=58 if quality else 25
  verts=[];faces=[];fissures=make_fissures()
  for i,t in enumerate(np.linspace(0,1,rings)):
   for j,theta in enumerate(np.linspace(0,2*math.pi,sides,endpoint=False)):
    pt,rad=old_bark_surface(float(t),float(theta),fissures,detail=quality)
    verts.append(pt)
  for i in range(rings-1):
   for j in range(sides):
    a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+j;d=(i+1)*sides+(j+1)%sides
    faces.extend(((a,b,c),(b,d,c)))
  self.add('bark_dark',verts,faces)
  # Each brief fissure is a flat tapered INSET strip inside an actual trough,
  # not an illuminated cylindrical cord; no horizontal zigzags near roots.
  for k,f in enumerate(fissures):
   n=9 if quality else 6
   verts=[];faces=[]
   for i in range(n):
    u=i/(n-1);t=f['start']+u*f['duration'];theta=f['angle']+f['sweep']*u+.025*math.sin(7*u+k)
    taper=(max(.003, math.sin(math.pi*u))**.78)
    half=.012+.032*taper*(.65+.35*math.sin(k*1.1)**2)
    for dd in [-half,half]:
     pos,_=old_bark_surface(t,theta+dd,fissures,gold=True,detail=quality)
     verts.append(pos)
   for j in range(n-1):
    i=2*j;faces.extend(((i,i+1,i+2),(i+1,i+3,i+2)))
   self.add('gold',verts,faces)
 def bark_knots(self, quality=True):
  # Short thin, dark relief creases, running along wood grain; no emission.
  count=31 if quality else 12
  for k in range(count):
   rng=random.Random(4001+k)
   angle=rng.random()*math.tau
   start=.03+.75*rng.random();duration=.035+.08*rng.random()
   points=[]
   for j in range(5):
    u=j/4;t=min(.99,start+duration*u)
    p,_=old_bark_surface(t,angle+.10*math.sin(u*3+k),[],gold=False,detail=quality)
    points.append(p)
   self.tube('bark_mid',points,[.028*math.sin(math.pi*j/4)+.004 for j in range(5)],4,rough=0.,seed=k)
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
   # QUALITY-only petal rhythm offset avoids five identical radial paper tiles.
   # ECO retains the exact historical k*72-degree placement and checksum.
   ang=rot+2*math.pi*k/5+(.067*math.sin(rot*1.9+k*2.27) if self.petal_detail==4 else 0.)
   dire=np.cos(ang)*u+np.sin(ang)*v;side=-np.sin(ang)*u+np.cos(ang)*v
   p0=loc+norm*(.016*scale)
   # Oval curling petal sheet: reduce strongly peaked triangular tip and high
   # center ridge responsible for hard specular triangles; no extra polygons.
   elliptic=.95+.08*math.sin(4*ang+scale*2.0)
   p1=loc+dire*(.51*scale)+side*(.33*elliptic*scale)+norm*(.115*scale)
   p2=loc+dire*(.82*scale)+side*(.044*math.sin(k*3.7+rot)*scale)+norm*(.195*scale)
   p3=loc+dire*(.51*scale)-side*(.33*elliptic*scale)+norm*(.115*scale)
   i=len(vertices)
   if self.petal_detail==4:
    # Rounded silhouette across a shallow notch; four faces, original true 3D.
    # Cycles AXES V2 R09 tests exposed sharp p2/p4 tips; here they are shorter and broader.
    # R13: softened convex petal silhouette with the SAME 4 faces and 6 verts.
    # The 2 shoulder points and continuous outer arc remove R09/R10 tips.
    # Surface normals are deliberately smoothed per petal, not flat facets.
    # Five nonidentical cupped oval petal outlines. This widens the convex
    # shoulder and removes the 'cut-paper hexagons' of R11 at the SAME 4 tris.
    # A center-to-tip height gradient is real 3D, not a shading override.
    # R14 shorter blunt oval cap: the outer 3 nodes form a nearly tangential
    # arc instead of a peaked fan-tip. All 6 vertices are truly 3D cupped.
    jitter=.955+.078*math.sin(2.31*k+rot)+.024*math.cos(7.7*ang+scale)
    breadth=.957+.065*math.cos(3.19*k+rot)
    lean=.018*math.sin(4.2*ang+rot)
    # Asymmetric longitudinal curl; oval lip is not a planar plate.
    curl=.033*math.sin(rot*2.07+1.71*k)
    p1=loc+dire*(.366*scale*jitter)+side*(.238*scale*breadth)+norm*(.081*scale)
    p2=loc+dire*(.571*scale*jitter)+side*(.157*scale*breadth)+norm*((.182+curl)*scale+lean)
    notch=loc+dire*(.607*scale*jitter)+side*(.016*scale*math.sin(ang))+norm*((.138+curl*.42)*scale)
    p4=loc+dire*(.573*scale*jitter)-side*(.154*scale*breadth)+norm*((.181-curl)*scale-lean)
    p5=loc+dire*(.366*scale*jitter)-side*(.233*scale*breadth)+norm*(.087*scale)
    vertices.extend([p0,p1,p2,notch,p4,p5])
    faces.extend([(i,i+1,i+2),(i,i+2,i+3),(i,i+3,i+4),(i,i+4,i+5)])
    # Deliberately omit R11 custom normals; real triangle vertex positions
    # make cupping visible and keep native glTF compact.
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
   entry=QUALITY_PALETTE[name] if self.quality_detail and name in QUALITY_PALETTE else PALETTE[name]
   mat=PBRMaterial(name=entry[0],baseColorFactor=entry[1],metallicFactor=0.,roughnessFactor=.88,
       doubleSided=name in ('pink','blush','cream','warm'))
   if name in ('pink','blush','cream','warm'):
    mat.emissiveFactor=[.045,.018,.024] if self.quality_detail else [.30,.17,.18]
   if name in ('shade','rose','peach'):
    mat.emissiveFactor=[.025,.010,.014] if self.quality_detail else [.20,.09,.12]
   if name=='gold':mat.emissiveFactor=[.35,.13,.035];mat.roughnessFactor=.73
   mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False,visual=TextureVisuals(material=mat))
   mesh.fix_normals(multibody=True)
   # R12 A/B decision: NO serialized custom petal NORMAL arrays. The R11 Cycles
   # control r10_palette_only matched rose hue without +49% NORMAL attributes.
   # Blender/glTF renderer computes actual geometry normals. Same physical surface,
   # no Phong material override or hand-painted screenshot trick.
   s.add_geometry(mesh,geom_name=PALETTE[name][0],node_name=PALETTE[name][0])
  return s

def make_fissures():
 # Deliberately mostly vertical fissures following twist grain, randomized
 # positions/length, no conspicuous lower horizontal cable runs.
 fs=[];rng=random.Random(12909)
 for k in range(23):
  start=.055+rng.random()*.74;duration=.045+.077*rng.random()
  angle=rng.random()*math.tau;sweep=(rng.random()-.5)*.25
  fs.append(dict(start=start,duration=duration,angle=angle,sweep=sweep))
 return fs

def bark_frame(t,detail=False):
 t=np.clip(t,0,1)
 curve=trunk_curve_quality if detail else trunk_curve
 p=curve(t)
 va=curve(min(1,t+.002))-curve(max(0,t-.002))
 tangent=va/(np.linalg.norm(va)+1.e-12)
 ref=np.array([0.,0.,1.]);ref=np.array([1.,0.,0.]) if abs(ref@tangent)>.92 else ref
 u=np.cross(tangent,ref);u/=np.linalg.norm(u)+1.e-12
 v=np.cross(tangent,u)
 return p,u,v

def old_bark_surface(t,theta,fissures,gold=False,detail=False):
 p,u,v=bark_frame(t,detail=detail)
 r=trunk_radius_quality(t) if detail else trunk_radius(t)
 # Flutes and braided asymmetric bark, both low- and high-frequency lengths.
 shape=1+.038*math.sin(9*theta+3*t)+.027*math.cos(14*theta-13*t)+.019*math.sin(23*theta+9*t)
 # Scale down relief near the crown, keep thicker knotted old bole at bottom.
 shape+=.042*math.sin(theta*3+8.1*t)*math.exp(-((t-.22)/.24)**2)
 if detail:
  # Slowly braided bark ridges with offset knots.  At R09's 46 sides the
  # 23rd harmonic was at Nyquist; R10 samples 58 sides so these flutes
  # are actual grooves rather than unstable aliasing on flat planes.
  knot_envelope=(math.exp(-((t-.18)/.16)**2)+.60*math.exp(-((t-.44)/.085)**2))
  shape+=.075*knot_envelope*math.cos(4*theta+7*t+0.8*math.sin(11*t))
  shape+=.026*math.sin(17*theta+10*t+1.7*math.sin(5*t+theta))
  shape+=.017*math.sin(26*theta-8*t+2.2*math.cos(4*t))
  # A lower broad-grain knot (actual radial sculpt) and broken fluting around
  # mid-height junctions, WITHOUT raising gold strips above their grooves.
  shape+=.042*math.exp(-((t-.31)/.125)**2)*math.sin(5*theta+10.4*t+.6*math.sin(7*t))
  shape+=.036*math.exp(-((t-.63)/.10)**2)*math.sin(3*theta-8*t)
  # R13: 3 long asymmetric helical wood-growth ridges are actual displaced bark.
  # Longitudinally phase-locked (not extra shiny curves or wires).
  shape+=.071*(.65+.35*math.sin(math.pi*t))*math.sin(3*theta-15.5*t+1.2*math.sin(4.8*t))
  # Blend the branch attachment collars into the SAME continuous swept bark mesh.
  # The physical branch tubes start inside these bulges, hiding their planar caps;
  # this is a surface fillet, NOT a water-tight Boolean mesh union.
  # R14 alternative B: seamless continuous wide branch shoulder, max-envelope.
  shoulder=0.
  for i in range(11):
   rt=.59+.31*((i*7)%11)/11
   phase=2*math.pi*i/11+.50*math.sin(3.1*i)+.24*math.cos(2*i)
   direction=np.array([math.cos(phase),0.,math.sin(phase)])
   close=math.atan2(float(direction@v),float(direction@u))
   delta=math.atan2(math.sin(theta-close-.1*math.sin(4*t+i)),math.cos(theta-close-.1*math.sin(4*t+i)))
   shoulder=max(shoulder,.108*math.exp(-((t-(rt-.04))/.165)**2-(delta/.74)**2))
  shape+=shoulder
  root_shoulder=0.
  for i in range(11):
   ang=2*math.pi*i/11+.31*math.sin(i*2.17)+.10*math.cos(i*3.6)
   direction=np.array([math.cos(ang),0.,math.sin(ang)])
   close=math.atan2(float(direction@v),float(direction@u))
   delta=math.atan2(math.sin(theta-close),math.cos(theta-close))
   root_shoulder=max(root_shoulder,.115*math.exp(-((t-.09)/.16)**2-(delta/.46)**2))
  shape+=root_shoulder
 groove=0.
 for k,f in enumerate(fissures):
  q=(t-f['start'])/(f['duration'])
  if 0<q<1:
   a=f['angle']+f['sweep']*q+.025*math.sin(7*q+k)
   d=math.atan2(math.sin(theta-a),math.cos(theta-a))
   groove=max(groove,.035*(max(0,1-abs(d)/.115)**2)*math.sin(math.pi*q)**.65)
 rad=r*(shape-groove)
 # Recessed gold is 0.6% of radius beyond the VTK-resolvable groove floor,
 # not protruding centimeter-scale emissive cylinders.
 if gold:rad+=.007
 return p+rad*(u*math.cos(theta)+v*math.sin(theta)),rad

def trunk_curve_quality(t):
 # R12 old-growth multi-leader centerline, asymmetry at stem and near forks.
 # At t=0 center remains identical so the ground pivot is preserved.
 q=trunk_curve(t)
 # S-shaped heavy main leader with two subtle direction reversals along the trunk.
 return q+np.array([.80*math.sin(6.0*t+.1)*math.sin(math.pi*t)+.60*t*t-.14*math.sin(12.2*t)*math.sin(math.pi*t),
                    .0,
                    .92*math.sin(4.1*t+.28)*math.sin(math.pi*t)+.36*t*t+.16*math.sin(10.1*t)*math.sin(math.pi*t)])

def trunk_radius_quality(t):
 # Broad uneven buttress at ground and slow shoulder swelling toward fork.
 return trunk_radius(t)*(1+.28*math.exp(-((t-.11)/.17)**2)+.16*math.exp(-((t-.63)/.14)**2))

def trunk_curve(t):
 # Old sakura off-axis leader, slow helical growth: splits no longer radial Y.
 return np.array([2.48*np.sin(1.31*t)+1.25*t*t+.35*np.sin(5.8*t+.3)*t,
                  13.15*t,
                  1.65*np.sin(2.27*t)-.10+.53*np.sin(5.6*t+.18)*t])

def trunk_radius(t):
 return 2.72*(1-.745*t**.64)*(1+.067*np.sin(12*t+.4)+.036*np.sin(27*t)+.013*np.cos(47*t))

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
  x=rr*(10.65+.62*math.sin(3*theta+.4)+.22*math.sin(7*theta))*math.cos(theta)
  z=rr*(10.1+.58*math.cos(4*theta+.3)+.14*math.cos(9*theta))*math.sin(theta)
  # inner top layer blocks large hole, outer low skirts give soft depth from camera 15s
  layer=(k*7)%5
  top=18.8+1.8*math.sqrt(max(0.,1-rr*rr))
  y=top +(-3.5 if layer==0 else -1.9 if layer==1 else -.5 if layer==2 else .7 if layer==3 else 1.25)
  y+=rng.uniform(-.95,.95) +.45*np.sin(th*5.0)+.18*np.cos(7*theta)
  ax=np.array([1.96+rng.random()*1.10,
               1.04+rng.random()*.92,
               1.78+rng.random()*1.06])
  # Extra anisotropy/overlap replaces consistently round scalloped spheres.
  ax[0]*=1+.17*math.sin(4*theta+layer*.9)
  ax[2]*=1+.17*math.cos(3*theta-layer*.4)
  ax*=.94 if rr>.8 else 1.0
  ax*=1+.09*np.sin(4*th+layer)
  c=np.array([x+.25,y,z-.28]);lobes.append((c,ax,k))
 return lobes

def quality_lobe_layout(base_lobes):
 # Same overall garden footprint as the ECO baseline, but elongated fanlets
 # overlap and twist, instead of every lobe being a world-axis round ball.
 new=[]
 for c,ax,k in base_lobes:
  c=c.copy();ax=ax.copy()
  theta=math.atan2(c[2],c[0]);layer=k%6
  ax[0]*=.85+.41*(.5+.5*math.sin(k*.79))
  ax[2]*=.83+.47*(.5+.5*math.cos(k*.43+1.3))
  ax[1]*=.65+.76*(.5+.5*math.sin(k*.28+.8))
  # Fine natural offsets make tiers interweave, preserving big read silhouette.
  c[1]+=.59*math.sin(k*.74)+.58*math.cos(k*.17)
  c[0]+=.45*math.cos(theta+.4)*math.sin(k*.61)
  c[2]+=.45*math.sin(theta+.4)*math.cos(k*.37)
  rot=theta+.67*math.sin(k*.43)+.32*math.cos(k*.13)
  new.append((c,ax,k,rot))
 return new

def quality_surface(c,ax,k,rot,norm,j):
 # True spatially rotated, non-ellipsoidal petals in three depth tiers.
 u=np.array([ax[0]*norm[0],ax[1]*norm[1],ax[2]*norm[2]])
 s,cosa=math.sin(rot),math.cos(rot)
 xyz=np.array([u[0]*cosa-u[2]*s,u[1],u[0]*s+u[2]*cosa])
 az=math.atan2(norm[2],norm[0]);polar=norm[1]
 warp=1+.055*math.sin(3*az+2.0*polar+k*.34)+.046*math.sin(5*az-2.9*polar+k*.18)
 warp+=.016*math.cos(9*az+k*.41)
 tier=j%9
 yoffset=(.50 if tier in (0,3,7) else -.32 if tier in (2,6) else 0.)
 return c+xyz*warp+np.array([0,yoffset,0])

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

def generate(density='quality',seed=12909):
 high=(density=='quality');rng=random.Random(seed if high else 12808)
 a=Aggregate(petal_detail=4 if high else 2,quality_detail=high)
 a.old_trunk(quality=high)
 a.bark_knots(quality=high)
 # Braided, off-center buttress roots: nonuniform length, curved sweep, tapered organically.
 root_count=11 if high else 8
 for k in range(root_count):
  angle=2*math.pi*(k/root_count)+(.31*np.sin(k*2.17)+.10*math.cos(k*3.6) if high else .20*np.sin(k*3.3))
  direction=np.array([math.cos(angle),0,math.sin(angle)])
  perp=np.array([-math.sin(angle),0,math.cos(angle)])
  pts=[];rr=[];length=(3.3+1.5*rng.random()) if high else (3.6+1.5*rng.random())
  for j in range(10):
   t=j/9
   if high:
    # Buttress root emerges smoothly from under one thickened trunk collar.
    # Its first two rings are embedded inside the trunk, rather than showing a cap.
    p=trunk_curve_quality(.098*(1-t))+direction*(1.23+length*t**.83)+perp*(.98*np.sin(math.pi*t+.16*k)+.28*np.sin(5.2*t+k)*t)
    p[1]=1.19*(1-t)**1.88-.37*t+.11*np.sin(5.8*t+k)*t
    r=((1.28+.13*math.sin(k*1.83))*(1-t)**1.62)*(1+.10*math.sin(4.8*t+.8*k)*math.sin(math.pi*t))+.042
   else:
    p=trunk_curve(.085*(1-t))+direction*(1.30+length*t**.86)+perp*(.74*np.sin(math.pi*t+.14*k)+.34*np.sin(8*t+k)*t)
    p[1]=1.14*(1-t)**1.7-.25*t+.15*np.sin(7.4*t+k)*t
    r=(.99+.11*math.sin(k*1.83))*(1-t)**1.55+.043
   pts.append(p);rr.append(r)
  a.tube('bark_dark',pts,rr,9 if high else 7,rough=.10,seed=101+k)
 # Unequal branch origin heights and lengths, later branching under higher leader.
 branch_paths=[]
 joined=[]
 for i in range(11 if high else 9):
  phase=2*math.pi*i/11+.50*np.sin(3.1*i)+.24*np.cos(2*i)
  root_t=.59+.31*((i*7)%11)/11
  origin=(trunk_curve_quality(root_t) if high else trunk_curve(root_t));length=6.8+6.1*rng.random();h=12+5.2*rng.random()
  radial=np.array([math.cos(phase),0,math.sin(phase)])
  perp=np.array([-math.sin(phase),0,math.cos(phase)])
  pts=[]
  for j in range(12):
   t=j/11
   if high:
    # Upward tangency at origin, then an organic outward arc; this softens
    # near-Y mechanical elbows at the big trunk-branch intersections.
    tangent=trunk_curve_quality(min(.99,root_t+.008))-trunk_curve_quality(max(0,root_t-.008))
    tangent/=np.linalg.norm(tangent)+1.e-10
    # Delayed branch departure: a long common leader tangent then organic curved fan.
    # Root origin is buried under the localized bulge in old_bark_surface.
    # R14 branch neck shares the bole tangent before emerging in a broad curve.
    # Radius/axis move together: no stiff 90-degree tube elbow at its first rings.
    bend=radial*length*t**1.87+perp*(.94*np.sin(math.pi*t)+.65*np.sin(t*4.5+i)*t)
    y=(h-origin[1])*t+1.65*np.sin(math.pi*t)*(1-.43*t)+.30*np.sin(t*7+i)*t
    pts.append(origin+bend+np.array([0,y,0])+tangent*(1.75*np.sin(math.pi*t)*(1-t)))
   else:
    bend=radial*length*t**1.15+perp*(1.30*np.sin(math.pi*t)+1.13*np.sin(t*5.2+i)*t)
    y=(h-origin[1])*t+2.2*np.sin(math.pi*t)*(1-.5*t)+.48*np.sin(t*8.4+i)*t
    pts.append(origin+bend+np.array([0,y,0]))
  rads=[((1.03+.13*np.sin(i*1.2))*(1-t)**1.48+.04) if high else ((.72+.16*np.sin(i*1.2))*(1-t)**1.35+.04) for t in np.linspace(0,1,len(pts))]
  if high and i in FUSED_BRANCH_IDS:
   joined.append((i,np.asarray(pts),np.asarray(rads)))
  else:
   a.tube('bark_mid',pts,rads,9 if high else 7,rough=.1,seed=71+i)
  branch_paths.append((pts,rads))
  for j in range(3 if high else 2):
   q=min(9,int((.43+.13*j+.08*rng.random())*11));p=pts[q];sign=(-1 if j%2 else 1)
   go=radial*(.35+.25*rng.random())+perp*sign*(.65+.4*rng.random());go/=np.linalg.norm(go)+1e-10
   ext=2+2.6*rng.random();dest=p+go*ext+np.array([0,(-1.2 if j else .8)+rng.uniform(-.6,.6),0])
   branch=[lerp(p,dest,t)+np.array([.26*np.sin(5*t+i),.72*np.sin(math.pi*t),.30*np.sin(7*t+j)*t]) for t in np.linspace(0,1,8)]
   secondary_radii=[.20*(1-t)**1.2+.02 for t in np.linspace(0,1,8)]
   if high and (i,j) in ((0, 0),):
    # R16 selective major fork-side secondary smooth union, not a separate tube.
    joined.append((100+3*i+j,np.asarray(branch),np.asarray(secondary_radii)))
   else:
    a.tube('bark_mid',branch,secondary_radii,6 if high else 5,rough=.05,seed=141+i*7+j)
 # R16 P0: refined SDF union of the trunk, all 11 main arms and one selected secondary.
 # Extract ONE continuous smooth surface using CPU marching cubes; no overlap
 # at these interfaces and no radius-collar expansion illusion. ECO unchanged.
 if high:
  original_v, original_f=a.chunks['bark_dark'][0]
  fused_v,fused_f,joint_report=fuse_primary_forks(original_v, joined, __import__(__name__))
  a.chunks['bark_dark'][0]=(fused_v.astype(np.float32),fused_f.astype(np.int32))
  # Resnap the ORIGINAL thin fissure ribbons to the continuous bark surface;
  # Local capped projection keeps only physically valid, continuous inset ribbons.
  projected_gold,gold_report=project_inset_gold_ribbons(a.chunks['gold'],fused_v,fused_f)
  a.chunks['gold']=projected_gold
  print('R16_FORK_SDF',joint_report,flush=True)
  print('R16_GOLD_CAP_AND_SEGMENT',gold_report,flush=True)
 # Gold embedded into real radial bark troughs by old_trunk; use only
 # muted dark bark seam relief on primary limbs, NO gold tubular wire overlays.
 for i in range(5 if high else 3):
  bp,rs=branch_paths[i]
  start_i=3;end_i=min(len(bp)-1,7)
  pts=[]
  for j in range(start_i,end_i+1):
   p=bp[j];tang=bp[min(len(bp)-1,j+1)]-bp[max(0,j-1)]
   tang/=np.linalg.norm(tang)+1e-9
   side=np.cross(tang,np.array([0.,1.,0.]));side/=np.linalg.norm(side)+1e-9
   pts.append(p+side*(rs[j]*.984))
  a.tube('bark_dark',pts,[.02*math.sin(math.pi*x/4)+.003 for x in range(5)],4,seed=700+i)
 # Shared canopy distribution QUALITY/ECO (no independent 8-fan holes)
 # R08 ECO layout must use R08 seed: independent of QUALITY revision.
 lobes=build_lobes(random.Random(12808+33 if not high else seed+33))
 if high:
  lobes=quality_lobe_layout(lobes)
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
  # ECO-only local aerial hole repair (center-left in R07 matched 50-deg view).
  # SINGLE small bridge: 27 flowers *10 triangles + 80-face shaded recessed core.
  # Do not increase density elsewhere or change the optimized 0.57 core ratio.
  lobes.append((np.array([-4.25,19.35,1.30]),np.array([1.66,.94,1.68]),2001))
  # Second microscopic gap patch at screen approx (171,224) in 420x480 R08 aerial.
  # Fixed world coordinates derived from the documented R07 top camera projection.
  lobes.append((np.array([-2.55,19.48,-.18]),np.array([1.25,.74,1.31]),2002))
 for entry in lobes:
  c,ax,k=entry[:3]
  # R10 QUALITY cores retain the R09 deeper recess to emphasize flower-rich airy tiers.
  # R08 ECO 0.57 remains unchanged, for cross-angle fidelity.
  coreScale=.47 if high else .57
  a.ico(('shade' if k%9==0 else 'rose' if k%4==0 else 'peach'),c,ax*coreScale,
        sub=2 if high else 1,noise=.03 if high else .038,seed=1900+k)
 # Flower cover density is strategically optimized ECO: each flower uses 10 rather
 # than 15 tris, while 56-67 smaller overlapping blossoms distribute across the
 # visible lobe upper hemisphere (roughly same total triangles as R06 ECO).
 mats=['pink','blush','cream','warm']
 for entry in lobes:
  c,ax,k=entry[:3]
  # R16 preserves R15 layered flower lobes, warm palette and petal geometry unchanged.
  # with deterministic local frequency variation; ECO exactly as before.
  n=(63+(k*17)%15) if high else (27 if k==2001 else 16 if k==2002 else 44+(k*17)%12)
  for j,norm in flower_directions(n,k):
   if high:
    rot=entry[3]
    pt=quality_surface(c,ax,k,rot,norm,j)
    # Nested smaller fan petals and some flowers tucked behind the outer sheet
    # reduce a uniform 'paper tile skin' without blanket subdivision.
    pt=c+(pt-c)*(.968+.056*math.sin(j*2.1+k*.37))
    scale=.788+.145*rng.random()+(.025 if j%11==0 else 0.)
    # Selectively shorten outward-facing edge petals on outer flower bands
    # to avoid a jagged saw-tooth rim; preserve inner canopy depth.
    if np.linalg.norm(c[[0,2]])>8.5 and norm[1]>.1:
     scale*=.935
   else:
    stretch=.85+.22*(.5+.5*np.sin(k*.67+j*2.39))+.08*rng.random()
    pt=c+ax*norm*stretch
    scale=.93+.23*rng.random()
   mat=mats[rng.choices([0,1,2,3],weights=[3.1,3.1,1.25,1.45])[0]]
   a.flower(mat,pt,norm,scale,rng.random()*2*math.pi,center=(high and j%23==0))
 # A few draped twig blossoms (small, low overhead)
 for i in range(5 if high else 10):
  angle=rng.random()*2*math.pi;rad=8.7+3*rng.random()
  loc=np.array([rad*math.cos(angle),11.4-rng.random()*1.2,rad*math.sin(angle)])
  a.tube('bark_mid',[loc+[0,1.4,0],loc+[.16,.7,-.14],loc],[.045,.03,.012],5,seed=912+i)
  for j in range(8 if high else 6):
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
