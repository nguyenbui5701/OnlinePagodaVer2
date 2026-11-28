import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
const out = dirname(fileURLToPath(import.meta.url));
const root = join(out, 'baseline-610b8c7');
const app = join(root, 'apps/v2-viewer');
const load = path => import(pathToFileURL(join(root, path)).href);
const { chromium } = await load('apps/v2-viewer/node_modules/playwright-core/index.mjs');
const { preview } = await load('apps/v2-viewer/node_modules/vite/dist/node/index.js');
const { Gateway } = await load('packages/v2-live-gateway/gateway.mjs');
const { createGatewayServer } = await load('packages/v2-live-gateway/server.mjs');
const { AudioSettingsStore, PresenceSettingsStore, SettingsStore } = await load('packages/v2-live-gateway/settings.mjs');
const { createIngress } = await load('packages/v2-live-gateway/ingress.mjs');
const { liveDefaults } = await load('apps/v2-viewer/src/live-settings.ts');
const { audioDefaults } = await load('apps/v2-viewer/src/live-audio-settings.ts');
const dir = join(out, 'native-baseline');
await mkdir(dir, { recursive: true });
const trace = join(dir, 'camera.jsonl');
await writeFile(trace, '');
const note = (event, details = {}) => { const line = JSON.stringify({ event, at: Date.now(), ...details }); appendFileSync(trace, line+'\n'); if (event !== 'sample') console.log(line); };
const temp = await mkdtemp(join(tmpdir(), 'p10c0-prep-'));
const origin = 'http://127.0.0.1:5189';
const room = '98026';
const settings = new SettingsStore(join(temp, 'settings.json'));
const audio = new AudioSettingsStore(join(temp, 'audio.json'));
const presence = new PresenceSettingsStore(join(temp, 'presence.json'));
const requested = {...liveDefaults, profile: 'quality', tree:'r18a', look:'gold', density:'lush', environment:'on', seats:'rings', ambience:'rich', seed:9, shots:'hero'};
assert.equal(settings.save(1, requested), undefined);
assert.equal(audio.save(1, {...audioDefaults, master:{enabled:true,volume:75}, giftThanks:{enabled:true,volume:80}}), undefined);
assert.equal(presence.patch(1, { seatExpiryEnabled: false }), undefined);
let send, launches = 0;
const gateway = new Gateway((_, callback)=>{send=callback; launches++; return ()=>{};});
const server = createGatewayServer({gateway, settings, audio, presence});
server.listen(5203,'127.0.0.1');
await once(server,'listening');
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function wait(action, label, timeout = 12000) {
  const deadline = Date.now()+timeout;
  while(Date.now()<deadline){const v=await action(); if(v) return v; await delay(100);}
  throw Error(label);
}
let viewer, browser;
try {
  process.chdir(app);
  viewer = await preview({ root:app, configFile:join(app,'vite.config.ts'), preview:{ host:'127.0.0.1',port:5189,strictPort:true } });
  browser = await chromium.launch({ headless:false, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const context = await browser.newContext({ viewport:{width:720,height:1280} });
  const overlay = await context.newPage();
  const errors=[];
  overlay.on('pageerror',e=>errors.push(e.message));
  await overlay.goto(origin+'/overlay/');
  await wait(()=>gateway.overlayReady,'Overlay ready');
  const read = () => overlay.evaluate(() => {
    const r=window.viewerReport;
    const take=(...keys)=>Object.fromEntries(keys.map(k=>[k,r[k]]));
    return {...take('repoRevision','graphics','elapsedSeconds','shot','cycle','routeId','direction','routeFallback','position','target','fov','mode','pendingGivers','confirmedGiftCount','revision','liveTickMs','liveReceipt','frameTiming','drawCalls','lotusVisible','koiVisible','focus','seating','labels'),
      visibility:document.visibilityState, focused:document.hasFocus(), names:r.community?.names,
      cue:r.audio?.marks?.at(-1), audio:r.audio?.applied, canvas:[document.querySelector('canvas')?.width,document.querySelector('canvas')?.height]};
  });
  const meta=await overlay.evaluate(()=>{const r=window.viewerReport; return {world:r.world, asset:r.asset, pond:r.pond?.assets, treeTarget:r.treeTarget, lotus:r.lotusLayout, community:r.communityLayout, rejectedRoutes:r.rejectedRoutes};});
  await writeFile(join(dir,'loaded-scene.json'),JSON.stringify({requested,browser:browser.version(),...meta},null,2));
  note('offline-ready',{requested,world:meta.world,owner:!!gateway.owner,providerLaunched:launches});
  let offline = new Set();
  while (true) {
    const r = await read();
    note('sample',{phase:'offline', ...r, gatewayAck:gateway.acknowledged});
    if (r.shot && !offline.has(r.shot) && r.elapsedSeconds > 1) {
      offline.add(r.shot);
      await overlay.screenshot({ path:join(dir,'offline-'+r.shot+'.png') });
    }
    if (r.elapsedSeconds >= 42) break;
    await delay(170);
  }
  const dash=await context.newPage();
  await dash.setViewportSize({width:1100,height:900});
  await dash.goto(origin+'/dashboard/');
  await dash.locator('#username').fill('synthetic_c0');
  await dash.locator('#connect').click({force:true});
  await wait(()=>launches===1,'synthetic launch');
  send({type:'connected',room});
  const ingress=createIngress((message,done)=>{send(message);done();return true;},()=>assert.fail('IPC fixture'));
  await overlay.bringToFront();
  await overlay.locator('#capture').click({ force:true });
  const started=Date.now()-100;
  let seq=1000;
  const supply=(kind,id,name,fields={})=>{const now=Date.now();ingress.receive(kind,{common:{roomId:room,msgId:String(++seq),createTime:String(now)},user:{id:String(id),nickname:name},...fields},room,started,now);ingress.flush();};
  for(const [id,name] of [[11,'A'],[22,'B'],[33,'C']]) supply('member',id,name);
  await wait(()=>gateway.presenceApplied?.occupied===3 && gateway.acknowledged===gateway.sequence,'three seats and ACK');
  note('live-seated',{ack:gateway.acknowledged,observed:gateway.observed.size,occupied:gateway.presenceApplied.occupied});
  await dash.reload();
  note('dashboard-reloaded',{launches,sameReceiver:!!gateway.owner});
  await overlay.bringToFront();
  let sent=false, done=false, fourth=false;
  const inFocus = new Set();
  const liveStart = (await read()).elapsedSeconds;
  while(true){
    const r=await read();
    const phase=sent?'live-gifts':'live-before-gifts';
    note('sample',{phase,...r,gatewayAck:gateway.acknowledged});
    if(!sent && r.elapsedSeconds >= Math.max(52,liveStart+4)){
      sent=true; note('provider-gifts-A-B-C',{preInterrupt:r});
      for(const [id,name] of [[11,'A'],[22,'B'],[33,'C']]) supply('gift',id,name,{giftId:'1',groupId:String(seq+1),repeatCount:1,repeatEnd:1,gift:{type:1}});
    }
    if(r.mode==='GIFT_FOCUS' && r.focus?.name && !inFocus.has(r.focus.name)){
      inFocus.add(r.focus.name);
      await overlay.screenshot({path:join(dir,'gift-'+r.focus.name+'.png')});
    }
    if(r.mode==='CINE_RETURN' && r.confirmedGiftCount===3 && !fourth){
      fourth=true;
      note('natural-first-return',{pose:r});
    }
    if(r.confirmedGiftCount===3 && r.mode==='CINEMATIC' && fourth && !done){
      done=true;
      note('natural-first-resume',{pose:r});
      await overlay.screenshot({path:join(dir,'synthetic-return.png')});
      break;
    }
    if(r.elapsedSeconds>liveStart+52) throw Error('gift sequence or return incomplete');
    await delay(145);
  }
  await wait(()=>gateway.acknowledged===gateway.sequence,'gift ACK');
  assert.deepEqual([...inFocus],['A','B','C']);
  assert.equal(launches,1);
  await writeFile(join(dir,'audio-marks.json'),JSON.stringify(await overlay.evaluate(()=>window.viewerReport.audio?.marks),null,2));
  note('complete',{offline:[...offline],focus:[...inFocus],ack:gateway.acknowledged,seq:gateway.sequence,status:gateway.status,launches,errors});
} catch(error){note('failed',{message:error.message});throw error;}
finally {
  await browser?.close();
  await viewer?.close();
  gateway.release();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
