"""OnlinePagodaVer2 P0-01: ORIGINAL zero-cost lotus-pad/chibi 3D geometry.

Two actual glTF 2.0 GLBs using numpy/trimesh; an animated actor with named glTF
nodes and a native glTF sit_idle translation track. Blender authoring/renderer
bridge is supplied separately. No other asset, renderer or app code touched.
All exported coordinates right-handed +Y up and actor faces +Z.
"""
from __future__ import annotations
import json, hashlib, math, struct
from pathlib import Path
from collections import defaultdict
import numpy as np
import trimesh
from trimesh.visual import TextureVisuals
from trimesh.visual.material import PBRMaterial

ROOT = Path(__file__).resolve().parent
np.random.seed(42)

# All colors are original authored material constants, linear glTF factors.
PALETTE = {
 'leaf_satin_green': ((.105,.39,.215,1),.04,.79),
 'leaf_underside_jade': ((.063,.225,.140,1),.02,.91),
 'leaf_vein_sage': ((.28,.56,.285,1),.0,.84),
 'leaf_edge_lime': ((.19,.45,.205,1),.02,.71),
 'leaf_stem_olive': ((.17,.32,.165,1),.0,.83),
 'skin_rose_cream': ((.93,.655,.53,1),.0,.80),
 'skin_blush': ((.90,.405,.455,1),.0,.91),
 'robe_cream': ((.85,.805,.78,1),.0,.78),
 'robe_lavender': ((.52,.415,.70,1),.0,.81),
 'robe_amethyst': ((.31,.26,.49,1),.0,.76),
 'hair_blue_black': ((.061,.078,.16,1),.03,.66),
 'eyes_mauve': ((.16,.095,.20,1),.0,.80),
 'hair_pin_gold': ((.82,.57,.25,1),.35,.47),
}

def material(name):
    c,m,r=PALETTE[name]
    return PBRMaterial(name=name,baseColorFactor=np.array(c,dtype=float),
                       metallicFactor=m,roughnessFactor=r,doubleSided=False)

def mesh(vertices,faces):
    m=trimesh.Trimesh(vertices=np.asarray(vertices,dtype=np.float32),
                       faces=np.asarray(faces,dtype=np.int64),process=False)
    m.fix_normals();return m

def surface(radius=1.02, ring_count=13, segments=112):
    """Disc with actual V-shaped asymmetric missing notch and convex leaf curl."""
    # Parameter theta=0 faces +Z. Local signed angle around +Z determines notch.
    def rim(th):
        a=math.atan2(math.sin(th),math.cos(th))
        # Deep, narrow near-0 notch, not a painted V line.
        cut=.43*math.exp(-((a-.045)/.133)**2)
        scallop=.025*math.sin(7*th+0.4)+.015*math.sin(13*th-1)
        return radius*(1-cut+scallop)
    def top_y(rr,th,outer):
        q=rr/max(outer,1e-6)
        return .172+.023*math.exp(-(rr/.55)**2)-.062*q**5+.005*q*q*math.cos(13*th+.4)
    def bottom_y(rr,th,outer):
        q=rr/max(outer,1e-6)
        return .065+.009*math.cos(4*th)*q-.028*q*q
    angles=np.arange(segments)*2*math.pi/segments
    v=[]
    for layer in (0,1):
        for ir in range(ring_count):
            t=.025+(1-.025)*ir/(ring_count-1)
            for th in angles:
                out=rim(th);r=out*t
                v.append((r*math.sin(th),top_y(r,th,out) if layer==0 else bottom_y(r,th,out),r*math.cos(th)))
    def ix(layer,ir,j):return layer*ring_count*segments+ir*segments+(j%segments)
    f=[]
    for ir in range(ring_count-1):
        for j in range(segments):
            a,b,c,d=(ix(0,ir,j),ix(0,ir+1,j),ix(0,ir+1,j+1),ix(0,ir,j+1))
            f.extend([(a,b,c),(a,c,d)])
            a,b,c,d=(ix(1,ir,j),ix(1,ir+1,j),ix(1,ir+1,j+1),ix(1,ir,j+1))
            f.extend([(c,b,a),(d,c,a)])
    for j in range(segments):
        a,b,c,d=ix(0,ring_count-1,j),ix(0,ring_count-1,j+1),ix(1,ring_count-1,j+1),ix(1,ring_count-1,j)
        f.extend([(a,d,c),(a,c,b)])
        a,b,c,d=ix(0,0,j),ix(0,0,j+1),ix(1,0,j+1),ix(1,0,j)
        f.extend([(a,b,c),(a,c,d)])
    return mesh(v,f),rim,top_y

