import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Box3, BoxGeometry, Group, InstancedMesh, Matrix4, MeshBasicMaterial, Vector3 } from 'three';
import { createCameraClearance, meshCameraBounds } from '../src/camera-clearance.ts';
import { createRotationRoute, rotationShots, validateRotation } from '../src/cinematic-rotation.ts';
import { liveDefaults, migrateVisualSettings, validSettings } from '../src/live-settings.ts';
import { planCameraBridge, RotationDirector } from '../src/rotation-director.ts';

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const box = (x: number, y: number, z: number, side: number) => new Box3().setFromCenterAndSize(v(x,y,z), v(side,side,side));

test('six timed compositions repeat at 68 s with matching eye, aim, lens and wall-clock tangents', () => {
  for (const side of [1, -1] as const) {
    const route = createRotationRoute(v(0,0,0), 9, side);
    assert.equal(route.duration, 68);
    for (const [second, label] of rotationShots) {
      assert.equal(route.sample(second).shot, label);
      assert.equal(route.sample(second + 68).shot, label);
    }
    const seam = route.sample(68);
    const start = route.sample(0);
    assert(seam.position.equals(start.position));
    assert(seam.target.equals(start.target));
    assert.equal(seam.fov, start.fov);
    for (const k of [0, 12, 24, 34, 46, 56, 68]) {
      const p = route.sample(k);
      const before = route.sample(k - .001);
      const after = route.sample(k + .001);
      assert(p.position.clone().sub(before.position).sub(after.position.clone().sub(p.position)).length() < .00002);
      assert(p.target.clone().sub(before.target).sub(after.target.clone().sub(p.target)).length() < .00002);
      assert(Math.abs(2 * p.fov - before.fov - after.fov) < .00002);
    }
    const receipt = validateRotation(route, createCameraClearance([]));
    assert.deepEqual(receipt.motionFailures, []);
    assert.deepEqual(receipt.collisions, []);
  }
});

test('swept cubic detects an obstruction between endpoints and reserves the water floor', () => {
  const clearance = createCameraClearance([{ group:'lotus', box:box(0, 3, 0, .08) }]);
  const a = v(-2,3,0), b = v(2,3,0);
  assert.equal(clearance.lineIssue(a,a), undefined);
  assert.equal(clearance.lineIssue(b,b), undefined);
  assert.equal(clearance.curveIssue([a,v(-1,3,0),v(1,3,0),b]), 'lotus');
  assert.equal(clearance.lineIssue(v(-2,3,.19),v(2,3,.19)), 'lotus');
  assert.equal(clearance.lineIssue(v(-2,3,.25),v(2,3,.25)), undefined);
  assert.equal(clearance.lineIssue(v(-2,.79,0),v(2,3,0)), 'water-floor');
});

test('geometry bounds include actual world and per-instance transforms', () => {
  const group = new Group();
  group.position.set(0, 3, 1);
  const mesh = new InstancedMesh(new BoxGeometry(.5,.5,.5), new MeshBasicMaterial(), 2);
  mesh.setMatrixAt(0, new Matrix4().makeTranslation(2, 0, 0));
  mesh.setMatrixAt(1, new Matrix4().makeTranslation(4, 0, 0));
  group.add(mesh);
  const bounds = meshCameraBounds(group,'lotus');
  assert.deepEqual(bounds.map(entry => entry.box.getCenter(v(0,0,0)).toArray()), [[2,3,1],[4,3,1]]);
});

test('a blocked direct gift approach chooses a checked corridor and a blocked goal fails closed', () => {
  const solid = createCameraClearance([{ group:'tree', box:box(0,1,0,2) }]);
  const from = v(-3,1,0), to = v(3,1,0);
  assert.equal(solid.lineIssue(from,to), 'tree');
  const path = planCameraBridge(from,to,solid)!;
  assert(path.length > 2);
  assert(path.slice(1).every((point,i)=>!solid.lineIssue(path[i],point)));
  assert.equal(planCameraBridge(from,v(0,1,0),solid),undefined);
});

