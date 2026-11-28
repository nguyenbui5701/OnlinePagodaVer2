import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { WebSocket, WebSocketServer } from '../../../packages/v2-live-gateway/node_modules/ws/wrapper.mjs';
import { createGatewayServer } from '../../../packages/v2-live-gateway/server.mjs';
import { Gateway } from '../../../packages/v2-live-gateway/gateway.mjs';
import { AudioSettingsStore, PresenceSettingsStore, SettingsStore } from '../../../packages/v2-live-gateway/settings.mjs';
import { createIngress } from '../../../packages/v2-live-gateway/ingress.mjs';
import { liveDefaults } from '../src/live-settings.ts';
import { audioDefaults } from '../src/live-audio-settings.ts';

const app = resolve(process.env.C0_VIEWER_APP || '.');
const out = resolve(process.env.C0_OUTPUT || '../../packages/v2-live-gateway/evidence/p10c0');
const mode = process.argv[2] || 'native';
assert(['native','perf','quick','fallback','r1'].includes(mode));
const baseline = process.argv.includes('--hero');
const tree = process.env.C0_TREE || 'r18a';
const missingTrees = (process.env.C0_MISSING_TREES || '').split(',').filter(Boolean);
assert(missingTrees.every(value => ['r18a', 'r17b'].includes(value)));
const key = mode + '-' + (baseline ? 'hero' : 'cinematic') + (tree === 'r18a' ? '' : '-' + tree) +
  (missingTrees.length ? '-missing-' + missingTrees.join('-') : '');
const file = join(out, key + '.jsonl');
const origin = 'http://127.0.0.1:5189';
const port = 5203;
const width = 720, height = 1280;
const room = '79016';
const temp = await mkdtemp(join(tmpdir(), 'pagoda-c0-'));
mkdirSync(out, { recursive:true });
writeFileSync(file, '');
const begin = Date.now();
function note(event, details = {}) {
  const entry = JSON.stringify({ event, ms: Date.now()-begin, ...details });
  appendFileSync(file, entry + '\n');
  if (event !== 'frame') console.log(entry);
}
async function wait(action, label, timeout=15000) {
  const end = Date.now()+timeout;
  while(Date.now()<end) {
    const result = await action();
    if(result) return result;
    await new Promise(resolve=>setTimeout(resolve, 80));
  }
  throw Error(label);
}

