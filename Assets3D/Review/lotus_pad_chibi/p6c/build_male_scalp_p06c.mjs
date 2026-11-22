/*
AI Visual 12 — P06c sampled real glTF skull ray/coverage corrective sculpt.
Only original HAIR primitive 6 changed (position/normal), no additional face, mesh,
material or color mapping. Sculpted p6b layers remain as surface geometry.
REAL rays from head center intersect original skin triangles to establish radial scalp
clearance. Corrective lift field is calculated on cap vertices and propagated to
hair swept clump vertices with 4-nearest directional shell interpolation.
Explicitly NOT a proof of continuous triangle-triangle collision.
Zero-cost. Node22 standard library. Strict p6b SHA locks.
*/
const INPUT_SHA={cross:"d6add5fdd5ec7122c24aee774c1ea10cc0588643842c891e334ffd30c60ce4cb",
kneel:"db78a1b26bff1cd2dced82d4ed4d4255280cfb6eb3db3ea2dd5ab5b5674c0701"};
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

function scalpFix(bytes,pose){
 if(!INPUT_SHA[pose])throw Error("Invalid pose");
 let {j,bin}=parseGLB(bytes);
 const hairIdx=6,skinIdx=3,skinPr=j.meshes[skinIdx].primitives[0],hp=j.meshes[hairIdx].primitives[0];
 if(j.meshes[hairIdx].name!=="hair_neat_male_soft_sidepart_p06b_mesh")throw Error("Only authentic P6b input accepted");
 if(j.meshes.length!==(pose==="cross"?10:9)||j.materials.length!==21)throw Error("Incorrect frozen male");
 let p=readAcc(j,bin,hp.attributes.POSITION),originalNormals=readAcc(j,bin,hp.attributes.NORMAL),f=readAcc(j,bin,hp.indices);
 let skin={p:readAcc(j,bin,skinPr.attributes.POSITION),f:readAcc(j,bin,skinPr.indices)};
 if(p.length/3!==1672||f.length/3!==3080)throw Error("Unexpected P6b hair topology");
 const c=[0,.85,.005],CAP=841,LIP=56,BROWSTART=897,BROWCOUNT=208,PATCHSTART=1105,MIN_CLEAR_M=.014;
 const old=p.slice(),dirs=[],required=[];let nRay=0,minOriginal=Infinity;
 function unit(v){let m=Math.hypot(...v)||1;return v.map(x=>x/m);}
 for(let i=0;i<CAP;i++){
  const at=i*3,coord=old.slice(at,at+3),rv=coord.map((x,k)=>x-c[k]),distance=Math.hypot(...rv),d=unit(rv);
  dirs.push(d);
  // measured scalp is ORIGINAL unchanged head skin tri mesh. +Y local up.
  let hit=rayFace(c,d,skin);
  let clearance=hit?distance-hit.t:Infinity;
  if(hit){nRay++;minOriginal=Math.min(minOriginal,clearance);}
  let allow=coord[1]>=.91 && coord[2]>=-.20;
  // Keep hair front/rim and lower back unaffected; repair only actual original skull collision.
  required.push(allow&&hit?Math.max(0,MIN_CLEAR_M-clearance):0);
 }
 // Make displacement smoothly spread outward instead of a new jagged raised island.
 // All updates constrained to at least exact per-vertex required scalp clearance.
 let fLift=required.slice();
 function neighbours(i){
  if(i===0){let out=[];for(let q=0;q<56;q++)out.push(1+q);return out}
  let ring=Math.floor((i-1)/56),q=(i-1)%56;
  let arr=[1+56*ring+(q+55)%56,1+56*ring+(q+1)%56];
  if(ring===0)arr.push(0);else arr.push(1+56*(ring-1)+q);
  if(ring<14)arr.push(1+56*(ring+1)+q);
  return arr;
 }
 for(let it=0;it<7;it++){
  let next=fLift.map((v,i)=>{
   let adj=neighbours(i),mean=adj.reduce((a,n)=>a+fLift[n],0)/adj.length;
   return Math.max(required[i],v,mean*.92);
  });fLift=next;
 }
 for(let i=0;i<CAP;i++){
  let at=i*3,d=dirs[i],lift=fLift[i];
  for(let k=0;k<3;k++)p[at+k]+=d[k]*lift;
 }
 // 56 thin rim lip vertices follow same ring transformation to keep cap closed.
 for(let q=0;q<LIP;q++){
  let vertex=841+q,cap=1+14*56+q;
  let at=vertex*3,d=unit(old.slice(at,at+3).map((x,k)=>x-c[k]));
  let lift=fLift[cap];
  for(let k=0;k<3;k++)p[at+k]+=d[k]*lift;
 }
 // Preserve original *styled* 3x open hair ribbons, with same corrected scalp field
 // as the underlying shell, not independently re-clamp them above shell.
 let patchMinLift=Infinity,patchMaxLift=0;
 for(let i=PATCHSTART;i<p.length/3;i++){
  let at=i*3,rv=old.slice(at,at+3).map((x,k)=>x-c[k]),d=unit(rv),best=[
   {distance:Infinity,i:0},{distance:Infinity,i:0},{distance:Infinity,i:0},{distance:Infinity,i:0}
  ];
  for(let n=0;n<CAP;n++){
   let cos=dot3(d,dirs[n]),dist=Math.max(0,2*(1-cos));
   if(dist>=best[3].distance)continue;
   let place=3;while(place>0&&dist<best[place-1].distance){best[place]=best[place-1];place--}
   best[place]={distance:dist,i:n};
  }
  let sum=0,val=0;for(let v of best){let w=1/(.00015+v.distance);sum+=w;val+=w*fLift[v.i];}
  let lift=val/sum;patchMinLift=Math.min(patchMinLift,lift);patchMaxLift=Math.max(patchMaxLift,lift);
  for(let k=0;k<3;k++)p[at+k]+=d[k]*lift;
 }
 // Capped new normal recomputation; original 208 eyebrow vertices INCLUDING normals untouched.
 const nn=normals3(p,f);
 for(let i=BROWSTART;i<BROWSTART+BROWCOUNT;i++)for(let k=0;k<3;k++)nn[i*3+k]=originalNormals[i*3+k];
 // Header/body may have custom extras, but only hair mesh bufferViews are modified.
 const repl=new Map();
 function patch(id,values){const a=j.accessors[id],v=j.bufferViews[a.bufferView];if(a.byteOffset)throw Error("Nonzero accessor offset");repl.set(a.bufferView,pack32(values,a.componentType));a.count=values.length/(a.type==="VEC3"?3:1);if(a.type==="VEC3"){let [mn,mx]=bound3(values);a.min=mn;a.max=mx;}}
 patch(hp.attributes.POSITION,p);patch(hp.attributes.NORMAL,nn);
 j.meshes[6].name="hair_neat_male_scalp_coverage_p06c_mesh";
 const hairNode=j.nodes.find(x=>x.mesh===hairIdx);if(!hairNode)throw Error("Missing original hair object");
 hairNode.name="hair_neat_male_scalp_coverage_p06c_object";
 j.extras.P06c={revision:"p6c",scope:"glTF mesh 6 ONLY, exact nonhair bytes frozen",
  scalpMethod:"real skull triangles radial ray/vertex min 14mm, neighbor-smooth on 841 base shell vertices; 3 sweep clumps carry same field",
  baselineInputSHA256:INPUT_SHA[pose],pending:true,ownerGate:"P06C_MALE_HAIR_SCALP_COVERAGE_OWNER_REVIEW_REQUIRED"};
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
 let changed=fLift.filter(x=>x>1e-7).length,maximumLift=Math.max(...fLift);
 return{bytes:out,metrics:{pose,bytes:out.length,oldVertices:1672,newVertices:p.length/3,oldTriangles:3080,newTriangles:f.length/3,
 scalpCenter:c,requestedMinClearanceMeters:MIN_CLEAR_M,scalpVertexSamples:nRay,
 minOriginalScalpClearanceMm:minOriginal*1000,
 maxShellLiftMm:maximumLift*1000,changedCapVertices:changed,
 patchMinLiftMm:patchMinLift*1000,patchMaxLiftMm:patchMaxLift*1000,
 originalBrowVerticesStillSame:208,faceWindingAndIndicesUnchanged:true}};
}
if(typeof process!=="undefined"&&process.argv?.[1]?.endsWith("build_male_scalp_p06c.mjs")){
 import("node:fs").then(async fs=>{
  const crypto=await import("node:crypto");const [file,pose]=process.argv.slice(2);
  if(!file||!INPUT_SHA[pose])throw Error("Usage: node build_male_scalp_p06c.mjs ../p6b/meditator_male_<pose>_prayer_p06b.glb cross|kneel");
  const input=new Uint8Array(fs.readFileSync(file));
  const hash=crypto.createHash("sha256").update(input).digest("hex");
  if(hash!==INPUT_SHA[pose])throw Error("Original P6b binary SHA mismatch");
  const {bytes,metrics}=scalpFix(input,pose),name="meditator_male_"+pose+"_prayer_p06c.glb";
  fs.writeFileSync(name,bytes);console.log(JSON.stringify({name,sha256:crypto.createHash("sha256").update(bytes).digest("hex"),metrics},null,2));
 }).catch(e=>{console.error(e);process.exitCode=1;});
}
