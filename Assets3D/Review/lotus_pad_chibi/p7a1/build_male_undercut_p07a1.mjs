/* OnlinePagodaVer2 P0.7a1. Original in-place GLB hair-only refinement.
   Deterministic zero-cost Node.js 22+. Parent p7a exact SHA pinned; p6c and all historic files immutable.
   Production images require separate Blender Cycles reimport, NOT claimed by this builder.
*/
import fs from "node:fs";
import {createHash} from "node:crypto";
const INPUT_SHA={
  "cross": "72c407bf3b6ae8a6edc8ed9a0e544168db7edcac379a8ea92b9677cceed00107",
  "kneel": "e7f86beb4cd43f899c57922c0e34c94020e93dc007c6b9f5094b2757363960da"
};
function from64(raw){
 const s=raw.replace(/\s/g,""),ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",tab=new Int16Array(128);tab.fill(-1);
 for(let i=0;i<64;i++)tab[ABC.charCodeAt(i)]=i;
 const len=Math.floor(s.length*3/4)-(s.endsWith("==")?2:s.endsWith("=")?1:0),out=new Uint8Array(len);let k=0;
 for(let i=0;i<s.length;i+=4){let v=(tab[s.charCodeAt(i)]<<18)|(tab[s.charCodeAt(i+1)]<<12)|((s[i+2]==="="?0:tab[s.charCodeAt(i+2)])<<6)|(s[i+3]==="="?0:tab[s.charCodeAt(i+3)]);out[k++]=v>>>16&255;if(k<len)out[k++]=v>>>8&255;if(k<len)out[k++]=v&255;}return out;
}

function to64(b){const abc="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",pieces=[];let s="";
 for(let i=0;i<b.length;i+=3){let x=(b[i]<<16)|((b[i+1]||0)<<8)|(b[i+2]||0);s+=abc[(x>>>18)&63]+abc[(x>>>12)&63]+(i+1<b.length?abc[(x>>>6)&63]:"=")+(i+2<b.length?abc[x&63]:"=");if(s.length>=8192){pieces.push(s);s="";}}
 pieces.push(s);return pieces.join("");
}

function enc(s){let out=[];for(let i=0;i<s.length;i++){const c=s.codePointAt(i);if(c>65535)i++;if(c<128)out.push(c);else if(c<2048)out.push(192|c>>6,128|(c&63));else if(c<65536)out.push(224|c>>12,128|((c>>6)&63),128|(c&63));else out.push(240|c>>18,128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(out);}

function dec(b){let out="";for(let i=0;i<b.length;i++){let c=b[i];if(c<128){out+=String.fromCharCode(c);continue;}let cp;if(c<224)cp=(c&31)<<6|(b[++i]&63);else if(c<240)cp=(c&15)<<12|(b[++i]&63)<<6|(b[++i]&63);else cp=(c&7)<<18|(b[++i]&63)<<12|(b[++i]&63)<<6|(b[++i]&63);out+=String.fromCodePoint(cp);}return out;}

function sha256(bytes){
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],n=bytes.length,sz=(n+9+63)&~63,msg=new Uint8Array(sz);msg.set(bytes);msg[n]=128;const d=new DataView(msg.buffer);d.setUint32(sz-8,Math.floor(n*8/2**32),false);d.setUint32(sz-4,(n*8)>>>0,false);
 const rotr=(x,k)=>(x>>>k)|(x<<(32-k)),w=new Uint32Array(64);
 for(let o=0;o<sz;o+=64){for(let i=0;i<16;i++)w[i]=d.getUint32(o+4*i,false);for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rotr(a,7)^rotr(a,18)^(a>>>3))+w[i-7]+(rotr(b,17)^rotr(b,19)^(b>>>10)))>>>0;}
 let [a,b,c,e,f,g,h,t]=H;
 for(let i=0;i<64;i++){const t1=(t+(rotr(f,6)^rotr(f,11)^rotr(f,25))+((f&g)^(~f&h))+K[i]+w[i])>>>0,t2=((rotr(a,2)^rotr(a,13)^rotr(a,22))+((a&b)^(a&c)^(b&c)))>>>0;t=h;h=g;g=f;f=(e+t1)>>>0;e=c;c=b;b=a;a=(t1+t2)>>>0;}
 const next=[a,b,c,e,f,g,h,t];for(let i=0;i<8;i++)H[i]=(H[i]+next[i])>>>0;
 }
 return H.map(x=>x.toString(16).padStart(8,"0")).join("");
}