function instrument() {
  const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(target,...args) {
    const result=connect.call(this,target,...args);
    if(target===this.context.destination && !window.readPCM) {
      const analyser=this.context.createAnalyser(), block=new Float32Array(1024);
      analyser.fftSize=block.length;
      connect.call(this,analyser);
      window.readPCM=()=> {
        analyser.getFloatTimeDomainData(block);
        return {rms:Math.sqrt(block.reduce((sum,x)=>sum+x*x,0)/block.length),
          context:this.context.state, time:this.context.currentTime};
      };
    }
    return result;
  };
  window.c0Frames=[];
  function frame(at) {
    const r=window.viewerReport;
    if(r?.drawCalls>0 && window.c0Frames.length < 40000) {
      window.c0Frames.push({ at, renderMs:r.renderMs, elapsed:r.elapsedSeconds, phase:r.routeSeconds, mode:r.mode,
        pathBlocked:r.cameraPathBlocked===true, shot:r.shot, position:r.position, target:r.target, fov:r.fov, route:r.routeId,
        motion:r.cameraMotion, focus:r.focus, shown:r.renderedGiftFocus,
        count:r.confirmedGiftCount, ack:r.liveReceipt?.ack,
        hidden:document.hidden, tick:r.liveTickMs, drawCalls:r.drawCalls, triangles:r.trianglesDrawn });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

let server, viewer, browser, edge, relay, send;
let launches=0;
const gateway = new Gateway((_, receive)=>{send=receive; launches++; return ()=>{};});
try {
  const visual = new SettingsStore(join(temp,'visual.json'));
  const audio = new AudioSettingsStore(join(temp,'audio.json'));
  const presence = new PresenceSettingsStore(join(temp,'presence.json'));
  const settings = {...liveDefaults, profile:'quality',tree,look:'gold',density:'lush',
    environment:mode==='fallback'&&!missingTrees.length?'off':'on',
    seats:'rings',ambience:'rich',seed:9,shots:'hero'};
  // The candidate's production settings path is exercised through Dashboard below.
  assert.equal(visual.save(1,settings),undefined);
  assert.equal(audio.save(1,{...audioDefaults,master:{enabled:true,volume:75},
    giftThanks:{enabled:true,volume:80},idleSeconds:10}),undefined);
  assert.equal(presence.patch(1,{seatExpiryEnabled:false}),undefined);
  server=createGatewayServer({gateway,audio,presence,settings:visual});
  server.listen(port,'127.0.0.1');
  await once(server,'listening');
  process.chdir(app);
  viewer=await preview({root:app,preview:{host:'127.0.0.1',port:5189,strictPort:true}});
  const home=join(temp,'browser');
  edge=spawn(process.env.C0_EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ['--remote-debugging-port=0','--no-first-run','--no-default-browser-check',
      '--disable-features=CalculateNativeWinOcclusion','--window-size=1000,900','--user-data-dir='+home,'about:blank'], {stdio:'ignore'});
  const nativePort=await wait(async()=> {
    try {return (await readFile(join(home,'DevToolsActivePort'),'utf8')).split(/\r?\n/)[0];}
    catch(error){if(!['ENOENT','EBUSY'].includes(error.code)) throw error;}
  },'Edge CDP port');
  const version=await fetch('http://127.0.0.1:'+nativePort+'/json/version').then(res=>res.json());
  // Keep native tab visibility. Playwright ordinarily enables focus emulation.
  relay=new WebSocketServer({host:'127.0.0.1',port:0});
  await once(relay,'listening');
  relay.on('connection',client=>{
    const native=new WebSocket(version.webSocketDebuggerUrl);
    const connected=once(native,'open');
    client.on('message',async data=>{
      const {id,sessionId,method}=JSON.parse(data);
      if(method==='Emulation.setFocusEmulationEnabled') return client.send(JSON.stringify({id,sessionId,result:{}}));
      await connected;
      if(native.readyState===WebSocket.OPEN) native.send(data.toString());
    });
    native.on('message',data=>{if(client.readyState===WebSocket.OPEN) client.send(data.toString());});
    native.on('close',()=>client.close());
    client.on('close',()=>native.close());
  });
  browser=await chromium.connectOverCDP('ws://127.0.0.1:'+relay.address().port);
  const [context]=browser.contexts();
  await context.addInitScript(instrument);
  for(const missing of missingTrees) {
    await context.route('**/'+missing+'/*.glb', route=>route.fulfill({status:404}));
  }
  const [overlay]=context.pages();
  const errors=[];
  overlay.on('pageerror',error=>errors.push(error.message));
  await overlay.setViewportSize({width,height});
  await overlay.bringToFront();
  await overlay.goto(origin+'/overlay/');
  await wait(()=>gateway.overlayReady,'initial hero ready');
  const dashboard=await context.newPage();
  await dashboard.goto(origin+'/dashboard/');
  const read=()=>overlay.evaluate(()=>{
    const r=window.viewerReport;
    return { elapsed:r.elapsedSeconds, phase:r.routeSeconds, position:r.position,target:r.target,fov:r.fov,mode:r.mode,
      shot:r.shot,route:r.routeId,visibility:document.visibilityState,revision:r.repoRevision,
      focus:r.focus,names:r.community?.names,asset:r.asset,world:r.world,layout:r.lotusLayout,graphics:r.graphics,
      camera:r.cameraRotation,blocked:r.cameraPathBlocked,labels:r.labels,fx:r.fx?.gift,confirmed:r.confirmedGiftCount,
      renderMs:r.renderMs,motion:r.cameraMotion,shown:r.renderedGiftFocus,
      pending:r.pendingGivers,receipt:r.liveReceipt,tick:r.liveTickMs,restores:r.contextRestores,ready:r.overlayRendererReady,
      audio:r.audio,pcm:window.readPCM?.(),heap:performance.memory?.usedJSHeapSize,
      canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height]};
  });
  const layoutHash=r=>createHash('sha256').update(JSON.stringify(r.layout?.instances)).digest('hex');
  const original=await read();
  if(!baseline) {
    await dashboard.bringToFront();
    await dashboard.locator('select').filter({has:dashboard.locator('option[value="cinematic"]')}).selectOption('cinematic');
    await dashboard.locator('#save').click({force:true});
    await wait(()=>visual.snapshot.settings.shots==='cinematic','saved settings cinematic');
    await wait(()=>dashboard.locator('#apply').isEnabled(),'offline Apply enabled');
    await dashboard.locator('#apply').click({force:true});
    await overlay.bringToFront();
    await wait(()=>gateway.appliedRevision===visual.snapshot.revision && gateway.overlayReady,'candidate readiness after offline Apply');
  }
  await overlay.bringToFront();
  const ready=await read();
  assert.deepEqual(ready.canvas,[width,height]);
  assert.equal(layoutHash(ready),layoutHash(original),'lotus instances changed through Apply');
  note('ready',{revision:ready.revision, browser:browser.version(),graphics:ready.graphics,canvas:ready.canvas, effective:visual.snapshot,
    camera:ready.camera,asset:ready.asset,world:ready.world,layoutSha256:layoutHash(ready)});
  if(mode==='fallback'&&!missingTrees.length) {
    assert.equal(ready.camera.effective,'hero');
    assert.equal(ready.camera.reason,'B9_ENVIRONMENT_UNAVAILABLE');
  } else {
    assert.equal(ready.world.pond,true);
    if(!baseline) assert.equal(ready.camera?.effective,'cinematic');
    if(missingTrees.length) {
      assert.equal(ready.world.tree,missingTrees.length===2?'R16':'R17B');
      assert(ready.world.failures.every(failure=>failure.code==='MISSING'));
    }
  }

  async function finishVideo() {
    const encoded=await overlay.evaluate(()=>window.finishC0Video());
    const source=join(temp,'capture.webm');
    writeFileSync(source,Buffer.from(encoded,'base64'));
    const target=join(out,'quality-overlay.mp4');
    execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,
      '-c:v','libx264','-preset','fast','-crf','26','-pix_fmt','yuv420p',target],{stdio:'inherit'});
    const {streams:[video]}=JSON.parse(execFileSync('ffprobe',
      ['-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration','-of','json',target],
      {encoding:'utf8'}));
    assert.deepEqual([video.width,video.height],[width,height]);
    assert(Number(video.duration)>=136);
    note('video',video);
  }
  if(mode==='native') {
    await overlay.evaluate(()=>{
      const stream=document.querySelector('canvas').captureStream(18);
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1_500_000});
      const chunks=[];
      recorder.ondataavailable=event=>chunks.push(event.data);
      recorder.start(1000);
      window.finishC0Video=()=>new Promise(resolve=>{
        recorder.onstop=()=>{
          stream.getTracks().forEach(track=>track.stop());
          const reader=new FileReader();
          reader.onload=()=>resolve(String(reader.result).split(',')[1]);
          reader.readAsDataURL(new Blob(chunks,{type:recorder.mimeType}));
        };
        recorder.stop();
      });
    });
  }
  const clock=r=>r.phase ?? r.elapsed;
  const initialPhase=clock(await read());
  const elapsedNeeded=mode==='native'?137:mode==='perf'?16:mode==='quick'?1:.5;
  await overlay.evaluate(()=>{window.c0Frames.length=0;});
  const sampled=new Set();
  const representativePhase={HERO_WIDE:5,COMMUNITY:18,LOW_WATER_KOI:28,AERIAL_RING:42,UNDER_TREE_GOLD:52,FAR_ATMOSPHERE:62};
  await wait(async()=>{
    const r=await overlay.evaluate(()=>{
      const report=window.viewerReport;
      return {phase:report.routeSeconds,elapsed:report.elapsedSeconds,shot:report.shot};
    });
    const phase=clock(r)%68;
    if(mode==='native' && !sampled.has(r.shot) && phase >= representativePhase[r.shot]) {
      sampled.add(r.shot);
      await overlay.screenshot({path:join(out,r.shot+'.png')});
    }
    return clock(r)-initialPhase>=elapsedNeeded;
  },'complete visible cycles',mode==='native'?480000:30000);
  const idle=await read();
  if(mode==='native'){
    assert.equal(sampled.size,6);
    note('cycles',{shots:[...sampled],from:initialPhase,to:clock(idle),gap:clock(idle)-initialPhase});
  }

  async function writeFrames(tag) {
    const entries=await overlay.evaluate(()=>window.c0Frames.splice(0));
    const stats=entries.slice(1).filter((r,i)=>!r.hidden && r.elapsed!==entries[i].elapsed)
      .map((r,i,all)=>i>0?r.at-all[i-1].at:0).filter(x=>x>0).sort((a,b)=>a-b);
    writeFileSync(join(out,key+'-'+tag+'-frames.jsonl'),entries.map(e=>JSON.stringify(e)).join('\n')+'\n');
    const percentile=p=>stats[Math.floor((stats.length-1)*p)];
    note(tag+'-frames',{frames:entries.length,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),
      ranges:{calls:[Math.min(...entries.map(r=>r.drawCalls)),Math.max(...entries.map(r=>r.drawCalls))],
        triangles:[Math.min(...entries.map(r=>r.triangles)),Math.max(...entries.map(r=>r.triangles))]},
      heap: (await read()).heap});
  }
  await writeFrames('idle');
  if (mode==='native') await finishVideo();
  if(mode==='quick'||mode==='r1') {
    let packet=100;
    const startAt=Date.now();
    await dashboard.bringToFront();
    await dashboard.locator('#username').fill('cinematic_fixture');
    await dashboard.locator('#connect').click({force:true});
    await wait(()=>launches===1,'operator Connect');
    send({type:'connected',room});
    const ingress=createIngress((message,done)=>{send(message);done();return true;},()=>assert.fail('fixture IPC'));
    function supply(kind,id,name,fields={}) {
      const at=Date.now();
      ingress.receive(kind,{common:{roomId:room,msgId:String(++packet),createTime:String(at)},user:{id:String(id),nickname:name},...fields},
        room,startAt,at);
      ingress.flush();
    }
    const gift=(id,name)=>supply('gift',id,name,{giftId:'1',groupId:String(packet+1),repeatCount:1,repeatEnd:1,gift:{type:1}});
    const owner=gateway.owner;
    assert(owner);
    await overlay.bringToFront();
    await overlay.locator('#capture').click({force:true});
    await wait(async()=> (await read()).pcm?.rms>0,'trusted gesture and mixer PCM');
    for(const [id,name] of [[11,'A'],[22,'B'],[33,'C']]) supply('member',id,name);
    const ack=()=>wait(()=>gateway.owner===owner&&gateway.acknowledged===gateway.sequence,'consumed contiguous ACK');
    await wait(()=>gateway.presenceApplied?.occupied===3,'three admitted members');
    await ack();
    await dashboard.reload();
    await overlay.bringToFront();
    note('seats-after-dashboard-reload',{ownerRetained:gateway.owner===owner,launches,occupied:gateway.presenceApplied.occupied,ack:gateway.acknowledged});
    if(mode==='r1') {
      const checkpoints=baseline?[[5,'HERO_WIDE_TREE_REFLECTION']]:[[5,'HERO_WIDE'],[17,'COMMUNITY'],
        [27,'LOW_WATER_KOI'],[40,'AERIAL_RING'],[51,'UNDER_TREE_GOLD'],[61,'FAR_ATMOSPHERE']];
      let total=0;
      for(const [start,shot] of checkpoints){
        const r=await wait(async()=>{
          const r=await read();
          return clock(r)>=start && r.shot===shot && r.mode==='CINEMATIC' && (!r.motion || r.motion.status==='idle') && r;
        },'reach '+shot,85000);
        const multi=shot==='FAR_ATMOSPHERE';
        const queue=multi?[[11,'A'],[22,'B'],[33,'C']]:[[11,'A']];
        note('gift-start-r1',{shot,phase:clock(r),renderMs:r.renderMs,total,queue:queue.map(([,name])=>name)});
        for(const [id,name] of queue) gift(id,name);
        total+=queue.length;
        const focusNames=[], shownNames=[], shotsTaken=new Set();
        let interrupted=false;
        await wait(async()=>{
          const now=await read();
          if(now.mode==='GIFT_FOCUS' && now.focus && focusNames.at(-1)?.id!==now.focus.requestId)
            focusNames.push({name:now.focus.name,id:now.focus.requestId,renderMs:now.renderMs});
          if(now.shown && !shownNames.some(f=>f.request===now.shown.request)){
            shownNames.push({...now.shown,name:now.focus.name,renderMs:now.renderMs});
            if(!shotsTaken.has(now.focus.name)){
              shotsTaken.add(now.focus.name);
              await overlay.screenshot({path:join(out,'r1-'+shot+'-'+now.focus.name+'.png')});
            }
          }
          if(multi && !interrupted && now.mode==='CINE_RETURN' && now.motion?.status==='return'){
            interrupted=true;
            gift(11,'A');total++;
            note('return-interrupt-r1',{renderMs:now.renderMs,phase:now.phase});
          }
          return now.confirmed===total && now.mode==='CINEMATIC' && (!now.motion || now.motion.status==='idle') &&
            focusNames.length>=(multi?4:1);
        },'finish gifts '+shot,50000).catch(async error=>{
          const r=await read();
          note('r1-checkpoint-failure',{shot,focusNames,shownNames,mode:r.mode,motion:r.motion,
            phase:r.phase,confirmed:r.confirmed,ack:gateway.acknowledged,sequence:gateway.sequence,
            focus:r.focus,visibility:r.visibility});
          await writeFrames('failed');
          throw error;
        });
        await ack();
        const final=await read();
        const expected=multi?['A','B','C','A']:['A'];
        assert.deepEqual(focusNames.map(entry=>entry.name),expected);
        note('gift-end-r1',{shot,focusNames,shownNames,phase:clock(final),ack:gateway.acknowledged,
          voices:final.audio.marks.filter(mark=>mark.event==='voice-start' && focusNames.some(f=>f.id===mark.request))});
      }
      await writeFrames('live');
    } else {
    const pausedAt=clock(await read());
    for(const [id,name] of [[11,'A'],[22,'B'],[33,'C'],[44,'D']]) gift(id,name);
    const visits=[];
    let addedReturnGift=false, unseated=false;
    await wait(async()=>{
      const r=await read();
      if(r.labels?.fallback?.startsWith('D')) unseated=true;
      if(r.blocked) throw Error('blocked gift path');
      if(r.mode==='GIFT_FOCUS' && r.focus && visits.at(-1)?.request!==r.focus.requestId){
        visits.push({name:r.focus.name,actor:r.focus.actorId,seat:r.focus.seatId,request:r.focus.requestId});
        note('focus',{...visits.at(-1),phase:r.phase,names:r.names,fx:r.labels?.fx});
        await overlay.screenshot({path:join(out,'gift-'+visits.length+'-'+r.focus.name+'.png')});
      }
      if(r.mode==='CINE_RETURN' && !addedReturnGift){
        addedReturnGift=true;
        note('return-interrupted',{phase:r.phase,eye:r.position});
        gift(11,'A');
      }
      return addedReturnGift && visits.length===4 && r.mode==='CINEMATIC' && r.confirmed===5;
    },'gift FIFO and return interruption',48000);
    await ack();
    assert(unseated,'D must be visible as nonspatial acknowledgment');
    assert.deepEqual(visits.map(v=>v.name),['A','B','C','A']);
    const returned=await read();
    assert(Math.abs(clock(returned)-pausedAt)<2);
    writeFileSync(join(out,'audio-marks.json'),JSON.stringify(returned.audio.marks,null,2)+'\n');
    const voices=returned.audio.marks.filter(mark=>mark.event==='voice-start' && mark.seat).map(mark=>mark.seat);
    assert.deepEqual(voices,['seat-1','seat-2','seat-3','seat-1']);
    note('gifts-verified',{visits,unseated,count:returned.confirmed,ack:gateway.acknowledged,pausedAt,resumed:clock(returned),voices});
    await dashboard.close();
    const back=await context.newPage();
    await back.goto('about:blank');
    await back.bringToFront();
    await wait(async()=> (await read()).visibility==='hidden','native background visibility');
    const hiddenBefore=await read();
    gift(11,'A');
    await ack();
    await wait(async()=> {
      const r=await read();
      return r.tick>hiddenBefore.tick+7500 && r.pcm?.rms>0 && r.visibility==='hidden';
    },'hidden worker/mixer');
    const hidden=await read();
    assert.equal(hidden.phase,hiddenBefore.phase);
    await overlay.bringToFront();
    await wait(async()=> (await read()).visibility==='visible','foreground return');
    await wait(async()=> clock(await read())>clock(hidden)+.25,'phase resumes without reset');
    const visible=await read();
    assert.equal(visible.confirmed,6);
    assert.equal(visible.audio.marks.filter(mark=>mark.event==='voice-start' && mark.seat).length,voices.length);
    const chimes=visible.audio.marks.filter(mark=>mark.event==='sfx-start'&&!mark.seat);
    assert(chimes.length>=1);
    note('background',{from:clock(hiddenBefore),hidden:clock(hidden),resumed:clock(visible),pcm:hidden.pcm,
      ack:gateway.acknowledged,ownerRetained:gateway.owner===owner,launches,voices:voices.length,nonSpatialChimes:chimes.length});

    const lost=await overlay.evaluate(()=>{
      const extension=document.querySelector('canvas').getContext('webgl2')?.getExtension('WEBGL_lose_context');
      if(!extension) return false;
      window.restoreGL=()=>extension.restoreContext();
      extension.loseContext();
      return true;
    });
    if(lost){
      await wait(()=>!gateway.overlayReady,'lost WebGL reported');
      await overlay.evaluate(()=>window.restoreGL());
      await wait(async()=>gateway.overlayReady && (await read()).restores>0,'WebGL recovery',25000);
      await ack();
      note('webgl-recovered',{restores:(await read()).restores,ownerRetained:gateway.owner===owner});
    } else note('webgl-recovery-unavailable',{});
    const marks=(await read()).audio?.marks;
    writeFileSync(join(out,'audio-marks.json'),JSON.stringify(marks,null,2)+'\n');
    await writeFrames('live');
    }
  }
  assert.deepEqual(errors,[]);
  note('complete',{mode,revision:ready.revision});
} catch(error) {
  note('failed',{message:error.message});
  throw error;
} finally {
  if(browser?.isConnected()){
    const root=await browser.newBrowserCDPSession();
    await root.send('Browser.close').catch(()=>{});
    await browser.close();
  }
  if(edge && edge.exitCode===null && edge.signalCode===null) {edge.kill(); await once(edge,'exit');}
  if(relay) await new Promise(resolve=>relay.close(resolve));
  await viewer?.close();
  gateway.release();
  if(server){server.closeAllConnections(); await new Promise(resolve=>server.close(resolve));}
}
