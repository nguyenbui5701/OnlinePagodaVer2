/* REAL Node.js >=22 ray-triangle geometric diagnostic for P0.6b vs P0.6c.
Sampled proxy only; camera rays are mathematically exact to sampled triangles,
NOT a proof for the continuous surface / Blender Cycles pixels.
Usage from p6c/: node validate_p06c_scalp_rays.mjs cross
                  node validate_p06c_scalp_rays.mjs kneel
Outputs JSON to stdout, original binary SHA pinning; no file mutation.
*/
import fs from 'node:fs';import crypto from 'node:crypto';
function decodeUTF8(b){let out="";for(let i=0;i<b.length;i++){let c=b[i];if(c<128){out+=String.fromCharCode(c);continue;}let cp;if(c<224)cp=(c&31)<<6|(b[++i]&63);else if(c<240)cp=(c&15)<<12|(b[++i]&63)<<6|(b[++i]&63);else cp=(c&7)<<18|(b[++i]&63)<<12|(b[++i]&63)<<6|(b[++i]&63);out+=String.fromCodePoint(cp);}return out;}
function encodeUTF8(s){let out=[];for(let i=0;i<s.length;i++){let c=s.codePointAt(i);if(c>65535)i++;if(c<128)out.push(c);else if(c<2048)out.push(192|c>>6,128|(c&63));else if(c<65536)out.push(224|c>>12,128|((c>>6)&63),128|(c&63));else out.push(240|c>>18,128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(out);}
function u32(b,i){return (b[i]|b[i+1]<<8|b[i+2]<<16|b[i+3]<<24)>>>0;}
function w32(b,i,x){b[i]=x&255;b[i+1]=x>>>8&255;b[i+2]=x>>>16&255;b[i+3]=x>>>24&255;}
function parseGLB(bytes){if(decodeUTF8(bytes.subarray(0,4))!=="glTF"||u32(bytes,4)!==2||u32(bytes,8)!==bytes.length)throw Error("Invalid input GLB2");
let n=u32(bytes,12);if(u32(bytes,16)!==0x4e4f534a)throw Error("Invalid JSON chunk");let json=JSON.parse(decodeUTF8(bytes.subarray(20,20+n)));let off=20+n;if(u32(bytes,off+4)!==0x004e4942)throw Error("No BIN chunk");let bin=bytes.subarray(off+8,off+8+u32(bytes,off));return{j:json,bin};}
function readAcc(j,bin,id){let a=j.accessors[id],v=j.bufferViews[a.bufferView],off=(v.byteOffset||0)+(a.byteOffset||0),comps=a.type==="VEC3"?3:1,num=a.count*comps,d=new DataView(bin.buffer,bin.byteOffset+off),arr=new Array(num);
for(let i=0;i<num;i++)arr[i]=a.componentType===5126?d.getFloat32(i*4,true):a.componentType===5125?d.getUint32(i*4,true):(()=>{throw Error("accessor component")})();
return arr;}
function pack32(a,type){let b=new Uint8Array(a.length*4),d=new DataView(b.buffer);for(let i=0;i<a.length;i++){if(type===5126)d.setFloat32(i*4,a[i],true);else if(type===5125)d.setUint32(i*4,a[i],true);else throw Error("Unexpected type");}return b;}
function bound3(p){let mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p[i+k]);mx[k]=Math.max(mx[k],p[i+k]);}return[mn,mx];}
function smooth(x){let s=Math.max(0,Math.min(1,x));return s*s*(3-2*s);}
function normals3(p,idx){let n=new Float64Array(p.length);for(let i=0;i<idx.length;i+=3){let a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(let v of [a,b,c]){n[v]+=nx;n[v+1]+=ny;n[v+2]+=nz;}}
let out=new Array(p.length);for(let i=0;i<p.length;i+=3){let len=Math.hypot(n[i],n[i+1],n[i+2])||1;out[i]=n[i]/len;out[i+1]=n[i+1]/len;out[i+2]=n[i+2]/len;}return out;}



