"""Calculate common portrait full-tree camera from actual R12/R13 GLB geometry.

Does NOT alter mesh or Blender material. Deterministic camera contract used in R13.
The close-up uses original R12 top camera intentionally cropped in 9:16.
"""
import json,math,hashlib,sys
from pathlib import Path
import numpy as np
import trimesh
ROOT=Path(__file__).resolve().parent
R12=ROOT/'r12_quality.glb'
R13=ROOT/'sakura_hero.glb'


def vertices(path):
    scene=trimesh.load(str(path),force='scene')
    acc=[]
    for node in scene.graph.nodes_geometry:
        transform,geom=scene.graph.get(node)
        xyz=np.asarray(scene.geometry[geom].vertices)
        acc.append(trimesh.transform_points(xyz,transform))
    return np.vstack(acc)

def basis(direction):
    d=np.asarray(direction,float);d/=np.linalg.norm(d)
    forward=-d
    up=np.array([0.,1.,0.])
    right=np.cross(forward,up);right/=np.linalg.norm(right)
    ortho_up=np.cross(right,forward)
    return d,right,ortho_up

def extents(points,distance,direction,target,fovy,aspect):
    d,r,u=basis(direction)
    rel=points-np.asarray(target)
    depth=distance-rel@d
    ndc_x=(rel@r)/(depth*np.tan(np.radians(fovy)/2)*aspect)
    ndc_y=(rel@u)/(depth*np.tan(np.radians(fovy)/2))
    return (float(ndc_x.min()),float(ndc_x.max()),float(ndc_y.min()),float(ndc_y.max()),float(depth.min()))

def solve():
    directions=[(.38,.41,.84)]
    target=np.array([.15,12.4,0.])
    fovy=50.;aspect=9/16.;margin=.86
    models={"R12":vertices(R12),"R13":vertices(R13)}
    d,r,u=basis(directions[0]); half=math.tan(math.radians(fovy)/2)
    distance=0.
    for pts in models.values():
        rel=pts-target
        dot=rel@d
        must_x=dot+abs(rel@r)/(half*aspect*margin)
        must_y=dot+abs(rel@u)/(half*margin)
        distance=max(distance,float(must_x.max()),float(must_y.max()))
    distance=math.ceil(distance*1000)/1000
    cam=target+d*distance
    contract={"revision":"R13","reason":"Whole hero crown and roots fit in vertical portrait for BOTH R12 and R13; 14% NDC padding, shared camera, no model edits","hero_full_9x16":{
        'positionYup':[float(x) for x in cam], 'targetYup':[float(x) for x in target],
        'viewUpYup':[0,1,0], 'verticalFovDeg':fovy,'aspectWH':aspect,'resolutionYXRatio':16/9,
        'fitMarginNDC':margin, 'distanceM':distance},
       'hero_close_9x16':{'positionYup':[3,54,10],'targetYup':[0,13.5,0],'viewUpYup':[0,0,-1],'verticalFovDeg':50.,'aspectWH':aspect,'purpose':'deliberately cropped close aerial, not whole canopy'},
       'diagnostics':{name:{'vertexCount':len(points),'NDCleftRightBottomTopDepthMin':extents(points,distance,directions[0],target,fovy,aspect)} for name,points in models.items()},
       'inputs':{'r12_quality.glb':hashlib.sha256(R12.read_bytes()).hexdigest(),
                 'sakura_hero.glb':hashlib.sha256(R13.read_bytes()).hexdigest()}}
    out=ROOT/'camera_contract_R13.json';out.write_text(json.dumps(contract,indent=2)+'\n')
    print(json.dumps(contract,indent=2))

if __name__=='__main__':solve()
