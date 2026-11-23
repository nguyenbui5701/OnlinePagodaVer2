"""P0.5c palm-to-palm orientation only, source-derived from exact P0.5b mesh.

Reuses the original P0.5b SDF hand mesh unchanged in topology. Smoothly
rotates the palm/fingers about local wrist coordinate, so palms (originally
normal roughly +Z) FACE EACH OTHER across X. Independent hand shells are
separated by a constructive non-intersection halfspace x= +/-0.45mm.
No sleeve, leg, hair, face, garment or animation geometry is regenerated
other than using the exact P0.5b frozen source dependency chain.
"""
from pathlib import Path
import hashlib,json
import numpy as np
import procedural_female_hands_p05b as p05b
ROOT=Path(__file__).resolve().parent
p04,p05=p05b.p04,p05b.p05
SOURCE_SHA={'p05b':hashlib.sha256((ROOT/'procedural_female_hands_p05b.py').read_bytes()).hexdigest(),
            'p05':hashlib.sha256((ROOT/'p05_source_frozen.py').read_bytes()).hexdigest(),
            'p04':hashlib.sha256((ROOT/'p04_source_frozen.py').read_bytes()).hexdigest()}
assert SOURCE_SHA=={'p05b':'6f634fc7db7cb6a0d685abb32af57a47b764f3020002671911a0ad21f01f8bc6',
 'p05':'e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9',
 'p04':'b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2'}

# Fixed transform params measured in the exact reference palm coordinate frame.
ROTATION_DEGREES=73.0
INWARD_SHIFT_METERS=.0105
MIN_HALFSPACE_GAP=.00045 # guaranteed separation each side at all triangle barycentric points
SMOOTH_HALFSPACE_RADIUS=.00115
WRIST_BLEND_MIN_Y=.466
WRIST_BLEND_MAX_Y=.531


BASE_ONE_HAND=p05b.one_soft_hand

def oriented_prayer_hand(sign):
    """Turn palm surface to +/- X without re-meshing or changing cuff anchor.

    +Z prior frontal palm normal maps to inward -X for right hand, +X for left.
    Rotation is eased from wrist to fingers; no global asset/camera transform.
    Smooth positive halfspace compresses only the facing/contact surfaces,
    keeping two distinct watertight non-intersecting meshes with ~1mm contact.
    """
    hand=BASE_ONE_HAND(sign)
    v=hand.vertices.copy()
    pivot=np.array([sign*.028,.523,.347])
    rel=v-pivot
    t=np.clip((v[:,1]-WRIST_BLEND_MIN_Y)/(WRIST_BLEND_MAX_Y-WRIST_BLEND_MIN_Y),0,1)
    t=t*t*(3-2*t)
    angle=np.deg2rad(-sign*ROTATION_DEGREES)*t
    c=np.cos(angle);s=np.sin(angle)
    x=c*rel[:,0]+s*rel[:,2]
    z=-s*rel[:,0]+c*rel[:,2]
    v[:,0]=pivot[0]+x-sign*INWARD_SHIFT_METERS*t
    v[:,2]=pivot[2]+z
    # Map each hand to its own OPEN halfspace; no hand-on-hand penetration
    # can exist if all vertices of each triangulated shell stay there.
    u=sign*v[:,0]
    d=u-MIN_HALFSPACE_GAP
    u_new=MIN_HALFSPACE_GAP+.5*(d+np.sqrt(d*d+SMOOTH_HALFSPACE_RADIUS**2))
    v[:,0]=sign*u_new
    result=p04.mk(v,np.asarray(hand.faces,dtype=np.int64))
    assert result.is_watertight and result.is_winding_consistent
    assert len(result.split(only_watertight=False))==1
    assert np.min(sign*result.vertices[:,0])>=MIN_HALFSPACE_GAP
    assert len(result.faces)==len(hand.faces)
    return result

POSE_FILES={'cross_prayer':'meditator_female_cross_prayer_p05c.glb',
            'kneel_prayer':'meditator_female_kneel_prayer_p05c.glb'}


def main():
    # Scoped monkeypatch: keep P0.5b arm+sleeve method; ONLY swap hand vertices.
    p05b.one_soft_hand=oriented_prayer_hand
    p05.praying_arm_and_sleeves=p05b.refined_praying_arm_and_sleeves
    p05.POSE_FILES.update(POSE_FILES)
    data={}
    for pose in ('cross_prayer','kneel_prayer'):
        metrics,_scene=p05.run_pose(pose)
        path=ROOT/POSE_FILES[pose]
        gltf,binary=p04.parse_glb(path.read_bytes())
        gltf.setdefault('extras',{})['P05c']={
            'revision':'p5c','pose':pose,'parentRevision':'p5b',
            'scope':'Local upper palms/wrist vertex orientation and palm-to-palm contact ONLY; same mesh face indices',
            'sourceSHA256':SOURCE_SHA,
            'geometry':'72+ degree locally eased Y rotation, inward re-centering, independent disjoint smooth contact halfspaces',
            'palmNormalDirections':'right into -X, left into +X',
            'ownerGate':'P05C_FEMALE_PALM_ART_OWNER_REVIEW_REQUIRED'}
        out=p04.pack(gltf,binary)
        path.write_bytes(out)
        metrics['file']=path.name
        metrics['sha256']=hashlib.sha256(out).hexdigest()
        metrics['bytes']=len(out)
        data[pose]=metrics
        print('[P05C REAL GLB]',pose,metrics['sha256'],metrics['bytes'],metrics['triangles'],flush=True)
    (ROOT/'P05C_BUILD_METRICS.json').write_text(json.dumps(data,indent=2)+'\n')
    return data

if __name__=='__main__':main()
