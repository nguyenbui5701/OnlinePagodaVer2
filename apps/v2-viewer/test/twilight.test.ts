import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Scene } from 'three';
import { bindGoldEmphasis, createTwilight, setupLighting } from '../src/lighting.ts';
import { LookTimeline, looks, parseLook, sampleLookWeights } from '../src/twilight.ts';
import { fxProfiles } from '../src/fx-profiles.ts';
import { createWater } from '../src/water.ts';

test('shot boundaries and 40s closure keep normalized deterministic weights', () => {
  for (const boundary of [9,16,29,40,80]) {
    const before = sampleLookWeights(boundary - 1/60);
    const after = sampleLookWeights(boundary + 1/60);
    assert.ok(before.every((v,i) => Math.abs(v-after[i]) < .02));
  }
  for (let frame=0;frame<85*60;frame++) {
    const t=frame/60;
    const weights=sampleLookWeights(t);
    assert.ok(weights.every(w=>w>=0&&w<=1));
    assert.ok(Math.abs(weights.reduce((a,b)=>a+b)-1)<1e-10);
    assert.deepEqual(weights,sampleLookWeights(t));
  }
  assert.deepEqual(sampleLookWeights(0),sampleLookWeights(40));
  assert.deepEqual(sampleLookWeights(20),[0,1,0]);
  assert.deepEqual(sampleLookWeights(34.5),[0,0,1]);
});

test('gift and route-clock reset ease from the current output and reuse weight storage', () => {
  const a = new LookTimeline();
  const b = new LookTimeline();
  const yellow = a.update(34500,34.5,false);
  assert.deepEqual(yellow,[0,0,1]);
  assert.equal(a.update(34517,34.517,true),yellow);
  assert.deepEqual(yellow,[0,0,1]);
  b.update(34500,34.5,false);
  b.update(34517,34.517,true);
  for (let at=34534;at<=35010;at+=17) {
    assert.deepEqual(a.update(at,at/1000,true),b.update(at,at/1000,true));
  }
  const beforeReturn=[...yellow];
  assert.deepEqual(a.update(35020,1.2,false),beforeReturn);
  assert.deepEqual(a.update(37000,3.18,false),[1,0,0]);
});

test('legacy pins P0.10 and comparison cameras, while lookup allows three review holds', () => {
  assert.equal(parseLook(null),'twilight');
  assert.equal(parseLook('legacy'),'legacy');
  assert.equal(parseLook('gold',true),'legacy');
  const timeline = new LookTimeline();
  assert.deepEqual(timeline.update(100,25,false,'pink'),[0,1,0]);
  assert.deepEqual(timeline.update(101,25,false,'gold'),[0,0,1]);
  assert.deepEqual(timeline.update(102,25,false,'dusk'),[1,0,0]);
});

test('twilight reuses light and sky resources, with bounded exposure and fog', () => {
  for(const profile of ['eco','quality'] as const) {
    const scene = new Scene();
    const rig = setupLighting(scene,profile,false);
    assert.equal(rig.directionals.length,3);
    assert.equal(rig.directionals.filter(light=>light.castShadow).length,profile==='eco'?0:1);
    const count=scene.children.length;
    const twilight = createTwilight(scene,rig);
    for (const w of [[1,0,0],[0,1,0],[0,0,1],[.2,.5,.3]]) {
      const a = twilight.update(w);
      assert.ok(a.exposure>=.92&&a.exposure<=1);
      assert.ok(a.veinEmissive>=1&&a.veinEmissive<=1.42);
      assert.ok(rig.fog!.density>=.01&&rig.fog!.density<=.013);
      assert.equal(scene.children.length,count+1);
    }
    assert.equal(twilight.update([0,0,1]).veinEmissive,looks.GOLDEN_UNDER_TREE.veinEmissive);
    twilight.dispose();
    assert.equal(scene.children.length,count);
  }
});

test('gold runtime clone stays scoped, shares across meshes and restores originals before disposing', () => {
  const source = new MeshStandardMaterial({name:'Golden_bark_veins',emissive:new Color(.35,.13,.035)});
  const other = new MeshStandardMaterial({name:'Sakura_flower_gold'});
  const geometry = new BoxGeometry();
  const root = new Group();
  const first= new Mesh(geometry,source);
  const stack=[source,other];
  const second = new Mesh(geometry,stack);
  root.add(first,second);
  const bind=bindGoldEmphasis(root);
  const clone=first.material;
  let disposals=0;
  clone.addEventListener('dispose',()=>disposals++);
  assert.notEqual(clone,source);
  assert.deepEqual(bind.report,{name:source.name,clones:1,meshes:2});
  assert.equal(second.material[0],clone);
  assert.equal(second.material[1],other);
  bind.update(1.42);
  assert.equal(clone.emissiveIntensity,1.42);
  assert.equal(source.emissiveIntensity,1);
  bind.dispose();
  bind.dispose();
  assert.equal(disposals,1);
  assert.equal(first.material,source);
  assert.equal(second.material,stack);
  geometry.dispose();source.dispose();other.dispose();
});

test('water atmosphere leaves the exact P0.10 gift ripple inputs independent', () => {
  const legacy = createWater(fxProfiles.eco.water);
  const twilight = createWater(fxProfiles.eco.water,true);
  assert.equal(legacy.mesh.material.defines.TWILIGHT_WATER,undefined);
  assert.equal(twilight.mesh.material.defines.TWILIGHT_WATER,1);
  assert.equal(twilight.mesh.position.y,0);
  for(const water of [legacy,twilight]) {
    water.setRipple({x:2,z:13.5,progress:.3,opacity:.6});
    water.setAppearance(new Color(0x222222),new Color(0x223344),{rose:1,gold:1.2,streaks:.8});
    assert.deepEqual(water.mesh.material.uniforms.giftRipple.value.toArray(),[2,13.5,.3,.6]);
    water.setRipple();
    assert.equal(water.mesh.material.uniforms.giftRipple.value.w,0);
    water.dispose();
  }
});