/** Actual glTF geometric ray audit: never label sample proxy as exact continuous collision. */
function eyeMesh(j,bin,idx,readAcc){let pr=j.meshes[idx].primitives[0];return{p:readAcc(j,bin,pr.attributes.POSITION),f:readAcc(j,bin,pr.indices),normal:readAcc(j,bin,pr.attributes.NORMAL)};}
function norm3(x){let l=Math.hypot(...x)||1;return x.map(a=>a/l)}
function dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross3(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function rayFace(origin,d,mesh,tLimit=Infinity){
 const p=mesh.p,indices=mesh.f;let best=tLimit,hit=-1,bary=null,backFaces=0;
 for(let fi=0;fi<indices.length;fi+=3){
 let i=3*indices[fi],j=3*indices[fi+1],k=3*indices[fi+2];
 let ax=p[i],ay=p[i+1],az=p[i+2],e1x=p[j]-ax,e1y=p[j+1]-ay,e1z=p[j+2]-az,e2x=p[k]-ax,e2y=p[k+1]-ay,e2z=p[k+2]-az;
 let px=d[1]*e2z-d[2]*e2y,py=d[2]*e2x-d[0]*e2z,pz=d[0]*e2y-d[1]*e2x;
 let det=e1x*px+e1y*py+e1z*pz;
 if(Math.abs(det)<1e-10)continue;
 let inv=1/det,tx=origin[0]-ax,ty=origin[1]-ay,tz=origin[2]-az;
 let u=(tx*px+ty*py+tz*pz)*inv;if(u < -1e-7||u>1.0000001)continue;
 let qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x;
 let v=(d[0]*qx+d[1]*qy+d[2]*qz)*inv;if(v < -1e-7||u+v>1.0000001)continue;
 let t=(e2x*qx+e2y*qy+e2z*qz)*inv;if(t>1e-5&&t<best){best=t;hit=fi/3;bary=[1-u-v,u,v];}
 }return hit<0?null:{t:best,triangle:hit,bary};
}
function boundRay(j,bin,readAcc,samples=1){
 let skin=eyeMesh(j,bin,3,readAcc),hair=eyeMesh(j,bin,6,readAcc),C=[0,.85,.005],stats={total:0,skinHit:0,negative:0,below5mm:0,minMm:Infinity,maxMm:-Infinity,examples:[],areas:{}};
 // true ray triangle intersection from skull center through cap mesh triangle samples and original hair vertices.
 const faceCount=Math.min(1736*3,hair.f.length);
 const pos=hair.p;
 const add=(v,id)=>{
  // restrict to front/upper hemisphere, avoiding eyebrow + ear/face
  if(v[1]<.957||v[2]<-.095)return;
  const D=norm3(v.map((x,i)=>x-C[i])),dist=Math.hypot(...v.map((x,i)=>x-C[i]));
  const hit=rayFace(C,D,skin);
  stats.total++;
  if(!hit)return;
  stats.skinHit++;let gap=(dist-hit.t)*1000;
  stats.minMm=Math.min(stats.minMm,gap);stats.maxMm=Math.max(stats.maxMm,gap);
  if(gap<0)stats.negative++;if(gap<5)stats.below5mm++;
  if(gap<1&&stats.examples.length<16)stats.examples.push({id,vertex:v.map(x=>+x.toFixed(5)),skinT:+hit.t.toFixed(5),clearanceMM:+gap.toFixed(2)});
 };
 for(let i=0;i<841;i++)add(pos.slice(i*3,i*3+3),"v"+i);
 for(let i=0;i<faceCount;i+=3){
 let ia=hair.f[i]*3,ib=hair.f[i+1]*3,ic=hair.f[i+2]*3;
 add([0,1,2].map(c=>(pos[ia+c]+pos[ib+c]+pos[ic+c])/3),"tri"+i/3);
 }
 stats.minMm=Number(stats.minMm.toFixed(3));stats.maxMm=Number(stats.maxMm.toFixed(3));
 return stats;
}
function cameraRays(j,bin,readAcc,view){
 const skin=eyeMesh(j,bin,3,readAcc),hair=eyeMesh(j,bin,6,readAcc);
 const data={
 hair_front:[[0,1.11,1.12],[0,.995,0],35],
 hair_top:[[.29,1.62,.28],[0,1.045,0],35],
 hair_right_3q:[[.87,1.14,.79],[0,.995,0],34],
 hair_left:[[-1.11,1.06,.12],[0,.995,0],35],
 hair_right:[[1.11,1.06,.12],[0,.995,0],35],
 hair_back:[[0,1.10,-1.16],[0,.995,0],35],
 }[view];
 let [O,T,fov]=data;let fw=norm3(T.map((x,i)=>x-O[i])),right=norm3(cross3(fw,[0,1,0])),up=norm3(cross3(right,fw));let scale=Math.tan(fov*Math.PI/360),aspect=520/582;
 let rays=0,headFirst=0,hairFirst=0,bothHit=0,headExamples=[];
 // sample only high head region projected via rays and world skin-hit point; y>=.985, |x|<.23, z>-.16
 for(let iy=0;iy<43;iy++)for(let ix=0;ix<39;ix++){
  let x=(ix-19)/19,y=(21-iy)/21,D=norm3([0,1,2].map(k=>fw[k]+x*aspect*scale*right[k]+y*scale*up[k]));
  let s=rayFace(O,D,skin),h=rayFace(O,D,hair);
  if(!s)continue;
  let spot=O.map((x,k)=>x+D[k]*s.t);
  if(spot[1]<.98||spot[1]>1.25||Math.abs(spot[0])>.245||spot[2]<-.19)continue;
  rays++;
  if(h){bothHit++;if(h.t+1e-4<s.t)hairFirst++;else{headFirst++;if(headExamples.length<12)headExamples.push({ix,iy,position:spot.map(x=>+x.toFixed(3)),deltaMm:+((h.t-s.t)*1000).toFixed(2),hairTriangle:h.triangle,skinTriangle:s.triangle})}}
  else{headFirst++;if(headExamples.length<12)headExamples.push({ix,iy,position:spot.map(x=>+x.toFixed(3)),noHairHit:true});}
 }
 return{view,cameraRaysUpperHead:rays,hairFirst,skinFirst:headFirst,bothHit,skinVisibilityPct:rays?+(headFirst*100/rays).toFixed(2):null,headExamples};
}

function hash(b){return crypto.createHash('sha256').update(b).digest('hex')}
function patchSamples(j,bin){
 const skin=eyeMesh(j,bin,3,readAcc),hair=eyeMesh(j,bin,6,readAcc),center=[0,.85,.005];
 let count=0,negative=0,near5=0,min=Infinity,max=-Infinity;
 for(let i=1105;i<1672;i++){
 let v=hair.p.slice(i*3,i*3+3),d=norm3(v.map((x,k)=>x-center[k])),hit=rayFace(center,d,skin);
 if(!hit)continue;
 let gap=(Math.hypot(...v.map((x,k)=>x-center[k]))-hit.t)*1000;
 count++;if(gap<0)negative++;if(gap<5)near5++;min=Math.min(min,gap);max=Math.max(max,gap);
 }
 return {count,negative,lessThan5mm:near5,minMm:+min.toFixed(3),maxMm:+max.toFixed(3)};
}

const ref={cross:{
 oldFile:'../p6c/meditator_male_cross_prayer_p06c.glb',
 newFile:'meditator_male_cross_prayer_undercut_p07a.glb',
 oldHash:'c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4',
 newHash:'72c407bf3b6ae8a6edc8ed9a0e544168db7edcac379a8ea92b9677cceed00107',
 meshes:10,triangleCount:18380,vertexCount:9469
},kneel:{
 oldFile:'../p6c/meditator_male_kneel_prayer_p06c.glb',
 newFile:'meditator_male_kneel_prayer_undercut_p07a.glb',
 oldHash:'38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad',
 newHash:'e7f86beb4cd43f899c57922c0e34c94020e93dc007c6b9f5094b2757363960da',
 meshes:9,triangleCount:18420,vertexCount:9485
}};
function accessorBytes(model,id){
 const a=model.j.accessors[id],view=model.j.bufferViews[a.bufferView],o=(view.byteOffset||0)+(a.byteOffset||0),
 comps=a.type==='VEC3'?3:a.type==='VEC2'?2:a.type==='VEC4'?4:1,
 perByte={5126:4,5125:4,5123:2,5121:1}[a.componentType];
 if(!perByte)throw Error('Unexpected accessor format '+a.componentType);
 return model.bin.subarray(o,o+a.count*comps*perByte);
}
function equal(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}
function checkPose(pose){
 const s=ref[pose],a=new Uint8Array(fs.readFileSync(s.oldFile)),b=new Uint8Array(fs.readFileSync(s.newFile));
 if(hash(a)!==s.oldHash||hash(b)!==s.newHash)throw Error('SHA256 input/new mismatch '+pose);
 const old=parseGLB(a),cur=parseGLB(b),j=cur.j;
 if(j.meshes.length!==s.meshes||j.materials.length!==21)throw Error('mesh/material contract '+pose);
 let triangles=0,verts=0;for(const m of j.meshes){let pr=m.primitives[0];triangles+=j.accessors[pr.indices].count/3;verts+=j.accessors[pr.attributes.POSITION].count;}
 if(triangles!==s.triangleCount||verts!==s.vertexCount)throw Error('glTF poly budget '+pose);
 if(JSON.stringify(old.j.materials)!==JSON.stringify(cur.j.materials))throw Error('material altered '+pose);
 if(JSON.stringify(old.j.extensions)!==JSON.stringify(cur.j.extensions))throw Error('native 6 variant mappings altered '+pose);
 let anchorNames=['SeatRoot','UpperBodyBreath','HeadAnchor','NameplateAnchor','FXAnchor'];
 for(let name of anchorNames)if(!j.nodes.some(n=>n.name===name))throw Error('anchor missing '+name);
 let beforeNodes=old.j.nodes.map(x=>({...x,name:x.mesh===6?'HAIR_NAME_ALLOWED':x.name})),
     afterNodes=j.nodes.map(x=>({...x,name:x.mesh===6?'HAIR_NAME_ALLOWED':x.name}));
 if(JSON.stringify(beforeNodes)!==JSON.stringify(afterNodes))throw Error('Node/anchor/pose transforms altered '+pose);
 if(JSON.stringify(old.j.animations)!==JSON.stringify(cur.j.animations))throw Error('Clip metadata altered '+pose);
 for(let i=0;i<old.j.animations.length;i++)for(let k=0;k<old.j.animations[i].samplers.length;k++){
  const oa=old.j.animations[i].samplers[k],na=j.animations[i].samplers[k];
  for(let f of ['input','output'])if(!equal(accessorBytes(old,oa[f]),accessorBytes(cur,na[f])))throw Error('Clip sampler byte drift');
 }
 const expectedClips=['sit_idle',pose==='cross'?'cross_prayer_idle':'kneel_prayer_idle'];
 if(j.animations.map(a=>a.name).sort().join('|')!==expectedClips.sort().join('|'))throw Error('Unexpected animations');
 if(j.animations.some(clip=>clip.samplers.some(s=>j.accessors[s.input].count!==17)))throw Error('No original 17-key clips');
 if(j.animations.some(clip=>clip.samplers.some(s=>Math.abs(j.accessors[s.input].max[0]-2)>0.005)))throw Error('Clip not 2.0s');
 let frozenNonhair=0;
 for(let i=0;i<j.meshes.length;i++){
  const o=old.j.meshes[i].primitives[0],n=j.meshes[i].primitives[0];
  if(i===6)continue;
  if(JSON.stringify(o)!==JSON.stringify(n))throw Error('Nonhair primitive descriptor changed '+i);
  for(const f of ['POSITION','NORMAL'])if(!equal(accessorBytes(old,o.attributes[f]),accessorBytes(cur,n.attributes[f])))throw Error('Nonhair bytes altered '+i+f);
  if(!equal(accessorBytes(old,o.indices),accessorBytes(cur,n.indices)))throw Error('Nonhair face bytes changed '+i);
  frozenNonhair++;
 }
 const hOld=old.j.meshes[6].primitives[0],hNew=j.meshes[6].primitives[0];
 if(hNew.material!==hOld.material||hNew.material!==6)throw Error('Hair material changed');
 if(j.accessors[hNew.indices].count!==3080*3||j.accessors[hNew.attributes.POSITION].count!==1672)throw Error('hair mesh count drift');
 for(const field of ['POSITION','NORMAL']){
  const l=accessorBytes(old,hOld.attributes[field]),r=accessorBytes(cur,hNew.attributes[field]);
  if(!equal(l.subarray(897*12,1105*12),r.subarray(897*12,1105*12)))throw Error('Eyebrow POSITION/NORMAL changed '+pose);
 }
 if(!equal(accessorBytes(old,hOld.indices),accessorBytes(cur,hNew.indices)))throw Error('Changed hair indices '+pose);
 const capOld=boundRay(old.j,old.bin,readAcc),capNew=boundRay(j,cur.bin,readAcc),
  sweepOld=patchSamples(old.j,old.bin),sweepNew=patchSamples(j,cur.bin);
 const views=['hair_front','hair_top','hair_right_3q','hair_left','hair_right','hair_back'].map(v=>{
   const a=cameraRays(old.j,old.bin,readAcc,v),b=cameraRays(j,cur.bin,readAcc,v);
   return {view:v,oldSkinFirst:a.skinFirst,newSkinFirst:b.skinFirst,totalRays:a.cameraRaysUpperHead};
 });
 if(capNew.negative!==0||sweepNew.negative!==0||views.some(x=>x.newSkinFirst!==0))throw Error('P07A SCALP COVERAGE FAIL '+pose);
 const baseHair=eyeMesh(old.j,old.bin,6,readAcc).p,newHair=eyeMesh(j,cur.bin,6,readAcc).p,center=[0,.85,.005];
 const zones={crown:p=>p[1]>1.095,temple:p=>Math.abs(p[0])>.255&&p[1]>.89&&p[1]<1.045,
    nape:p=>p[2]<-.22&&p[1]>.83&&p[1]<.99};
 const zoneMetrics={};for(const [zone,predicate] of Object.entries(zones)){
  let d=[];for(let k=0;k<841;k++){
   const q=baseHair.slice(k*3,k*3+3),v=newHair.slice(k*3,k*3+3);
   if(!predicate(q))continue;
   const rad=p=>Math.hypot(...p.map((x,i)=>x-center[i]));
   d.push((rad(v)-rad(q))*1000);
  }
  zoneMetrics[zone]={samples:d.length,meanDeltaMM:+(d.reduce((x,y)=>x+y,0)/d.length).toFixed(3),
  minDeltaMM:+Math.min(...d).toFixed(3),maxDeltaMM:+Math.max(...d).toFixed(3)};
 }
 return {pose,sourceSha256:s.oldHash,newSha256:s.newHash,bytes:b.length,triangles,vertices:verts,
 meshes:j.meshes.length,materials:j.materials.length,clothVariants:j.extensions.KHR_materials_variants.variants.map(x=>x.name),
 nonHairMeshesByteExact:frozenNonhair,animationSamplersByteExact:true,anchorsExact:true,
 eyebrowsByteExact:true,hairFaceIndicesByteExact:true,
 capOld:{samples:capOld.total,negative:capOld.negative,minMM:capOld.minMm},
 capNew:{samples:capNew.total,negative:capNew.negative,minMM:capNew.minMm},
 sweepOld,sweepNew,views,zoneMetrics,
 hairHashes:{position:hash(accessorBytes(cur,hNew.attributes.POSITION)),
 normals:hash(accessorBytes(cur,hNew.attributes.NORMAL)),
 indices:hash(accessorBytes(cur,hNew.indices))}};
}
const a=checkPose('cross'),b=checkPose('kneel');
if(JSON.stringify(a.hairHashes)!==JSON.stringify(b.hairHashes))throw Error('Two poses use different undercut geometry!');
console.log(JSON.stringify({status:'P07A_ALL_GEOMETRY_AND_CONTRACT_CHECKS_PASS',
 applicability:'ONLY to finite sampled rays and bytewise glTF; NOT Cycles art approval',
 results:[a,b],identicalCrossKneelHair:true},null,2));
