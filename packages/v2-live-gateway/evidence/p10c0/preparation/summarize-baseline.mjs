import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const app=join(dir,'baseline-610b8c7/apps/v2-viewer');
const load=path=>import(pathToFileURL(join(app,path)).href);
const {Vector3}=await load('node_modules/three/build/three.module.js');
const {createHeroRoutes}=await load('src/hero-camera.ts');
const text=await readFile(join(dir,'native-baseline/camera.jsonl'),'utf8');
const rows=text.trim().split(/\r?\n/).map(JSON.parse);
const data=rows.filter(row=>row.event==='sample');
const last=rows.at(-1);
assert.equal(last.event,'complete');
assert(data.every(row=>row.repoRevision==='610b8c738c5925b722b028de7067fedcfaaafd06' && row.canvas.join()==='720,1280'));
const seq=name=>rows.find(row=>row.event===name);
const world=JSON.parse(await readFile(join(dir,'native-baseline/loaded-scene.json'),'utf8'));
const route=createHeroRoutes(new Vector3(...world.treeTarget),world.requested.seed);
const offline=data.filter(row=>row.phase==='offline');
const delta=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const tolerance=1e-5;
function residual(actual, expected){
  return Math.max(delta(actual.position,expected.position.toArray()),delta(actual.target,expected.target.toArray()),Math.abs(actual.fov-expected.fov));
}
const offlineResidual=Math.max(...offline.map(row=>residual(row,route.sample(Math.round(row.elapsedSeconds*1000)/1000))));
assert(offlineResidual<tolerance);
const offlineByShot=last.offline.map(shot=>{
  const selected=offline.filter(row=>row.shot===shot);
  const start=selected[0], end=selected.at(-1);
  return {shot,samples:selected.length,firstSec:start.elapsedSeconds,lastSec:end.elapsedSeconds,
    ranges:[0,1,2].map(i=>[Math.min(...selected.map(r=>r.position[i])),Math.max(...selected.map(r=>r.position[i]))]),
    eyeTravel:selected.slice(1).reduce((sum,r,i)=>r.cycle===selected[i].cycle ? sum+delta(selected[i].position,r.position) : sum,0),
    aimTravel:selected.slice(1).reduce((sum,r,i)=>r.cycle===selected[i].cycle ? sum+delta(selected[i].target,r.target) : sum,0),
    fovRange:[Math.min(...selected.map(r=>r.fov)),Math.max(...selected.map(r=>r.fov))]};
});
const before=seq('provider-gifts-A-B-C').preInterrupt;
const after=seq('natural-first-resume').pose;
let matched={error:Infinity,routeSec:null};
for(let step=0;step<40000;step++){
  const routeSec=after.cycle*40+step/1000;
  const error=residual(after,route.sample(routeSec));
  if(error<matched.error) matched={error,routeSec};
}
assert(matched.error<tolerance);
const marks=JSON.parse(await readFile(join(dir,'native-baseline/audio-marks.json'),'utf8'));
const recent=marks.filter(mark=>mark.event==='voice-start');
assert.deepEqual(recent.map(mark=>mark.seat),['seat-1','seat-2','seat-3']);
const modeEntries=data.filter((row,i)=>i===0||row.mode!==data[i-1].mode||row.focus?.requestId!==data[i-1].focus?.requestId)
  .map(r=>({mode:r.mode,seconds:r.elapsedSeconds,shot:r.shot,renderMinusWorkerMs:Math.round(r.elapsedSeconds*1000)-r.liveTickMs,
    position:r.position,target:r.target,fov:r.fov,phase:r.phase,focus:r.focus?.name,seat:r.focus?.seatId,ack:r.gatewayAck,pending:r.pendingGivers}));
const lotus=world.lotus.instances.reduce((sum,{kind})=>({...sum,[kind]:(sum[kind]||0)+1}),{});
const result={execution:data[0].repoRevision, browser:world.browser,graphics:data[0].graphics,
  samples:data.length, offlineSamples:offline.length,offlineInterval:[offline[0].elapsedSeconds,offline.at(-1).elapsedSeconds],
  offlineRecoveredByElapsedResidual:offlineResidual, offlineByShot, gift:{
    interrupted:{elapsed:before.elapsedSeconds,shot:before.shot}, resumed:{elapsed:after.elapsedSeconds,shot:after.shot,
      matchingRouteSeconds:matched.routeSec,error:matched.error,withoutGiftResetSeconds:after.elapsedSeconds,
      phaseDifferenceSeconds:after.elapsedSeconds-matched.routeSec},
    engineFocus:last.focus, genericVoiceSeats:recent.map(mark=>mark.seat), ack:last.ack, seq:last.seq, modes:modeEntries,
  },lotus,totalDecorativeLotus:world.lotus.instances.length, actualSlots:world.community.length,
  lowCameraSamples:world.lotus.lowCameraSamples.length, stoppedViewpoint:'NOT_REPRODUCED in controlled visible baseline fixture'};
await writeFile(join(dir,'native-summary.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({samples:data.length,offlineByShot:offlineByShot.map(x=>[x.shot,x.samples,x.eyeTravel]),gift:result.gift.resumed,
  lotus,voice:result.gift.genericVoiceSeats}));
