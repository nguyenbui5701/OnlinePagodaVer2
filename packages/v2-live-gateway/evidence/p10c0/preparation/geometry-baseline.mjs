import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
const app = join(dir, 'baseline-610b8c7/apps/v2-viewer');
const load = path => import(pathToFileURL(join(app,path)).href);
const { Box3, Vector3 } = await load('node_modules/three/build/three.module.js');
const { GLTFLoader } = await load('node_modules/three/examples/jsm/loaders/GLTFLoader.js');
const { createHeroRoutes } = await load('src/hero-camera.ts');
const { capture, loopSeconds } = await load('src/camera.ts');
const meta = JSON.parse(await readFile(join(dir,'native-baseline/loaded-scene.json'),'utf8'));
const tree = new Vector3(...meta.treeTarget);
const route = createHeroRoutes(tree,9);
const assets = [
  ['R18A','r18a','sakura-r18a.json'],
  ['R17B','r17b','sakura-r17b.json'],
  ['R16','r16','sakura-r16.json'],
  ['B9 terrain','b9','environment-b9.json'],
];
const json = path => readFile(join(app,path),'utf8').then(JSON.parse);
const summary = [];
const hz = 60;
const points=Array.from({length:loopSeconds*hz*2+1},(_,i)=>route.sample(i/hz));
for (const [name,folder,manifest] of assets) {
  const doc = await json('src/'+manifest);
  const spec = name === 'B9 terrain' ? Object.values(doc.files ?? doc.assets ?? doc.profiles).find(item=>item.profile==='quality' && item.kind==='terrain') : doc.profiles.quality;
  assert(spec?.file,name + ' manifest');
  const bytes = await readFile(join(app,'public',folder,spec.file));
  const sha256=createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256,spec.sha256);
  assert.equal(bytes.length,spec.bytes);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const root=gltf.scene;
  if(name==='B9 terrain') root.position.add(tree);
  root.updateMatrixWorld(true);
  const boxes=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    boxes.push(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });
  const precise=new Box3().setFromObject(root,true);
  let lower=Infinity;
  for(const {position} of points) for(const box of boxes) lower=Math.min(lower,box.distanceToPoint(position));
  summary.push({ name,file:spec.file,sha256,bytes:bytes.length,meshBoxes:boxes.length,
    vertexBounds:[precise.min.toArray(),precise.max.toArray()], sampledEyeDistanceLowerBound:lower });
}
const velocity=[];
const aim = p=>p.target.clone().sub(p.position).normalize();
const fovStep=[];
const angularStep=[];
const targetStep=[];
let minY=Infinity, minDistance=Infinity, lowCameraSamples=0, minFov=Infinity,maxFov=-Infinity;
for (let i=0;i<points.length;i++) {
  const p=points[i];
  minY=Math.min(minY,p.position.y);
  minDistance=Math.min(minDistance,p.target.distanceTo(p.position));
  minFov=Math.min(minFov,p.fov);maxFov=Math.max(maxFov,p.fov);
  if(i){
    const previous=points[i-1];
    velocity.push(p.position.clone().sub(previous.position).multiplyScalar(hz));
    fovStep.push(Math.abs(p.fov-previous.fov)*hz);
    angularStep.push(aim(previous).angleTo(aim(p))*hz);
    targetStep.push(p.target.distanceTo(previous.target)*hz);
  }
}
for(let i=0;i<534;i++) if(route.sample(i*.3).position.y<2.3) lowCameraSamples++;
const peakAcceleration=Math.max(...velocity.slice(1).map((v,i)=>v.distanceTo(velocity[i])*hz));
const seam=[40,80].map(t=> {
  const i=t*hz;
  return {t, stepBefore:velocity[i-1].length()/hz,
    stepAfter:velocity[i]?.length()/hz,
    fovRateBefore:fovStep[i-1], fovRateAfter:fovStep[i] };
});
const result={definition:'QUALITY baseline routes sampled 60 Hz across both mirrored hero cycles; mesh-box distance is a point-sample broad-phase lower bound only', tree:tree.toArray(), summary,
  minY,minDistance,minFov,maxFov,lowCameraSamples,peakSpeed:Math.max(...velocity.map(v=>v.length())),
  peakAcceleration,peakAngularRadPerS:Math.max(...angularStep),peakTargetUnitsPerS:Math.max(...targetStep),peakFovDegPerS:Math.max(...fovStep),
  halfDiagonalMaxNearPlane:Math.hypot(capture.near,Math.tan(64*Math.PI/360)*capture.near,Math.tan(64*Math.PI/360)*capture.near*capture.width/capture.height),seam };
await writeFile(join(dir,'geometry-baseline.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