function u32(b,o){return (b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0;}

function w32(b,o,x){b[o]=x&255;b[o+1]=(x>>>8)&255;b[o+2]=(x>>>16)&255;b[o+3]=(x>>>24)&255;}

function glb(b){
 if(dec(b.subarray(0,4))!=="glTF"||u32(b,4)!==2||u32(b,8)!==b.length)throw Error("not GLB2");
 const n=u32(b,12);if(u32(b,16)!==0x4e4f534a)throw Error("JSON");const j=JSON.parse(dec(b.subarray(20,20+n))),o=20+n;
 if(u32(b,o+4)!==0x004e4942)throw Error("BIN");
 return {j,bin:b.subarray(o+8,o+8+u32(b,o))};
}

function acc(m,id){const a=m.j.accessors[id],v=m.j.bufferViews[a.bufferView],off=(v.byteOffset||0)+(a.byteOffset||0),d=new DataView(m.bin.buffer,m.bin.byteOffset+off),comps=a.type==="VEC3"?3:1,n=a.count*comps;const q=new Array(n);for(let i=0;i<n;i++)q[i]=a.componentType===5126?d.getFloat32(i*4,true):a.componentType===5125?d.getUint32(i*4,true):(()=>{throw Error("unexpected accessor type")})();return q;}

function accRaw(m,id){const a=m.j.accessors[id],v=m.j.bufferViews[a.bufferView],n=a.count*(a.type==="VEC3"?3:1)*4,off=(v.byteOffset||0)+(a.byteOffset||0);return m.bin.subarray(off,off+n);}

function f32(a){const b=new Uint8Array(a.length*4),d=new DataView(b.buffer);for(let i=0;i<a.length;i++)d.setFloat32(i*4,a[i],true);return b;}

function same(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}

function smooth(x){const q=Math.max(0,Math.min(1,x));return q*q*(3-2*q);}

function normals(p,f){const n=new Float64Array(p.length);for(let i=0;i<f.length;i+=3){const a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;for(const v of [a,b,c]){n[v]+=x;n[v+1]+=y;n[v+2]+=z;}}const o=new Array(p.length);for(let i=0;i<p.length;i+=3){const s=Math.hypot(n[i],n[i+1],n[i+2])||1;o[i]=n[i]/s;o[i+1]=n[i+1]/s;o[i+2]=n[i+2]/s;}return o;}

function rayT(O,D,skin){
 const p=skin.p,f=skin.f;let best=Infinity;
 for(let q=0;q<f.length;q+=3){const i=3*f[q],j=3*f[q+1],k=3*f[q+2],ax=p[i],ay=p[i+1],az=p[i+2],e1x=p[j]-ax,e1y=p[j+1]-ay,e1z=p[j+2]-az,e2x=p[k]-ax,e2y=p[k+1]-ay,e2z=p[k+2]-az,px=D[1]*e2z-D[2]*e2y,py=D[2]*e2x-D[0]*e2z,pz=D[0]*e2y-D[1]*e2x,det=e1x*px+e1y*py+e1z*pz;
 if(Math.abs(det)<1e-10)continue;const inv=1/det,tx=O[0]-ax,ty=O[1]-ay,tz=O[2]-az,bu=(tx*px+ty*py+tz*pz)*inv;if(bu<0||bu>1)continue;
 const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,bv=(D[0]*qx+D[1]*qy+D[2]*qz)*inv;if(bv<0||bu+bv>1)continue;
 const t=(e2x*qx+e2y*qy+e2z*qz)*inv;if(t>1e-5&&t<best)best=t;
 }return Number.isFinite(best)?best:null;
}

function sculpt(m){
 const h=m.j.meshes[6].primitives[0],head=m.j.meshes[3].primitives[0],p=acc(m,h.attributes.POSITION),old=p.slice(),nOld=acc(m,h.attributes.NORMAL),idx=acc(m,h.indices),skin={p:acc(m,head.attributes.POSITION),f:acc(m,head.indices)};
 if(m.j.meshes[6].name!=="hair_neat_male_gentle_undercut_p07a_mesh"||p.length!==1672*3||idx.length!==3080*3)throw Error("Unexpected P07a hair");
 const C=[0,.85,.005],CAP=841,lip=56,dirs=[],delta=[],metrics={zones:{},capSamples:0,capClamps:0,patchSamples:0,patchClamps:0,minCapGapMM:Infinity,minPatchGapMM:Infinity,maxLiftMm:-Infinity,maxTaperMm:Infinity};
 const norm=v=>{const r=Math.hypot(...v)||1;return v.map(t=>t/r);},dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const exp=(x,r)=>Math.exp(-Math.pow(x/r,2));
 function deltaFor([x,y,z]){
  const abs=Math.abs(x),top=smooth((y-1.035)/.125),up=smooth((y-1.081)/.090),side=smooth((abs-.165)/.103),low=1-smooth((y-.958)/.127);
  // Broader taller crown with soft asymmetric comb, not an artificial top hat.
  const crown=.043*top*(.80+.20*exp(x+.075,.16))*(.93+.07*smooth((z+.15)/.38));
  const forward=.010*smooth((z-.035)/.185)*smooth((y-1.018)/.125)*exp(x+.08,.17);
  // Genuine short temple / neck taper. All scalp remains opaque hair, no skin fade.
  const temple=-.015*side*low*(.85+.15*smooth((abs-.22)/.09));
  const nape=-.014*smooth((-z-.135)/.13)*(1-smooth((y-.89)/.15));
  const graduation=.002*side*smooth((y-.974)/.045)*(1-smooth((y-1.076)/.057));
  const comb=.0026*up*smooth((z+.08)/.33)*Math.cos((x+.43*(z-.06))*12);
  return crown+forward+temple+nape+graduation+comb;
 }
 function gap(pt,d){const t=rayT(C,d,skin);return t===null?null:Math.hypot(pt[0]-C[0],pt[1]-C[1],pt[2]-C[2])-t;}
 for(let i=0;i<CAP;i++){
  const k=3*i,q=old.slice(k,k+3),d=norm(q.map((x,t)=>x-C[t]));dirs.push(d);
  let sh=deltaFor(q),g=gap(q,d);
  if(g!==null){metrics.capSamples++;if(g+sh<.0085){sh=.0085-g;metrics.capClamps++;}}
  delta.push(sh);for(let t=0;t<3;t++)p[k+t]+=d[t]*sh;const after=gap(p.slice(k,k+3),d);if(after!==null)metrics.minCapGapMM=Math.min(metrics.minCapGapMM,after*1000);
  metrics.maxLiftMm=Math.max(metrics.maxLiftMm,sh*1000);metrics.maxTaperMm=Math.min(metrics.maxTaperMm,sh*1000);
 }
 for(let i=0;i<lip;i++){const k=(CAP+i)*3,capIndex=1+14*56+i,pt=old.slice(k,k+3),d=norm(pt.map((x,t)=>x-C[t]));for(let t=0;t<3;t++)p[k+t]+=d[t]*delta[capIndex];}
 // Brow range 897..1104 explicitly never edited. Sweep locks follow same cap sculpt.
 for(let i=1105;i<1672;i++){
  const k=3*i,q=old.slice(k,k+3),d=norm(q.map((x,t)=>x-C[t]));let best=[{dist:Infinity,index:0},{dist:Infinity,index:0},{dist:Infinity,index:0},{dist:Infinity,index:0}];
  for(let v=0;v<CAP;v++){let dd=Math.max(0,2*(1-dot(d,dirs[v])));if(dd>=best[3].dist)continue;let at=3;while(at>0&&dd<best[at-1].dist){best[at]=best[at-1];at--;}best[at]={dist:dd,index:v};}
  let val=0,sum=0;for(const hit of best){const w=1/(hit.dist+.00015);val+=w*delta[hit.index];sum+=w;}let sh=val/sum;
  // Soft sculpt lock relief, no floating card or spiky fragments.
  sh+=.0020*smooth((q[1]-1.025)/.13)*smooth((q[2]+.08)/.33);
  const g=gap(q,d);if(g!==null){metrics.patchSamples++;if(g+sh<.0075){sh=.0075-g;metrics.patchClamps++;}}
  for(let t=0;t<3;t++)p[k+t]+=d[t]*sh;const after=gap(p.slice(k,k+3),d);if(after!==null)metrics.minPatchGapMM=Math.min(metrics.minPatchGapMM,after*1000);
 }
 const n=normals(p,idx);for(let i=897;i<1105;i++)for(let t=0;t<3;t++)n[i*3+t]=nOld[i*3+t];
 let oldD=[],newD=[];const zones={crown:q=>q[1]>1.095,temples:q=>Math.abs(q[0])>.255&&q[1]>.89&&q[1]<1.045,nape:q=>q[2]<-.22&&q[1]>.83&&q[1]<.99};
 for(const [key,pred] of Object.entries(zones)){const samples=[];for(let i=0;i<CAP;i++){const o=old.slice(i*3,i*3+3);if(!pred(o))continue;samples.push(delta[i]*1000);}metrics.zones[key]={samples:samples.length,meanDeltaMM:samples.length?samples.reduce((x,y)=>x+y,0)/samples.length:null,minDeltaMM:Math.min(...samples),maxDeltaMM:Math.max(...samples)};}
 return {positions:p,normals:n,indices:idx,metrics};
}

function assemble(m,geom,pose){
 const j=m.j,p=j.meshes[6].primitives[0],aP=j.accessors[p.attributes.POSITION],aN=j.accessors[p.attributes.NORMAL];
 const b=m.bin.slice(),pos=f32(geom.positions),normal=f32(geom.normals);
 for(const [a,values] of [[aP,pos],[aN,normal]]){const v=j.bufferViews[a.bufferView],at=(v.byteOffset||0)+(a.byteOffset||0);if(a.componentType!==5126||a.count!==1672||v.byteLength<values.length)throw Error("Bad buffer layout");b.set(values,at);}
 const mm=[Array(3).fill(Infinity),Array(3).fill(-Infinity)];for(let i=0;i<geom.positions.length;i+=3)for(let z=0;z<3;z++){mm[0][z]=Math.min(mm[0][z],geom.positions[i+z]);mm[1][z]=Math.max(mm[1][z],geom.positions[i+z]);}aP.min=mm[0];aP.max=mm[1];
 j.meshes[6].name="hair_neat_male_tapered_undercut_p07a1_mesh";
 const hairNode=j.nodes.find(n=>n.mesh===6);hairNode.name="hair_neat_male_tapered_undercut_p07a1_object";
 j.extras.P07a1={revision:"p7a1",parent:"p7a",parentSHA256:INPUT_SHA[pose],onlyEditedMeshIndex:6,design:"softer fuller asymmetric groomed top vs shortened side and natural nape taper",unchangedEyebrows:true,unchangedAnchorsAnimationsClothesSkinLotus:true,gate:"P07A1_STOP_FOR_SA_REVIEW"};
 const json=enc(JSON.stringify(j)),jp=(4-json.length%4)%4,bp=(4-b.length%4)%4,total=12+8+json.length+jp+8+b.length+bp,out=new Uint8Array(total);let o=0;
 out.set(enc("glTF"),o);o+=4;w32(out,o,2);o+=4;w32(out,o,total);o+=4;w32(out,o,json.length+jp);o+=4;w32(out,o,0x4e4f534a);o+=4;out.set(json,o);o+=json.length;for(let k=0;k<jp;k++)out[o++]=32;w32(out,o,b.length+bp);o+=4;w32(out,o,0x004e4942);o+=4;out.set(b,o);o+=b.length;for(let k=0;k<bp;k++)out[o++]=0;
 if(o!==total)throw Error("GLB output length mismatch");
 return out;
}

function validate(orig,after,geom,pose){
 const old=glb(orig),cur=glb(after),ha=old.j.meshes[6].primitives[0],hb=cur.j.meshes[6].primitives[0];
 if(cur.j.meshes.length!==(pose==="cross"?10:9)||cur.j.materials.length!==21||cur.j.animations.length!==2)throw Error("Material/animation/mesh count");
 if(JSON.stringify(old.j.materials)!==JSON.stringify(cur.j.materials)||JSON.stringify(old.j.animations)!==JSON.stringify(cur.j.animations)||JSON.stringify(old.j.extensions)!==JSON.stringify(cur.j.extensions))throw Error("Material/variant/animation JSON modified");
 if(!same(accRaw(old,ha.indices),accRaw(cur,hb.indices)))throw Error("Hair indices changed");
 const oi=acc(old,ha.attributes.POSITION),ni=acc(cur,hb.attributes.POSITION),on=acc(old,ha.attributes.NORMAL),nn=acc(cur,hb.attributes.NORMAL);
 for(let i=897*3;i<1105*3;i++)if(oi[i]!==ni[i]||on[i]!==nn[i])throw Error("Eyebrow altered");
 for(let k=0;k<old.j.meshes.length;k++){if(k===6)continue;const a=old.j.meshes[k].primitives,b=cur.j.meshes[k].primitives;if(JSON.stringify(a)!==JSON.stringify(b))throw Error("Nonhair mesh descriptors "+k);for(let i=0;i<a.length;i++){for(let id of Object.values(a[i].attributes))if(!same(accRaw(old,id),accRaw(cur,id)))throw Error("Nonhair attributes changed "+k);if(!same(accRaw(old,a[i].indices),accRaw(cur,b[i].indices)))throw Error("Nonhair face changed "+k);}}
 for(let i=0;i<old.j.animations.length;i++)for(let sm of old.j.animations[i].samplers){if(!same(accRaw(old,sm.input),accRaw(cur,sm.input))||!same(accRaw(old,sm.output),accRaw(cur,sm.output)))throw Error("Animation sampler changed");}
 const names=cur.j.extensions.KHR_materials_variants.variants.map(x=>x.name).join(",");
 if(names!=="pastel_lilac,blush_rose,sage_green,sky_blue,warm_cream,terracotta")throw Error("Palette names changed");
 const anchors=["SeatRoot","UpperBodyBreath","HeadAnchor","NameplateAnchor","FXAnchor"];
 for(const name of anchors){const a=old.j.nodes.find(n=>n.name===name),b=cur.j.nodes.find(n=>n.name===name);if(!a||!b||JSON.stringify(a)!==JSON.stringify(b))throw Error("Anchor changed "+name);}
 const hairHashes={POSITION:sha256(accRaw(cur,hb.attributes.POSITION)),NORMAL:sha256(accRaw(cur,hb.attributes.NORMAL)),indices:sha256(accRaw(cur,hb.indices))};
 return {pose,sourceSha256:sha256(orig),outputSha256:sha256(after),bytes:after.length,glb2:true,meshes:cur.j.meshes.length,materials:cur.j.materials.length,hairVertices:1672,hairTriangles:3080,totalTriangles:pose==="cross"?18380:18420,animations:cur.j.animations.map(x=>x.name),palettes:names.split(","),nonHairAccessorBytesExact:true,animationSamplersExact:true,anchorsExact:true,eyebrowsExact:true,unchangedHairIndices:true,hairHashes,geometry:geom.metrics};
}
const pose=process.argv[2];if(!["cross","kneel"].includes(pose)){console.error("Usage: node build_male_undercut_p07a1.mjs cross|kneel");process.exit(2);}
const src=new URL("../p7a/meditator_male_"+pose+"_prayer_undercut_p07a.glb",import.meta.url);
const input=new Uint8Array(fs.readFileSync(src));if(sha256(input)!==INPUT_SHA[pose])throw Error("Exact P07a SHA pin mismatch");
const result=sculpt(glb(input)),output=assemble(glb(input),result,pose),report=validate(input,output,result,pose);
const dst=new URL("./meditator_male_"+pose+"_prayer_undercut_p07a1.glb",import.meta.url);fs.writeFileSync(dst,output);console.log(JSON.stringify(report,null,2));
