import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const load = name => readFileSync(join(directory,name+'.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const take = (rows,event) => {
  const row = rows.find(row=>row.event===event);
  assert(row,event);
  return row;
};
const native = load('native-cinematic');
const synthetic = load('quick-cinematic');
const oldPerf = load('perf-hero');
const newPerf = load('perf-cinematic');
for (const rows of [native,synthetic,oldPerf,newPerf]) take(rows,'complete');
const current = take(native,'ready');
const baseline = take(oldPerf,'ready');
const candidate = take(newPerf,'ready');
assert.equal(current.layoutSha256, baseline.layoutSha256);
assert.equal(candidate.layoutSha256, baseline.layoutSha256);
assert.equal(current.asset.sha256, baseline.asset.sha256);
assert.equal(candidate.graphics, baseline.graphics);
const cycles = take(native,'cycles');
const video = take(native,'video');
assert.deepEqual([video.width,video.height],[720,1280]);
assert(Number(video.duration)>=136);
const frames = load('native-cinematic-idle-frames');
const actual = frames.filter(row=>!row.hidden && Number.isFinite(row.phase));
const lengths = [];
let maxStep = 0;
for (let i=1;i<actual.length;i++) {
  const before=actual[i-1],after=actual[i];
  const dt=after.phase-before.phase;
  assert(dt>=0);
  assert(!after.pathBlocked);
  const distance=Math.hypot(...after.position.map((v,j)=>v-before.position[j]));
  maxStep=Math.max(maxStep,distance);
  if(dt===0) assert(distance<1e-8);
  else lengths.push(distance/dt);
}
const pts = new Set(actual.map(row=>row.shot));
assert.equal(pts.size,6);
assert(actual.at(-1).phase-actual[0].phase>=136);
const gifts=take(synthetic,'gifts-verified');
assert.equal(gifts.ack,9);
assert.equal(gifts.count,5);
assert.deepEqual(gifts.visits.map(row=>row.name),['A','B','C','A']);
assert(gifts.unseated);
const hidden=take(synthetic,'background');
assert(hidden.pcm.rms>0&&hidden.ownerRetained&&hidden.ack===10);
take(synthetic,'webgl-recovered');
const fallbackSet = [
  ['fallback-cinematic','R18A','hero'],
  ['fallback-cinematic-missing-r18a','R17B','cinematic'],
  ['fallback-cinematic-missing-r18a-r17b','R16','cinematic'],
];
const fallback = fallbackSet.map(([file,tree,route])=>{
  const rows=load(file);
  take(rows,'complete');
  const state=take(rows,'ready');
  assert.equal(state.world.tree,tree);
  assert.equal(state.camera.effective,route);
  return { file, tree, route, status:state.world, reason:state.camera.reason, receipts:state.camera.receipts };
});
const summary={
  base:baseline.revision, execution:current.revision, device:current.graphics, camera:current.camera,
  layoutSha256:current.layoutSha256, assetSha256:current.asset.sha256,
  offline:{phaseFrom:actual[0].phase,phaseTo:actual.at(-1).phase,actualFrames:actual.length,
    shots:cycles.shots,maxEyeStep:maxStep,maxEyeSpeedPerPhaseSecond:Math.max(...lengths),video},
  synthetic:{gifts,hidden,recovery:take(synthetic,'webgl-recovered')},
  fallback,
  perf:{baseline:take(oldPerf,'idle-frames'),candidate:take(newPerf,'idle-frames')},
};
writeFileSync(join(directory,'results.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({offline:summary.offline,perf:summary.perf}));
