import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, release } from 'node:os';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import sakura from '../src/sakura-r16.json' with { type: 'json' };
import assets from '../src/p08-assets.json' with { type: 'json' };

const baseline = '323955bed04e88f37cc251f8ae902e5ef7550eb5';
const cwd = process.cwd();
const output = resolve(process.env.V2_EVIDENCE_DIR || 'evidence/p011');
const oldApp = resolve(process.env.V2_P010_APP || '../../../.p010/apps/v2-viewer');
const executablePath = process.env.V2_BROWSER;
assert.ok(executablePath, 'Set V2_BROWSER to Edge or Chromium');
await mkdir(output, { recursive: true });
const vp = { width: 720, height: 1280 };
const profiles = ['eco', 'quality'];
const poses = [
  ['community', 7.5, 'dusk', [14, 6, 38], [1, 9.5, 3], 51],
  ['aerial', 12.5, 'pink', [19, 40, 31], [0, 12, 0], 52],
  ['aerial', 16, 'pink', [-16, 43, 30], [0, 12, 0], 52],
  ['lake', 26.5, 'dusk', [5.4, 3.4, 23], [0.9, 3.6, 7], 52],
  ['under-tree', 34.5, 'gold', [6, 2.8, 17], [0, 7, 0], 55],
  ['return', 44.5, 'dusk', [-14, 12, 36], [0, 10, 0], 50],
];
const giftTimes = [['A',47.72],['B',53.65],['C',59.48],['return',64.32]];
const write = (path, value) => writeFile(join(output,path), JSON.stringify(value,null,2)+'\n');
let browser;

async function serve(root, port, callback) {
  process.chdir(root);
  const server = await createServer({root, server:{host:'127.0.0.1',port,strictPort:true}, logLevel:'error'});
  try { await server.listen(); return await callback(`http://127.0.0.1:${port}`); }
  finally { await server.close(); process.chdir(cwd); }
}

async function ready(page, base, profile, look, seed=9, demo='idle', fx='on') {
  const query = `?seed=${seed}&clean=1&inspect=1&profile=${profile}&look=${look}&demo=${demo}&fx=${fx}`;
  await page.goto(base+query);
  await page.waitForFunction(() => window.p08Review || window.viewerReport?.errors.length);
  const report = await page.evaluate(() => window.viewerReport);
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.viewport,[720,1280]);
  for (const [actual, expected] of [[report.asset, sakura.profiles[profile]],
    [report.pair.pad, assets.pair.pad],[report.pair.actor, assets.pair.actor]]) {
    assert.equal(actual.bytes,expected.bytes);
    assert.equal(actual.sha256,expected.sha256);
  }
  assert.ok(report.asset.materials.every(material => material.matchesSource));
  return {query,report};
}

const render = (page,t,fixed) => page.evaluate(({t,fixed}) => {
  const start=Math.floor((window.viewerReport.elapsedSeconds??0)*60)+1;
  for(let i=start;i/60<t;i++)window.p08Review.step(i/60,false);
  return window.p08Review.step(t,true,undefined,undefined,undefined,fixed);
},{t,fixed});

async function shot(page, name) {
  const png = await page.locator('#stage').screenshot({animations:'disabled',path:join(output,name+'.png')});
  return createHash('sha256').update(png).digest('hex');
}

function point(r) {
  const {elapsedSeconds, position, target, fov, shot, routeId, mode, appearance, focus, labels, confirmedGiftCount,
    fx, drawCalls, textures, geometries, trianglesDrawn, pointsDrawn} = r;
  return {elapsedSeconds,position,target,fov,shot,routeId,mode,appearance,focus,labels,confirmedGiftCount,
    cue:fx?.gift, starts:fx?.starts, waterAnchor:fx?.waterAnchor, drawCalls,textures,geometries,trianglesDrawn,pointsDrawn};
}

