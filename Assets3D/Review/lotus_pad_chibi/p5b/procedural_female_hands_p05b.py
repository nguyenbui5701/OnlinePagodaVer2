"""OnlinePagodaVer2 P0.5b: surgery on BOTH frozen P0.5 female prayer hands.

Uses original P0.5 source (sha256 e6f7d06d...) and frozen P0.4 source
(sha256 b3b8b0c...) recovered from owner P05 SOURCE_REPORTS ZIP. Rebuilds
both exact P0.5 reference GLBs independently, then overrides ONLY the
original P0.5 praying_arm_and_sleeves() mesh construction with the same
new rounded volumetric palms/fingers/thumb for each pose. The two poses,
leg/feet, face, neck, hair, buttons, six KHR palette variants, anchors,
2 sec 17-keyframe idle source and material factors are untouched.

Original zero-cost mesh production: NumPy, scikit-image marching cubes,
trimesh. Blender/Cycles evidence is an independent owner-run gate.
"""
from pathlib import Path
import importlib.util, hashlib, json
import numpy as np
from skimage.measure import marching_cubes
import trimesh

ROOT=Path(__file__).resolve().parent
ORIGINAL=ROOT/'p05_source_frozen.py'
FROZEN=ROOT/'p04_source_frozen.py'
EXPECTED={
 'p05_source_frozen.py':'e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9',
 'p04_source_frozen.py':'b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2'
}
for name,exp in EXPECTED.items():
 actual=hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
 if actual!=exp:raise RuntimeError(f'Immutable source SHA mismatch: {name} {actual} vs {exp}')
spec=importlib.util.spec_from_file_location('p05_immutable_source',str(ORIGINAL))
p05=importlib.util.module_from_spec(spec);spec.loader.exec_module(p05)
p04=p05.p04

OUTPUT={
 'cross_prayer':'meditator_female_cross_prayer_p05b.glb',
 'kneel_prayer':'meditator_female_kneel_prayer_p05b.glb'
}

def sdf_ellipsoid(P,center,radii):
    """Conservative distance-like field; good for smooth meshed organic chibi volumes."""
    c=np.asarray(center,dtype=float);r=np.asarray(radii,dtype=float)
    u=(P-c)/r
    return (np.linalg.norm(u,axis=-1)-1.)*min(r)

def sdf_taper_capsule(P,a,b,ra,rb):
    a=np.asarray(a,float);b=np.asarray(b,float);d=b-a
    t=np.clip(np.sum((P-a)*d,axis=-1)/np.dot(d,d),0.,1.)
    nearest=a+t[...,None]*d
    return np.linalg.norm(P-nearest,axis=-1)-(ra+(rb-ra)*t)

def smooth_union(a,b,k):
    """Polynomial smooth-min with LOCAL radius (meters); never joins the 2 palms."""
    h=np.clip(.5+.5*(b-a)/k,0.,1.)
    return b*(1-h)+a*h-k*h*(1-h)

