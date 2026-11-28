import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const out = resolve('../../packages/v2-live-gateway/evidence/p10c0/r1');
const host = 'http://127.0.0.1:5199';
const vite = await createServer({ server:{host:'127.0.0.1', port:5199, strictPort:true} });
let browser;
try {
  await vite.listen();
  browser=await chromium.launch({headless:false, executablePath:process.env.C0_EDGE ||
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:720,height:1280}});
  await page.route(host+'/r1-blocked',route=>route.fulfill({contentType:'text/html',body:
    '<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><canvas></canvas>'}));
  await page.goto(host+'/r1-blocked');
  const receipt=await page.evaluate(async()=>{
    const three = await import('/node_modules/three/build/three.module.js');
    const { RotationDirector }=await import('/src/rotation-director.ts');
    const { createCameraClearance }=await import('/src/camera-clearance.ts');
    const { Vector3, Box3, BoxGeometry, Mesh, MeshBasicMaterial, Scene, PerspectiveCamera, WebGLRenderer }=three;
    const renderer=new WebGLRenderer({canvas:document.querySelector('canvas')});
    renderer.setSize(720,1280);
    const gl=renderer.getContext();
    const debug=gl.getExtension('WEBGL_debug_renderer_info');
    const device=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
    const scene=new Scene(), camera=new PerspectiveCamera(50,720/1280,.05,500);
    const marker = new Mesh(new BoxGeometry(1,1,1),new MeshBasicMaterial({color:0xe1ce73}));
    marker.position.set(0,5,9);
    scene.add(marker);
    const obstacle=new Mesh(new BoxGeometry(.7,.7,.7),new MeshBasicMaterial({color:0xff7755}));
    const route=phase=>{
      const t=phase*Math.PI/4;
      const position=new Vector3(Math.sin(t)*4,5,4-4*Math.cos(t));
      return {position,target:new Vector3(0,5,9),fov:50};
    };
    let clearance=createCameraClearance([]);
    const director=new RotationDirector(route,{...clearance,lineIssue:(a,b)=>clearance.lineIssue(a,b)});
    const gift={requestId:'synthetic-1',pose:{position:new Vector3(0,5,3),target:new Vector3(0,5,9),fov:50}};
    return await new Promise((finish,reject)=>{
      const samples=[];
      let start, injectedAt, anchor;
      const draw=now=>{
        start??=now;
        const elapsed=now-start;
        const focus=elapsed<3000?gift:undefined;
        if(!focus && injectedAt===undefined){
          if(!director.reachedFocus) return reject(Error('synthetic focus never reached'));
          obstacle.position.copy(route(director.phase).position);
          scene.add(obstacle);
          obstacle.updateMatrixWorld(true);
          const box = new Box3().setFromObject(obstacle);
          clearance=createCameraClearance([{box,group:'fixture-blocked-saved-pose'}]);
          anchor=director.phase;
          injectedAt=now;
        }
        const pose=director.step(now,true,focus);
        camera.position.copy(pose.position);
        camera.fov=pose.fov;
        camera.lookAt(pose.target);
        camera.updateProjectionMatrix();
        renderer.render(scene,camera);
        samples.push({now,phase:director.phase,status:director.status,
          shown:director.reachedFocus,position:pose.position.toArray(),target:pose.target.toArray(),fov:pose.fov});
        if(injectedAt&&director.status==='idle'&&director.phase>anchor+1.1) return finish({device,
          canvas:[renderer.domElement.width,renderer.domElement.height],anchor,injectedAt,completedAt:now,samples});
        if(elapsed>15000) return reject(Error('blocked return did not recover'));
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });
  });
  assert.deepEqual(receipt.canvas,[720,1280]);
  assert(receipt.samples.some(row=>row.status==='return-rejoin'));
  assert(receipt.samples.filter(row=>row.now>=receipt.injectedAt).every(row=>!row.shown));
  writeFileSync(join(out,'blocked-return-native.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({recoveryMs:receipt.completedAt-receipt.injectedAt,samples:receipt.samples.length}));
} finally {
  await browser?.close();
  await vite.close();
}
