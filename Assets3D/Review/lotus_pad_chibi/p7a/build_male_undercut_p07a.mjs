/* AI Visual 13 / P07a — original, deterministic gentle male UNDERCUT hairstyle.
   Input exactly the owner-approved P06c cross + kneel GLB2, never P06b.
   One existing hair primitive (#6), same topology and material.
   Sculpt short temple / nape taper with lifted combed crown; three original
   soft top sweeps follow the surface field. Preserve 208 eyebrow vertices,
   hair index array and ALL nonhair/animations/material/anchors byte-for-byte.
   Uses actual original skin mesh triangle ray hit to enforce scalp cover.
   Node.js 22+ stdlib only, zero paid cost.
*/
const INPUT_SHA={cross:"c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4",
kneel:"38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad"};
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

function sculptUndercutP07a(bytes,pose){
 if(!INPUT_SHA[pose])throw Error("Invalid pose");
 let {j,bin}=parseGLB(bytes);
 const hairIdx=6,skinIdx=3,skinPr=j.meshes[skinIdx].primitives[0],hp=j.meshes[hairIdx].primitives[0];
 if(j.meshes[hairIdx].name!=="hair_neat_male_scalp_coverage_p06c_mesh")throw Error("Only exact P06c male baseline input accepted");
 if(j.meshes.length!==(pose==="cross"?10:9)||j.materials.length!==21)throw Error("Incorrect frozen male");

 let p=readAcc(j,bin,hp.attributes.POSITION),originalNormals=readAcc(j,bin,hp.attributes.NORMAL),f=readAcc(j,bin,hp.indices);
 let skin={p:readAcc(j,bin,skinPr.attributes.POSITION),f:readAcc(j,bin,skinPr.indices)};
 if(p.length/3!==1672||f.length/3!==3080)throw Error("P06c original hair topology mismatch");
 const c=[0,.85,.005],CAP=841,LIP=56,BROWSTART=897,BROWCOUNT=208,PATCHSTART=1105,MIN_CLEAR_M=.010;
 const old=p.slice(),dirs=[],displacement=[],zones={top:0,leftTemple:0,rightTemple:0,backNape:0,frontSweep:0,capVerticesChanged:0};
 let minBefore=Infinity,maxCapLift=-Infinity,minCapLift=Infinity,minAfter=Infinity,sourceRayHitCount=0,clearanceClamps=0;
 const expx=(x,w)=>Math.exp(-Math.pow(x/w,2));
 function unit(v){let m=Math.hypot(...v)||1;return v.map(x=>x/m);}
 function targetDelta(q){
  const [x,y,z]=q,ax=Math.abs(x);
  const top=smooth((y-1.015)/.112),side=smooth((ax-.135)/.115),low=1-smooth((y-.975)/.12);
  // 9mm lift centered on crown to distinguish from soft short baseline.
  const crown=.0105*top*(.83+.17*expx(x+.04,.17));
  // Moderate +3mm sweeping left forelock; no spikes or shaved color patches.
  const fringe=.003*smooth((z-.02)/.19)*smooth((y-1.042)/.094)*expx(x+.085,.13);
  // Taper sides 18.5mm at temples, blending over 12cm into lifted top.
  // Relatively shorter behind ear near Y .95; no disconnected sheet.
  const temple=-.0185*side*low*(.89+.11*smooth((ax-.21)/.09));
  // Graceful -16mm lower nape taper without a straight bowl/cap edge.
  const nape=-.018*smooth((-z-.13)/.115)*(1-smooth((y-.900)/.155));
  // Low 2.0mm soft step near crown-to-side transition; not a hard razor band.
  const graduation=.002*side*smooth((y-.981)/.038)*(1-smooth((y-1.066)/.040));
  // Very subtle top directional comb relief (same geometry, not skin texture).
  const direction=.0015*top*smooth((z+.1)/.28)*expx(x+.05,.23)*
    Math.cos((x+.39*(z-.05))*13);
  return {total:crown+fringe+temple+nape+graduation+direction,parts:{crown,fringe,temple,nape,graduation,direction}};
 }
 function radialGap(q,d){
  let dist=Math.hypot(...q.map((x,k)=>x-c[k]));
  let hit=rayFace(c,d,skin);
  return hit?dist-hit.t:null;
 }
 for(let i=0;i<CAP;i++){
  const at=i*3,q=old.slice(at,at+3),d=unit(q.map((x,k)=>x-c[k]));
  dirs.push(d);
  const gap=radialGap(q,d),t=targetDelta(q);
  if(gap!==null){sourceRayHitCount++;minBefore=Math.min(minBefore,gap);}
  let delta=t.total;
  if(gap!==null&&gap+delta<MIN_CLEAR_M){delta=MIN_CLEAR_M-gap;clearanceClamps++;}
  displacement.push(delta);
  for(let k=0;k<3;k++)p[at+k]+=d[k]*delta;
  let newGap=radialGap(p.slice(at,at+3),d);
  if(newGap!==null)minAfter=Math.min(minAfter,newGap);
  maxCapLift=Math.max(maxCapLift,delta);minCapLift=Math.min(minCapLift,delta);
  if(Math.abs(delta)>.00005)zones.capVerticesChanged++;
  if(t.parts.crown>.001)zones.top++;
  if(t.parts.temple<-.002)q[0]<0?zones.leftTemple++:zones.rightTemple++;
  if(t.parts.nape<-.002)zones.backNape++;
  if(t.parts.fringe>.001)zones.frontSweep++;
 }
 // 56 hair underside/lip vertices follow their adjacent original bottom ring.
 for(let q=0;q<LIP;q++){
  const vert=841+q,cap=1+14*56+q,at=vert*3,d=unit(old.slice(at,at+3).map((x,k)=>x-c[k]));
  for(let k=0;k<3;k++)p[at+k]+=d[k]*displacement[cap];
 }
 // Follow each existing integrated soft top lock's base displacement, so that
 // the undercut is cohesive instead of new floating haircards. Preserve 3 locks.
 let patchMin=Infinity,patchMax=-Infinity,patchClampCount=0,minPatchGap=Infinity;
 for(let i=PATCHSTART;i<p.length/3;i++){
  const at=i*3,pt=old.slice(at,at+3),d=unit(pt.map((x,k)=>x-c[k]));
  let best=[{dist:Infinity,index:-1},{dist:Infinity,index:-1},{dist:Infinity,index:-1},{dist:Infinity,index:-1}];
  for(let v=0;v<CAP;v++){
   let dd=Math.max(0,2*(1-dot3(d,dirs[v])));
   if(dd>=best[3].dist)continue;
   let place=3;while(place>0&&dd<best[place-1].dist){best[place]=best[place-1];place--;}
   best[place]={dist:dd,index:v};
  }
  let wsum=0,val=0;
  for(let z of best){let w=1/(z.dist+.00015);wsum+=w;val+=w*displacement[z.index];}
  let delta=val/wsum,oldGap=radialGap(pt,d);
  if(oldGap!==null && oldGap+delta<.007){
   delta=.007-oldGap;patchClampCount++;
  }
  patchMin=Math.min(patchMin,delta);patchMax=Math.max(patchMax,delta);
  for(let k=0;k<3;k++)p[at+k]+=d[k]*delta;
  let newGap=radialGap(p.slice(at,at+3),d);
  if(newGap!==null)minPatchGap=Math.min(minPatchGap,newGap);
 }
 // Recalculate outward normals on existing unchanged indexed geometry.
 // The 208 brow vertices and old brow normals are EXACT original floats.
 const nn=normals3(p,f);
 for(let i=BROWSTART;i<BROWSTART+BROWCOUNT;i++)
  for(let k=0;k<3;k++)nn[i*3+k]=originalNormals[i*3+k];
  // Header/body may have custom extras, but only hair mesh bufferViews are modified.
 const repl=new Map();
 function patch(id,values){const a=j.accessors[id],v=j.bufferViews[a.bufferView];if(a.byteOffset)throw Error("Nonzero accessor offset");repl.set(a.bufferView,pack32(values,a.componentType));a.count=values.length/(a.type==="VEC3"?3:1);if(a.type==="VEC3"){let [mn,mx]=bound3(values);a.min=mn;a.max=mx;}}
 patch(hp.attributes.POSITION,p);patch(hp.attributes.NORMAL,nn);
 j.meshes[6].name="hair_neat_male_gentle_undercut_p07a_mesh";
 const hairNode=j.nodes.find(x=>x.mesh===hairIdx);if(!hairNode)throw Error("Missing original hair object");
 hairNode.name="hair_neat_male_gentle_undercut_p07a_object";
 j.extras.P07a={revision:"p7a",variant:"gentle_male_undercut",onlyEditedMeshIndex:6,
  sourceP06cSHA256:INPUT_SHA[pose],hairSculpt:"short inward-tapered temples and nape; raised rounded combed top and 3 original locks",
  scalp:"exact original head skin triangle-ray min 10mm cap and 7mm clumps at sampled original vertices",
  originalBrowAndNonhairAndClipsFrozen:true,gate:"P07A_MALE_UNDERCUT_SA_REVIEW_REQUIRED"};
 let chunks=[],size=0;
 for(let i=0;i<j.bufferViews.length;i++){
  let v=j.bufferViews[i],b=repl.get(i)||bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
  let pad=(4-size%4)%4;if(pad){chunks.push(new Uint8Array(pad));size+=pad;}v.byteOffset=size;v.byteLength=b.length;chunks.push(b);size+=b.length;
 }
 let binOut=new Uint8Array(size),offset=0;for(let chunk of chunks){binOut.set(chunk,offset);offset+=chunk.length}
 j.buffers[0].byteLength=binOut.length;
 let json=encodeUTF8(JSON.stringify(j)),jpad=(4-json.length%4)%4,bpad=(4-binOut.length%4)%4,total=12+8+json.length+jpad+8+binOut.length+bpad;
 let out=new Uint8Array(total),at=0;out.set(encodeUTF8("glTF"),at);at+=4;w32(out,at,2);at+=4;w32(out,at,total);at+=4;
 w32(out,at,json.length+jpad);at+=4;w32(out,at,0x4e4f534a);at+=4;out.set(json,at);at+=json.length;for(let n=0;n<jpad;n++)out[at++]=32;
 w32(out,at,binOut.length+bpad);at+=4;w32(out,at,0x004e4942);at+=4;out.set(binOut,at);at+=binOut.length;for(let n=0;n<bpad;n++)out[at++]=0;
 if(at!==total)throw Error("Unexpected total GLB bytes");
 return{bytes:out,metrics:{pose,bytes:out.length,oldHairVertices:1672,newHairVertices:p.length/3,
  oldHairTriangles:3080,newHairTriangles:f.length/3,
  originalSkinTriangleRaySamples:sourceRayHitCount,originalMinClearanceMm:minBefore*1000,
  finalMinCapClearanceMm:minAfter*1000,finalMinSweepClearanceMm:minPatchGap*1000,
  maximumBaseDisplacementMm:maxCapLift*1000,minimumBaseDisplacementMm:minCapLift*1000,
  sweptPatchMinDisplacementMm:patchMin*1000,sweptPatchMaxDisplacementMm:patchMax*1000,
  skinClearanceClampCount:clearanceClamps,sweepClearanceClampCount:patchClampCount,zones,
  eyebrowsVertexNormalsAndIndicesFrozen:true,hairFaceIndicesUnchanged:true,geometryVariant:"SOFT_UNDERCUT_ONLY"}};

}
if(typeof process!=="undefined"&&process.argv?.[1]?.endsWith("build_male_undercut_p07a.mjs")){
 import("node:fs").then(async fs=>{
  const crypto=await import("node:crypto");const [file,pose]=process.argv.slice(2);
  if(!file||!INPUT_SHA[pose])throw Error("Usage: node build_male_undercut_p07a.mjs ../p6c/meditator_male_<pose>_prayer_p06c.glb cross|kneel");
  const input=new Uint8Array(fs.readFileSync(file));
  const hash=crypto.createHash("sha256").update(input).digest("hex");
  if(hash!==INPUT_SHA[pose])throw Error("Original P06c binary SHA mismatch");
  const {bytes,metrics}=sculptUndercutP07a(input,pose),name="meditator_male_"+pose+"_prayer_undercut_p07a.glb";
  fs.writeFileSync(name,bytes);console.log(JSON.stringify({name,sha256:crypto.createHash("sha256").update(bytes).digest("hex"),metrics},null,2));
 }).catch(e=>{console.error(e);process.exitCode=1;});
}