def one_soft_hand(sign,voxel=.0037):
    """One connected, sculpted hand+fingers+thumb mesh with a continuous wrist.

    Per-hand SDF union, independent from the opposing palm: rounded tips,
    curved different-length digits, unified thumb and tapered palm. This
    avoids intersecting 3-4 straight faceted tubes and detached oval wedges.
    """
    # World-coordinate sample field. Sign swaps x, both remain independent.
    x=np.arange(-.094,.095+voxel,voxel)
    y=np.arange(.427,.632+voxel,voxel)
    z=np.arange(.293,.407+voxel,voxel)
    # Isosurface surrounded by air; avoid boundary clipping.
    X,Y,Z=np.meshgrid(x,y,z,indexing='ij')
    P=np.stack((X,Y,Z),axis=-1)
    q=P.copy();q[...,0]*=sign
    # Smoothly varying palm and wrist: one connected living hand, not oval + pipe.
    d=sdf_ellipsoid(q,(.025,.519,.346),(.024,.036,.019))
    wrist=sdf_taper_capsule(q,(.062,.449,.326),(.036,.495,.344),.013,.0165)
    d=smooth_union(d,wrist,.007)
    # Soft thenar/thumb base is inside palm and transitions to a curved thumb.
    thenar=sdf_ellipsoid(q,(.039,.516,.357),(.009,.016,.008))
    d=smooth_union(d,thenar,.004)
    # Four deliberately short digits (plus one thumb). Soft unequal rounded
    # endpoints, decreasing length toward outer edges, slight inwards curl.
    tip_y=(.601,.614,.608,.594)
    for i in range(4):
        bx=.0095+i*.0124
        p0=(bx,.544,.350)
        p1=(bx-.0008,.569,.354+.001*i)
        p2=(bx-.0019,tip_y[i]-.005,.351+.0008*i)
        p3=(bx-.0025,tip_y[i],.346+.0008*i)
        f=sdf_taper_capsule(q,p0,p1,.0069,.0063)
        f=smooth_union(f,sdf_taper_capsule(q,p1,p2,.0063,.0057),.0015)
        f=smooth_union(f,sdf_taper_capsule(q,p2,p3,.0057,.0050),.0014)
        d=smooth_union(d,f,.0025)
    # Small thumb rests diagonally over the palm front rather than a detached
    # triangular front wedge. The last tip bends gently inwards, not forward.
    thumb=sdf_taper_capsule(q,(.044,.509,.357),(.034,.526,.361),.0075,.0070)
    thumb=smooth_union(thumb,sdf_taper_capsule(q,(.034,.526,.361),(.021,.540,.360),.0070,.0055),.003)
    d=smooth_union(d,thumb,.0035)
    verts,faces,_,_=marching_cubes(d,level=0.,spacing=(voxel,voxel,voxel),allow_degenerate=False)
    verts+=np.array([x[0],y[0],z[0]])
    hand=p04.mk(verts,faces)
    # marching-cubes orientation can invert under mirror; normal-repair it.
    hand.fix_normals()
    # Reduce only the new fine hand isosurface, never the old face/legs/hair.
    # VTK quadric decimation at ~52% fewer triangles while retaining fingertip
    # curvature and using no remesh on the frozen body/palette meshes.
    import vtk
    from vtk.util.numpy_support import numpy_to_vtk, vtk_to_numpy
    poly=vtk.vtkPolyData();pts=vtk.vtkPoints()
    pts.SetData(numpy_to_vtk(np.asarray(hand.vertices,dtype=np.float32),deep=True))
    poly.SetPoints(pts)
    f=np.asarray(hand.faces,dtype=np.int64)
    offsets=np.arange(0,4*(len(f)+1),4,dtype=np.int64)
    conn=np.column_stack((np.full(len(f),3,dtype=np.int64),f)).reshape(-1)
    cells=vtk.vtkCellArray();cells.SetCells(len(f),numpy_to_vtk(conn,deep=True,array_type=vtk.VTK_ID_TYPE))
    poly.SetPolys(cells)
    dec=vtk.vtkQuadricDecimation();dec.SetInputData(poly);dec.SetTargetReduction(.48)
    dec.Update();result=dec.GetOutput()
    outv=vtk_to_numpy(result.GetPoints().GetData()).copy()
    outfaces=vtk_to_numpy(result.GetPolys().GetConnectivityArray()).reshape(-1,3).copy()
    reduced=p04.mk(outv,outfaces)
    if reduced.is_watertight and reduced.is_winding_consistent and len(reduced.faces)<len(hand.faces):
        hand=reduced
    assert hand.is_watertight and hand.is_winding_consistent
    assert len(hand.split(only_watertight=False))==1,'Each palm+fingers must be ONE shell'
    return hand


def refined_praying_arm_and_sleeves():
    """Keep original arm path/shoulder, adjust last two cuff radii ONLY."""
    sleeves=[];hands=[]
    for sign in (-1,1):
        arm=[(sign*.155,.521,-.024),(sign*.230,.457,.040),
             (sign*.255,.397,.124),(sign*.195,.391,.217),
             (sign*.104,.430,.304),(sign*.062,.463,.325)]
        # P05 original radii [.077,.079,.073,.065,.048,.041]; the first four
        # stay identical, the last two are reduced 2 mm/5 mm to make cuff
        # meet the refined narrow wrist without the old bulbous sleeve lip.
        sleeve=p05.sweep(arm,[.077,.079,.073,.065,.046,.036],segments=12,samples=5)
        sleeves.append(sleeve)
        hands.append(one_soft_hand(sign))
    return sleeves,hands


def main():
    # The original builder is preserved unmodified. Its only replaced hook is
    # the explicit hand+forearm mesh generator; no replacement of legs/hair/etc.
    p05.praying_arm_and_sleeves=refined_praying_arm_and_sleeves
    p05.POSE_FILES.update(OUTPUT)
    result={}
    for pose in ('cross_prayer','kneel_prayer'):
        measured,scene=p05.run_pose(pose)
        path=ROOT/OUTPUT[pose]
        j,b=p04.parse_glb(path.read_bytes())
        j.setdefault('extras',{})['P05b']={
            'poseId':pose,'revision':'p5b','parentRevision':'p5',
            'surgicalScope':'prayer hands/wrists/two sleeve cuff radii only',
            'p05OriginalBuilderSha256':EXPECTED['p05_source_frozen.py'],
            'p04FrozenSourceSha256':EXPECTED['p04_source_frozen.py'],
            'method':'per-hand SDF smooth union to produce a single watertight palm+finger+thumb with rounded tips',
            'ownerArtGate':'P05B_FEMALE_HAND_ART_OWNER_REVIEW_REQUIRED'
        }
        out=p04.pack(j,b);path.write_bytes(out)
        measured['sha256']=hashlib.sha256(out).hexdigest()
        measured['bytes']=len(out)
        measured['file']=path.name
        result[pose]=measured
        print(json.dumps({k:measured[k] for k in ['poseId','file','sha256','bytes','triangles','vertices','meshes','materials','animations']},indent=2))
    (ROOT/'P05B_BUILD_METRICS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':main()