async function referenceFrames(base, kind) {
  const page=await browser.newPage({viewport:vp});
  const index=[];
  const issues=[];
  const failures=[];
  page.on('pageerror', e=>failures.push(e.message));
  page.on('console', m=>{ if(m.type()==='warning'||m.type()==='error') issues.push(m.text()); });
  await page.route('**/favicon.ico', route=>route.fulfill({status:204}));
  try {
    for(const profile of profiles) {
      for(const [name,t,preset,position,target,fov] of poses) {
        const look=kind==='before'?'legacy':preset;
        const {query,report}=await ready(page,base,profile,look);
        if(kind==='before') assert.equal(report.repoRevision,baseline);
        const r=await render(page,t,{position,target,fov});
        assert.deepEqual(r.errors,[]);
        const file=`${kind}-${name}-${t}s-${profile}-${look}`;
        const sha256=await shot(page,file);
        index.push({key:`${profile}/${name}/${t}`,file:file+'.png',url:base+query,source:report.repoRevision,
          profile,look,seed:9,sha256,actualReviewPose:true,...point(r)});
      }
    }
    for(const [name,t] of giftTimes) {
      const look=kind==='before'?'legacy':'twilight';
      const {query,report}=await ready(page,base,'eco',look,9,'gifts');
      const r=await render(page,t);
      assert.deepEqual(r.errors,[]);
      if(name!=='return') {
        assert.ok(r.labels.name && r.labels.fx);
        assert.equal(r.fx.gift?.actorId,r.focus.actorId);
        assert.equal(r.fx.waterAnchor[1],0);
        const framing=await page.evaluate(id=>window.p08Review.frame(id),r.focus.seatId);
        assert.ok(framing.edge<=0.84 && !framing.treeOccludes);
      }
      const file=`${kind}-gift-${name}-${t}s-eco-${look}`;
      const sha256=await shot(page,file);
      index.push({key:'gift/'+name,file:file+'.png',url:base+query,source:report.repoRevision,profile:'eco',look,seed:9,sha256,...point(r)});
    }
    assert.deepEqual(failures,[]);
    assert.ok(!issues.some(message=>/shader error|VALIDATE_STATUS false|GL_INVALID/i.test(message)),issues.join('\n'));
    return {index,consoleMessages:issues};
  } finally{await page.close();}
}