def line_tube(points,radii,ring=9,closed=False):
    points=np.asarray(points,float);n=len(points)
    if np.isscalar(radii):radii=np.full(n,float(radii))
    else:radii=np.asarray(radii,float)
    verts=[];faces=[]
    for i,p in enumerate(points):
        tangent=points[min(i+1,n-1)]-points[max(0,i-1)]
        tangent/=max(np.linalg.norm(tangent),1e-9)
        ref=np.array([0.,1.,0.]);
        if abs(np.dot(ref,tangent))>.88:ref=np.array([0.,0.,1.])
        u=np.cross(tangent,ref);u/=max(np.linalg.norm(u),1e-9)
        v=np.cross(tangent,u)
        for k in range(ring):
            q=p+radii[i]*(u*math.cos(2*math.pi*k/ring)+v*math.sin(2*math.pi*k/ring))
            verts.append(q)
    for i in range(n-1):
        for k in range(ring):
            a=i*ring+k;b=i*ring+(k+1)%ring;c=(i+1)*ring+k;d=(i+1)*ring+(k+1)%ring
            faces.extend([(a,b,c),(b,d,c)])
    # End caps close each tube, smooth shading via trimesh.
    vs=np.asarray(verts,float)
    base=len(vs);vs=np.vstack((vs,points[0],points[-1]))
    for k in range(ring):
        faces.append((base,(k+1)%ring,k))
        faces.append((base+1,(n-1)*ring+k,(n-1)*ring+(k+1)%ring))
    return mesh(vs,faces)

def ellipsoid(center,scale,sub=2):
    o=trimesh.creation.icosphere(subdivisions=sub,radius=1.)
    o.apply_scale(scale);o.apply_translation(center)
    return o

def oval_tube(path,radii,ring=11):return line_tube(path,radii,ring)

def group_scene(parts,parenting=None):
    scene=trimesh.Scene()
    scene.graph.update(frame_from='world',frame_to='SeatRoot',matrix=np.eye(4))
    if parenting:
        scene.graph.update(frame_from='SeatRoot',frame_to='UpperBodyBreath',matrix=np.eye(4))
        anchors={
            'HeadAnchor':('UpperBodyBreath',[0,.835,.04]),
            'NameplateAnchor':('UpperBodyBreath',[0,1.335,.03]),
            'FXAnchor':('UpperBodyBreath',[.37,.805,.16]),
        }
    else:anchors={'PadSeatAnchor':('SeatRoot',[0,.195,0])}
    for name,(parent,pos) in anchors.items():
        T=np.eye(4);T[:3,3]=pos
        scene.graph.update(frame_from=parent,frame_to=name,matrix=T)
    for (matname,anchor),meshes in parts.items():
        if not meshes:continue
        m=trimesh.util.concatenate(meshes)
        m.visual=TextureVisuals(material=material(matname))
        geom=f'{matname}_{anchor}_mesh';node=f'{matname}_{anchor}_object'
        scene.add_geometry(m,geom_name=geom,node_name=node,parent_node_name=anchor)
    return scene

def pad():
    p=defaultdict(list)
    face,rim,top=surface()
    p['leaf_satin_green','SeatRoot'].append(face)
    # underside is physically the back side of the closed leaf body; matching PBR
    # via a separate low-profile dark green under-cushion to avoid billboard appearance.
    p['leaf_underside_jade','SeatRoot'].append(ellipsoid((0,.065,0),(.82,.025,.82),2))
    boundary=[]
    for j in range(121):
        th=2*math.pi*j/120;r=rim(th)
        boundary.append([r*math.sin(th),top(r,th,r)-.009,r*math.cos(th)])
    p['leaf_edge_lime','SeatRoot'].append(line_tube(boundary,.013,7))
    for k in range(15):
        th=2*math.pi*(k+.15)/15
        # One vein adjacent to notch bends gently around the indentation.
        vals=[]
        for t in np.linspace(.17,.91,13):
            angle=th+.037*math.sin(2*math.pi*t+k)
            r=rim(angle)*t
            y=top(r,angle,rim(angle))+.007
            vals.append((r*math.sin(angle),y,r*math.cos(angle)))
        p['leaf_vein_sage','SeatRoot'].append(line_tube(vals,np.linspace(.012,.005,13),7))
    p['leaf_stem_olive','SeatRoot'].append(line_tube([
        (0,.062,0),(-.04,-.012,-.015),(-.065,-.115,-.032),(-.10,-.23,-.06)
        ],[.048,.042,.032,.026],12))
    # Tiny re-enforced center seat spot follows leaf centre and avoids floating actor.
    p['leaf_vein_sage','SeatRoot'].append(ellipsoid((0,.183,0),(.105,.009,.105),2))
    return group_scene(p,False)