test('gift A, B, C and return interruption keep the saved phase, move from the rendered pose and resume', () => {
  const route = createRotationRoute(v(0,0,0),9,1);
  const director = new RotationDirector(route.sample,createCameraClearance([]));
  let time=0;
  for(;time<=17000;time+=20) director.step(time,true);
  const saved=director.phase;
  let held: number | undefined;
  const gift=(requestId:string,x:number)=>({requestId,pose:{position:v(x,2,12),target:v(x,1,16),fov:50}});
  const until=(condition:()=>boolean, focus?: ReturnType<typeof gift>, ms=4500)=>{
    const end=time+ms;
    while(!condition() && time<end) { time+=20; director.step(time,true,focus); }
    assert(condition());
  };
  for(const [id,x] of [['A',2],['B',3],['C',4]] as const) {
    const before=director.step(time,true,id==='A'?undefined:gift(id==='B'?'A':'B',x-1));
    assert(director.step(time,true,gift(id,x)).position.equals(before.position));
    until(()=>director.reachedFocus,gift(id,x));
    held ??= director.phase;
    assert.equal(director.phase,held);
  }
  assert(held!>=saved && held!-saved<=.221);
  director.step(time,true);
  time+=60;
  const returning=director.step(time,true);
  assert(director.step(time,true,gift('D',5)).position.equals(returning.position));
  until(()=>director.reachedFocus,gift('D',5));
  director.step(time,true);
  until(()=>director.phase>held!,undefined,17000);
  assert(director.phase<held!+.1);
});

test('a blocked saved return reconnects to a reachable phase with no subsequent gift', () => {
  let blocked = false;
  const anchor = v(0,5,0);
  const route = (phase:number) => {
    const t = phase*Math.PI/4;
    const position=v(Math.sin(t)*4,5,4-4*Math.cos(t));
    return {position,target:position.clone().add(v(0,0,5)),fov:50};
  };
  const clear = createCameraClearance([]);
  const director = new RotationDirector(route, { ...clear, lineIssue(a,b) {
    return blocked && b.distanceTo(anchor)<.4 ? 'fixture-closed-anchor' : undefined;
  } });
  const focus = {requestId:'A',pose:{position:v(0,5,3),target:v(0,5,8),fov:50}};
  director.step(0,true);
  director.step(0,true,focus);
  for(let t=20;t<3000;t+=20) director.step(t,true,focus);
  assert(director.reachedFocus);
  anchor.copy(route(director.phase).position);
  blocked=true;
  const status = () => director.status;
  director.step(3000,true);
  assert.equal(status(),'return-rejoin');
  let before=director.step(3020,true);
  for(let t=3040;t<=8000;t+=20) {
    const next=director.step(t,true);
    if(status()!=='idle') assert(next.position.distanceTo(before.position)<.25);
    before=next;
  }
  assert.equal(status(),'idle');
  assert(!director.blocked);
  assert(director.phase>1);
});

test('an occluded gift and a disconnected return hold safe poses without publishing a focus', () => {
  const route=createRotationRoute(v(0,0,0),9,1);
  let blocked=false;
  const director=new RotationDirector(route.sample,{ ...createCameraClearance([]),
    lineIssue:()=>blocked?'fixture-wall':undefined });
  director.step(0,true);
  for(let t=20;t<=2400;t+=20)
    director.step(t,true,{requestId:'occluded',pose:route.sample(10),canSee:()=>false});
  assert.equal(director.status,'focus-unavailable');
  assert(!director.reachedFocus);
  blocked=true;
  const before=director.step(2420,true);
  assert.equal(director.status,'safe-hold');
  assert(director.step(2440,true).position.equals(before.position));
  assert(!director.reachedFocus);
});

test('hidden and long gaps pause camera motion and avoid a stale reached-focus marker', () => {
  const route = createRotationRoute(v(0,0,0),9,-1);
  const director = new RotationDirector(route.sample,createCameraClearance([]));
  const before=director.step(100,true);
  assert(director.step(300,true).position.distanceTo(before.position)>0);
  const phase=director.phase;
  director.step(315,false,{requestId:'hidden',pose:route.sample(5)});
  director.pause();
  director.step(9500,true);
  assert.equal(director.phase,phase);
  assert.equal(director.reachedFocus,false);
  director.step(9520,true);
  assert.equal(director.phase,phase+.02);
});

test('Cinematic Rotation is a QUALITY opt-in and historical settings keep their camera choices', () => {
  const legacy={...liveDefaults};
  assert.deepEqual(migrateVisualSettings(legacy),legacy);
  assert(validSettings({...legacy,profile:'quality',shots:'cinematic'}));
  assert(!validSettings({...legacy,shots:'cinematic'}));
  assert(!validSettings({...legacy,profile:'quality',shots:'unreviewed'}));
});