try {
  browser=await chromium.launch({executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling']});
  if(process.argv.includes('--baseline')) {
    const before=await serve(oldApp,4183,base=>referenceFrames(base,'before'));
    await write('baseline-index.json',before);
    console.log(`Captured ${before.index.length} clean P0.10 reference frames at ${baseline}`);
  } else {
    const prior=JSON.parse(await readFile(join(output,'baseline-index.json'),'utf8'));
    const before=prior.index;
    await serve(cwd,4184,async base=>{
      const next=await referenceFrames(base,'after');
      const after=next.index;
      for(const a of after) {
        const b=before.find(r=>r.key===a.key);
        for(const f of ['position','target','fov','mode','labels','confirmedGiftCount','waterAnchor','starts']) {
          assert.equal(JSON.stringify(a[f]),JSON.stringify(b[f]),a.key+' '+f);
        }
      }
      const metrics=await validate(base,before);
      await write('screenshot-index.json',[...before,...after,...metrics.extra]);
      await write('browser-report.json',{...metrics.report, screenshotConsole:{before:prior.consoleMessages,after:next.consoleMessages}});
      await grids(before,after);
    });
    await writeFile(join(output,'asset-verification.jsonl'),execFileSync(process.execPath,['scripts/stage-p08.mjs']));
    console.log('P0.11 native comparisons, transitions, resources and context recovery passed.');
  }
} finally { await browser?.close(); }

function matchedResources(report) {
  return {
    draws: report.drawCalls, triangles: report.trianglesDrawn, points: report.pointsDrawn,
    textures: report.textures, geometries: report.geometries, lights: report.lights, shadowMaps: report.shadowMaps,
    gold: report.goldMaterial, heap: report.heap,
  };
}

async function grids(before,after) {
  const page=await browser.newPage();
  try {
    for(const profile of profiles) {
      const rows=await Promise.all(before.filter(x=>x.profile===profile&&x.actualReviewPose).map(async b=>{
        const a=after.find(x=>x.key===b.key);
        const data=async file=>'data:image/png;base64,'+(await readFile(join(output,file))).toString('base64');
        return {title:b.key, images:[await data(b.file),await data(a.file)]};
      }));
      const grid=await page.evaluate(async rows=>{
        const canvas=document.createElement('canvas');
        canvas.width=540;canvas.height=34+rows.length*490;
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#181624';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#fff5ed';ctx.font='15px sans-serif';
        ctx.fillText('P0.10 legacy',8,23);ctx.fillText('P0.11 twilight look',275,23);
        for(const [index,row] of rows.entries()) {
          const top=34+index*490;
          ctx.fillText(row.title+' s',8,top+17);
          for(const [column,url] of row.images.entries()) {
            const image=new Image();image.src=url;await image.decode();
            ctx.drawImage(image,8+column*266,top+23,258,459);
          }
        }
        return canvas.toDataURL('image/jpeg',.89).split(',')[1];
      },rows);
      await writeFile(join(output,'reference-grid-'+profile+'.jpg'),Buffer.from(grid,'base64'));
    }
  } finally{await page.close();}
}

function timeFrames(page) {
  return page.evaluate(() => new Promise((resolve,reject)=>{
    const deltas=[];
    let prior;
    let frame=0;
    const tick = now => {
      try {
        const r=window.p08Review.step(9+frame/15);
        if(prior!==undefined&&frame>8)deltas.push(now-prior);
        prior=now;
        if(++frame<69)requestAnimationFrame(tick);
        else {
          const order=deltas.toSorted((a,b)=>a-b);
          const ms=deltas.reduce((a,b)=>a+b,0);
          const get=p=>order[Math.ceil(p*order.length)-1];
          resolve({samples:deltas.length,wallSeconds:ms/1000,virtualStart:9+8/15,virtualEnd:9+68/15,
            fps:1000*deltas.length/ms,p50:get(.5),p95:get(.95),p99:get(.99),
            report:{...r,heap:performance.memory?.usedJSHeapSize}});
        }
      } catch(error){reject(error);}
    };
    requestAnimationFrame(tick);
  }));
}

async function readPair(page, files, rect) {
  const sources = await Promise.all(files.map(async file=>'data:image/png;base64,'+(await readFile(join(output,file))).toString('base64')));
  return page.evaluate(async ({sources,rect})=>{
    const pixels=await Promise.all(sources.map(async src=>{
      const image=new Image(); image.src=src; await image.decode();
      const ctx=document.createElement('canvas').getContext('2d');
      ctx.canvas.width=rect[2];ctx.canvas.height=rect[3];
      ctx.drawImage(image,...rect,0,0,rect[2],rect[3]);
      return ctx.getImageData(0,0,rect[2],rect[3]).data;
    }));
    let changed=0,sum=0,gold0=0,gold1=0,goldCount=0,base0=0,base1=0,baseCount=0;
    const [a,b]=pixels;
    const luma=(p,i)=>.2126*p[i]+.7152*p[i+1]+.0722*p[i+2];
    for(let i=0;i<a.length;i+=4) {
      const delta=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
      sum+=delta;
      if(delta>3)changed++;
      if(a[i]>110&&a[i]>1.07*a[i+1]&&a[i+1]>1.1*a[i+2]){
        goldCount++; gold0+=luma(a,i);gold1+=luma(b,i);
      } else if(a[i]<118&&a[i+1]+8<Math.min(a[i],a[i+2])){
        baseCount++;base0+=luma(a,i);base1+=luma(b,i);
      }
    }
    return {rect,changed,meanRGBDelta:sum/(a.length/4*3),goldCount,baseCount,
      goldLuma:[gold0/goldCount,gold1/goldCount],barkLuma:[base0/baseCount,base1/baseCount]};
  },{sources,rect});
}

async function validate(base,before) {
  const page=await browser.newPage({viewport:vp});
  const errors=[];
  const consoleMessages=[];
  const extra=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='warning'||message.type()==='error')consoleMessages.push(message.text());});
  const capture=async(file,t,fixed)=>{
    const r=await render(page,t,fixed);
    assert.deepEqual(r.errors,[]);
    const sha256=await shot(page,file);
    extra.push({file:file+'.png',sha256,url:page.url(),source:r.repoRevision,profile:r.profile,seed:r.seed,...point(r)});
    return r;
  };
  try {
    for(const profile of profiles) {
      const {report}=await ready(page,base,profile,'legacy');
      const pose=poses[3];
      const frame=await render(page,pose[1],{position:pose[3],target:pose[4],fov:pose[5]});
      const png=await page.locator('#stage').screenshot({animations:'disabled'});
      assert.equal(createHash('sha256').update(png).digest('hex'),before.find(r=>r.key===profile+'/lake/26.5').sha256);
      assert.equal(frame.appearance,undefined);
      assert.equal(report.goldMaterial,undefined);
    }
    const traces={};
    for(const seed of [9,71]) {
      for(const demo of ['idle','gifts']) {
        await ready(page,base,'eco','twilight',seed,demo);
        const result=await page.evaluate(demo=>{
          let maxWeightStep=0,maxExposureStep=0,previous;
          const rows=[];
          for(let frame=0;frame<=(demo==='idle'?85:66)*60;frame++) {
            const r=window.p08Review.step(frame/60,false);
            const a=r.appearance;
            if(previous) {
              maxWeightStep=Math.max(maxWeightStep,...a.weights.map((w,i)=>Math.abs(w-previous.weights[i])));
              maxExposureStep=Math.max(maxExposureStep,Math.abs(a.exposure-previous.exposure));
            }
            previous=a;
            if(frame%15===0||[9,16,29,40].some(s=>Math.abs(frame-s*60)<2))rows.push({
              t:r.elapsedSeconds,appearance:a,position:r.position,target:r.target,fov:r.fov,routeId:r.routeId,shot:r.shot,
              mode:r.mode,cue:r.fx.gift,waterAnchor:r.fx.waterAnchor,count:r.confirmedGiftCount,
            });
          }
          return {rows,maxWeightStep,maxExposureStep,final:window.viewerReport,events:window.p08Review.trace()};
        },demo);
        assert.ok(result.maxWeightStep<.020 && result.maxExposureStep<.001);
        assert.deepEqual(result.final.errors,[]);
        assert.ok(result.rows.every(row=>Number.isFinite(row.appearance.exposure)&&
          row.appearance.fogDensity>=.01-1e-9&&row.appearance.fogDensity<=.013+1e-9));
        if(demo==='idle') {
          assert.equal(result.final.elapsedSeconds,85);
          assert.equal(result.final.mode,'CINEMATIC');
          assert.deepEqual(result.final.visited,['CLOSE','COMMUNITY','AERIAL','UNDER_TREE']);
          assert.deepEqual(result.final.fx.starts,{observed:0,confirmed:0});
          if(seed===9) {
            const prior=JSON.parse(await readFile(join(cwd,'evidence/p010/idle-trace.json'),'utf8'));
            for(const row of prior.rows) {
              const next=result.rows.find(s=>s.t===row.t);
              assert.deepEqual([next.position,next.routeId,next.fov],[row.position,row.routeId,row.fov]);
            }
          }
        } else {
          assert.equal(result.final.confirmedGiftCount,7);
          assert.equal(result.final.mode,'CINEMATIC');
          assert.deepEqual(result.final.fx.starts,{observed:1,confirmed:3});
          assert.deepEqual([...new Set(result.rows.filter(r=>r.cue?.phase==='confirmed').map(r=>r.cue.seatId))],
            ['seat-1','seat-2','seat-3']);
        }
        traces[seed+'/'+demo]={maxWeightStep:result.maxWeightStep,maxExposureStep:result.maxExposureStep,final:result.final.appearance};
        await write(`trace-${seed}-${demo}.json`,result);
      }
    }
    await ready(page,base,'eco','twilight');
    for(const boundary of [16,29,40]) for(const t of [boundary-.12,boundary+.12]) {
      await capture(`boundary-${t.toFixed(2)}s-eco-twilight`,t);
    }
    const pose=poses[3];
    await ready(page,base,'eco','dusk',9,'idle','off');
    for(const t of [26.5,28.5])await capture(`motion-lake-${t}s-eco-dusk`,t,{position:pose[3],target:pose[4],fov:pose[5]});
    const motion=await readPair(page,['motion-lake-26.5s-eco-dusk.png','motion-lake-28.5s-eco-dusk.png'],[50,1135,620,110]);
    assert.ok(motion.changed>10000 && motion.meanRGBDelta>.4,JSON.stringify(motion));
    const contrast=await readPair(page,['before-under-tree-34.5s-eco-legacy.png','after-under-tree-34.5s-eco-gold.png'],[245,725,265,455]);
    assert.ok(contrast.goldCount>100 && contrast.baseCount>100 &&
      contrast.goldLuma[1]/contrast.barkLuma[1]>contrast.goldLuma[0]/contrast.barkLuma[0],JSON.stringify(contrast));

    await ready(page,base,'eco','twilight',9,'capacity');
    const fallback=await capture('capacity-48.9s-eco-twilight',48.9);
    assert.match(fallback.labels.fallback,/^Duyên/);
    assert.equal(fallback.fx.gift,undefined);
    assert.equal(fallback.fx.waterAnchor,undefined);
    const gifted=await ready(page,base,'eco','twilight',9,'gifts');
    assert.deepEqual(gifted.report.goldMaterial,{name:'Golden_bark_veins',clones:1,meshes:1});
    const initial=await render(page,47.72);
    await page.evaluate(()=>{
      const ext=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      if(!ext)throw new Error('WEBGL_lose_context unavailable');
      window.restoreTestContext=()=>ext.restoreContext();
      ext.loseContext();
    });
    await page.waitForFunction(()=>window.viewerReport.errors.includes('webglcontextlost'));
    await page.evaluate(()=>window.restoreTestContext());
    await page.waitForFunction(()=>window.viewerReport.contextRestores===1);
    const restored=await render(page,47.78);
    assert.deepEqual(restored.errors,['webglcontextlost']);
    assert.deepEqual(restored.goldMaterial,initial.goldMaterial);
    assert.deepEqual(restored.fx.starts,initial.fx.starts);
    assert.equal(restored.fx.waterAnchor[1],0);
    assert.equal(restored.fx.poolId,initial.fx.poolId);
    assert.equal(restored.drawCalls,initial.drawCalls);

    const timings={};
    let details;
    for(const profile of profiles) {
      timings[profile]={};
      for(const variant of ['legacy','twilight']) {
        await ready(page,base,profile,variant);
        const {report,...timing}=await timeFrames(page);
        assert.deepEqual(report.errors,[]);
        timings[profile][variant]={...timing,resources:matchedResources(report)};
        details=report;
      }
      const a=timings[profile].legacy.resources,b=timings[profile].twilight.resources;
      assert.equal(b.draws,a.draws+1);
      assert.equal(b.triangles,a.triangles+2);
      for(const key of ['textures','points','lights','shadowMaps'])assert.equal(b[key],a[key]);
    }
    assert.deepEqual(errors,[]);
    assert.ok(!consoleMessages.some(message=>/shader error|VALIDATE_STATUS false|GL_INVALID/i.test(message)));
    return {extra,report:{baseline,source:details.repoRevision,node:process.version,os:release(),cpu:cpus()[0]?.model,
      vendor:details.graphics,browser:details.browser,viewport:vp,liveStudio:false,timings,traces,motion,contrast,
      context:{restores:restored.contextRestores,starts:restored.fx.starts,gold:restored.goldMaterial,
        graphicsErrors:restored.errors,before:matchedResources(initial),after:matchedResources(restored)},
      errors,consoleMessages,reference:'REFERENCE_VIDEO_NOT_AVAILABLE_TO_CODEX'}};
  } finally{await page.close();}
}
