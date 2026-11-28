import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=dirname(fileURLToPath(import.meta.url));
const load=name=>readFileSync(join(dir,name+'.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const good=rows=>assert.equal(rows.at(-1).event,'complete');
const delta=(a,b)=>a.map((value,i)=>value-b[i]);
const norm=vector=>Math.hypot(...vector);
const divide=(a,s)=>a.map(v=>v/s);
function eyeMetrics(rows,legacy) {
  const frames=rows.filter((r,i)=>!r.hidden&&Number.isFinite(r.renderMs)&&r.renderMs!==rows[i-1]?.renderMs);
  const active=row=>legacy?['GIFT_TRANSITION','CINE_RETURN'].includes(row.mode)
    : ['braking','focus-travel','focus-optical','return','return-rejoin'].includes(row.motion?.status);
  const max={eyeSpeed:0,eyeAcceleration:0,aimRadPerS:0,fovDegPerS:0,frameStep:0};
  let previous, during=0, gaps=0;
  for(let i=1;i<frames.length;i++){
    const a=frames[i-1],b=frames[i],t=(b.renderMs-a.renderMs)/1000;
    if(t<=0||t>.250){previous=undefined; gaps++;continue;}
    const accelInterval=active(a)||active(b)||active(frames[i-2]??a);
    if(!active(a)&&!active(b)&&!accelInterval){previous=undefined;continue;}
    const step=delta(b.position,a.position), velocity=divide(step,t);
    const x=delta(a.target,a.position),y=delta(b.target,b.position);
    const u=divide(x,norm(x)),v=divide(y,norm(y));
    const dot=u.reduce((sum,value,index)=>sum+value*v[index],0);
    max.aimRadPerS=Math.max(max.aimRadPerS,Math.acos(Math.min(1,Math.max(-1,dot)))/t);
    max.fovDegPerS=Math.max(max.fovDegPerS,Math.abs(a.fov-b.fov)/t);
    max.eyeSpeed=Math.max(max.eyeSpeed,norm(velocity));
    max.frameStep=Math.max(max.frameStep,norm(step));
    if(previous) max.eyeAcceleration=Math.max(max.eyeAcceleration,norm(delta(previous.velocity,velocity))/((t+previous.t)/2));
    previous={velocity,t};
    during++;
  }
  return {samples:during,discardedGaps:gaps,...max};
}
const native=load('r1-cinematic'), hero=load('r1-hero');
good(native);good(hero);
const frames=load('r1-cinematic-live-frames'), legacy=load('r1-hero-live-frames');
const starts=native.filter(row=>row.event==='gift-start-r1'),ends=native.filter(row=>row.event==='gift-end-r1');
assert.equal(starts.length,6);
const shots=starts.map((start,i)=>{
  const end=ends[i];
  assert.deepEqual(end.shownNames.map(x=>x.name),end.focusNames.map(x=>x.name));
  assert.deepEqual(end.voices.map(x=>x.request),end.shownNames.map(x=>x.request));
  assert(end.phase>=start.phase-1&&end.phase<=start.phase+1.5);
  const segment=frames.filter(row=>row.renderMs>=start.renderMs-60&&row.renderMs<(starts[i+1]?.renderMs??Infinity));
  const plans=new Map();
  for(const r of segment) {
    const status=r.motion?.status, bridge=r.motion?.bridge;
    if (!bridge || !['focus-optical','focus-travel','return','return-rejoin'].includes(status)) continue;
    const id=JSON.stringify([status,bridge.distance,bridge.durationMs,bridge.phase]);
    if (!plans.has(id)) plans.set(id,{status,...bridge});
  }
  return {shot:start.shot,phase:start.phase,resumed:end.phase,ack:end.ack,
    styles:[...new Set(segment.map(row=>row.motion?.status).filter(status=>status?.startsWith('focus-')))],
    plannedBridges:[...plans.values()],
    visible:end.shownNames.map(f=>{
      const actual=segment.find(row=>row.shown?.request===f.request);
      assert(actual?.shown.seatId===f.seatId&&actual.shown.actorId===f.actorId);
      const modeStart=segment.find(row=>row.mode==='GIFT_FOCUS'&&row.focus?.requestId===f.request);
      return {name:f.name,seat:f.seatId,delayAfterFirstFocusFrameMs:actual.renderMs-modeStart.renderMs};
    }),motion:eyeMetrics(segment,false)};
});
const all=eyeMetrics(frames,false);
assert(all.eyeSpeed<=12.1 && all.eyeAcceleration<=53.5 && all.aimRadPerS<=1.28 && all.fovDegPerS<=61);
const blocked=JSON.parse(readFileSync(join(dir,'blocked-return-native.json'),'utf8'));
const recoveryMs=blocked.completedAt-blocked.injectedAt;
assert(blocked.samples.some(row=>row.status==='return-rejoin')&&blocked.samples.at(-1).status==='idle');
assert(blocked.samples.filter(row=>row.now>=blocked.injectedAt).every(row=>!row.shown));
const result={ execution:native[0].revision,legacyExecution:hero[0].revision,
  nativeGiftMotion:all,legacyHeroMotion:eyeMetrics(legacy,true),shots,blockedReturn:{recoveryMs,
  savedPhase:blocked.anchor,rejoinedPhase:blocked.samples.at(-1).phase,samples:blocked.samples.length},
  returnInterrupted:native.some(row=>row.event==='return-interrupt-r1') };
assert(result.returnInterrupted);
writeFileSync(join(dir,'motion-summary.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