def hair_cap(center=(0,.824,.036),radii=(.297,.321,.286)):
    v=[(center[0],center[1]+radii[1]+.007,center[2])];f=[]
    levels=8;sections=48
    for li in range(1,levels+1):
        polar=.16+li*(1.28-.16)/levels
        for j in range(sections):
            ph=2*math.pi*j/sections
            # Asymmetric edge makes an original split fringe; front=+Z.
            captheta=polar+.072*math.sin(ph*2.5+.9)*(li/levels)
            v.append((center[0]+radii[0]*1.023*math.sin(captheta)*math.cos(ph),
                      center[1]+radii[1]*1.045*math.cos(captheta),
                      center[2]+radii[2]*1.035*math.sin(captheta)*math.sin(ph)))
    for j in range(sections):f.append((0,1+j,1+(j+1)%sections))
    for li in range(levels-1):
        for j in range(sections):
            a=1+li*sections+j;b=1+li*sections+(j+1)%sections
            c=1+(li+1)*sections+j;d=1+(li+1)*sections+(j+1)%sections
            f.extend([(a,c,b),(b,c,d)])
    # Winding must face OUTWARD; an inward cap appears bald in glTF backface culling.
    return mesh(v,[(a,c,b) for a,b,c in f])

def head_front_z(x,y,center=(0,.824,.036),radii=(.287,.318,.28)):
    q=1-((x-center[0])/radii[0])**2-((y-center[1])/radii[1])**2
    return center[2]+radii[2]*math.sqrt(max(.08,q))

def person():
    p=defaultdict(list)
    still='SeatRoot';body='UpperBodyBreath'
    # The legs are FIXED for the 2 s sit_idle breathing loop.
    legL=[(-.112,.235,-.004),(-.235,.16,.07),(-.245,.102,.215),(-.098,.091,.307),(.067,.10,.309),(.220,.127,.240)]
    legR=[(.112,.24,-.004),(.235,.17,.071),(.246,.105,.209),(.108,.085,.294),(-.06,.090,.302),(-.205,.128,.239)]
    p['robe_lavender',still].append(oval_tube(legL,[.094,.096,.084,.083,.078,.064],14))
    p['robe_cream',still].append(oval_tube(legR,[.094,.092,.083,.078,.080,.065],14))
    p['robe_cream',still].append(ellipsoid((0,.170,.036),(.175,.108,.17),2))
    # Pastel slippers and rolled cuff folds are visible from front 3/4.
    for x,z in ((.223,.24),(-.205,.239)):
        p['robe_amethyst',still].append(ellipsoid((x,.124,z),(.076,.048,.058),2))
    # Body+head+hands move together very slightly: equivalent editable root rig.
    p['robe_cream',body].append(ellipsoid((0,.445,-.019),(.196,.235,.174),3))
    p['robe_lavender',body].append(ellipsoid((0,.292,.032),(.188,.073,.163),2))
    for side in (-1,1):
        path=[(side*.148,.510,-.012),(side*.229,.440,.042),(side*.265,.320,.133),(side*.243,.245,.219)]
        p['robe_cream',body].append(oval_tube(path,[.081,.075,.064,.056],13))
        p['skin_rose_cream',body].append(ellipsoid((side*.243,.237,.221),(.055,.051,.06),2))
    # Original two-piece kimono neck collar, visually V-shaped from +Z.
    for side in (-1,1):
        p['robe_amethyst',body].append(line_tube([(side*.084,.612,.123),(side*.038,.525,.158),(side*.006,.448,.177)], [.019,.02,.015],9))
    # Warm oversized head, dark blue-black hair and distinctive side bun.
    p['skin_rose_cream',body].append(ellipsoid((0,.824,.036),(.287,.318,.28),3))
    p['hair_blue_black',body].append(hair_cap())
    p['hair_blue_black',body].append(ellipsoid((-.255,1.048,-.047),(.112,.116,.108),2))
    p['hair_pin_gold',body].append(ellipsoid((-.28,1.096,.025),(.052,.014,.029),2))
    for s in (-1,1):
        p['skin_rose_cream',body].append(ellipsoid((s*.288,.811,.049),(.048,.08,.068),2))
        # Two relaxed closed eye curved lines fixed onto 3D head surface.
        eyelid=[]
        for t in np.linspace(0,1,9):
            x=s*(.068+.092*t);y=.810-.010*math.sin(math.pi*t)
            eyelid.append((x,y,head_front_z(x,y)+.012))
        p['eyes_mauve',body].append(line_tube(eyelid,[.009]*len(eyelid),7))
        cheekx=s*.191;cheeky=.725
        p['skin_blush',body].append(ellipsoid((cheekx,cheeky,head_front_z(cheekx,cheeky)+.006),(.051,.019,.011),2))
    # Small nose and a content smile, without a scraped avatar texture.
    p['skin_rose_cream',body].append(ellipsoid((0,.741,head_front_z(0,.741)+.013),(.023,.021,.017),2))
    smile=[]
    for t in np.linspace(-1,1,10):
        x=.050*t;y=.679+.018*t*t
        smile.append((x,y,head_front_z(x,y)+.011))
    p['eyes_mauve',body].append(line_tube(smile,[.0055]*len(smile),7))
    return group_scene(p,True)

def glb_chunks(glb):
    assert glb[:4]==b'glTF' and struct.unpack_from('<I',glb,4)[0]==2
    jlen,jtype=struct.unpack_from('<II',glb,12)
    assert jtype==0x4E4F534A
    j=json.loads(glb[20:20+jlen].decode('utf-8'))
    offset=20+jlen;blen,btype=struct.unpack_from('<II',glb,offset)
    assert btype==0x004E4942
    binary=glb[offset+8:offset+8+blen]
    return j,binary

def write_glb(j,binary):
    j['buffers'][0]['byteLength']=len(binary)
    jb=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode('utf8')
    jb+=b' '*((-len(jb))%4)
    binary+=b'\0'*((-len(binary))%4)
    return b'glTF'+struct.pack('<II',2,12+8+len(jb)+8+len(binary))\
         +struct.pack('<II',len(jb),0x4E4F534A)+jb\
         +struct.pack('<II',len(binary),0x004E4942)+binary

def embed_idle_animation(raw):
    j,binary=glb_chunks(raw)
    nodes={n.get('name'):i for i,n in enumerate(j['nodes'])}
    needed={'SeatRoot','HeadAnchor','NameplateAnchor','FXAnchor','UpperBodyBreath'}
    assert needed.issubset(nodes),needed-set(nodes)
    # True glTF animation data: 2s loop with smooth sampled breathing in +Y.
    times=np.linspace(0,2,17,dtype='<f4')
    y=.008*(1-np.cos(np.pi*times)) # 0 to 0.016m (gentle chest/head bob)
    translation=np.column_stack((np.zeros(len(y)),y,np.zeros(len(y)))).astype('<f4')
    def append_access(arr,type_):
        nonlocal binary
        start=len(binary)
        binary+=arr.tobytes();idx=len(j['bufferViews'])
        j['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':arr.nbytes})
        acc={'bufferView':idx,'componentType':5126,'count':len(arr),'type':type_}
        if type_=='SCALAR':acc['min']=[float(arr.min())];acc['max']=[float(arr.max())]
        else:acc['min']=arr.min(axis=0).tolist();acc['max']=arr.max(axis=0).tolist()
        ix=len(j['accessors']);j['accessors'].append(acc);return ix
    iT=append_access(times,'SCALAR');iV=append_access(translation,'VEC3')
    j['animations']=[{'name':'sit_idle','samplers':[{'input':iT,'output':iV,'interpolation':'LINEAR'}],
             'channels':[{'sampler':0,'target':{'node':nodes['UpperBodyBreath'],'path':'translation'}}]}]
    j.setdefault('extras',{})['assetOrigin']='Original P0-01 3D mesh and authored sit_idle translation'
    return write_glb(j,binary)

def save_scene(name,scene,animated=False):
    raw=trimesh.exchange.gltf.export_glb(scene,include_normals=True)
    if animated:raw=embed_idle_animation(raw)
    path=ROOT/name;path.write_bytes(raw)
    j,_=glb_chunks(raw)
    sha=hashlib.sha256(raw).hexdigest()
    out={
     'file':name,'bytes':len(raw),'sha256':sha,'triangles':int(sum(len(g.faces) for g in scene.geometry.values())),
     'vertices':int(sum(len(g.vertices) for g in scene.geometry.values())),
     'meshes':len(j['meshes']),'materials':len(j.get('materials',[])),
     'textures':len(j.get('textures',[])),
     'animatedClips':[a['name'] for a in j.get('animations',[])],
     'nodeNames':[n.get('name') for n in j['nodes']],
     'measuredBoundsMinMax':np.asarray(scene.bounds).round(6).tolist(),
     'gltfUp':'+Y','gltfForward':'+Z' if animated else 'pad normal +Y'
    }
    return out

if __name__=='__main__':
    leaf=save_scene('lotus_pad_01.glb',pad())
    actor=save_scene('meditator_base.glb',person(),True)
    summary={'pad':leaf,'actor':actor,'padSeatAnchor':[0,.195,0],
             'actorOrigin':[0,0,0],'actorForward':'+Z','actorUp':'+Y',
             'animationDurationSeconds':2.,'breathingPeakMeters':.016}
    (ROOT/'build_metrics.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8')
    print(json.dumps(summary,indent=2))
