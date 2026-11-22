/* AI Visual 14 / P0.7b true GLB2 male hair-only sidepart 7/3, character RIGHT +X part, majority sweep LEFT -X.
   Original P06c SHA-pinned. Original procedural 0 VND; no Blender Cycles claim. */
import fs from "node:fs";import crypto from "node:crypto";
const SOURCE_SHA={"cross":"c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4","kneel":"38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad"};
function encode(s){let a=[];for(let i=0;i<s.length;i++){let c=s.codePointAt(i);if(c>65535)i++;if(c<128)a.push(c);else if(c<2048)a.push(192|c>>6,128|c&63);else if(c<65536)a.push(224|c>>12,128|c>>6&63,128|c&63);else a.push(240|c>>18,128|c>>12&63,128|c>>6&63,128|c&63);}return new Uint8Array(a);}

function decode(b){let s="";for(let i=0;i<b.length;i++){let c=b[i];if(c<128){s+=String.fromCharCode(c);continue;}let v;if(c<224)v=(c&31)<<6|(b[++i]&63);else if(c<240)v=(c&15)<<12|(b[++i]&63)<<6|(b[++i]&63);else v=(c&7)<<18|(b[++i]&63)<<12|(b[++i]&63)<<6|(b[++i]&63);s+=String.fromCodePoint(v);}return s;}

function u32(b,i){return (b[i]|b[i+1]<<8|b[i+2]<<16|b[i+3]<<24)>>>0;}

function w32(b,i,x){b[i]=x&255;b[i+1]=x>>>8&255;b[i+2]=x>>>16&255;b[i+3]=x>>>24&255;}

function parse(b){if(decode(b.subarray(0,4))!=="glTF"||u32(b,4)!==2||u32(b,8)!==b.length)throw Error("GLB2 invalid");let size=u32(b,12),j=JSON.parse(decode(b.subarray(20,20+size))),k=20+size;if(u32(b,k+4)!==0x004e4942)throw Error("Missing BIN");return{j,bin:b.subarray(k+8,k+8+u32(b,k))};}

function raw(m,id){let a=m.j.accessors[id],v=m.j.bufferViews[a.bufferView],bytes=a.count*({SCALAR:1,VEC3:3,VEC2:2,VEC4:4}[a.type]||0)*({5126:4,5125:4,5123:2,5121:1}[a.componentType]||0),k=(v.byteOffset||0)+(a.byteOffset||0);if(!bytes)throw Error("Bad accessor");return m.bin.subarray(k,k+bytes);}

function array(m,id){let a=m.j.accessors[id],b=raw(m,id),dv=new DataView(b.buffer,b.byteOffset),out=[];for(let i=0;i<a.count*(a.type==="VEC3"?3:1);i++)out.push(a.componentType===5126?dv.getFloat32(i*4,true):dv.getUint32(i*4,true));return out;}

function equal(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}

function smooth(x){let t=Math.min(1,Math.max(0,x));return t*t*(3-2*t);}

function normal(p,f){let n=new Float64Array(p.length);for(let i=0;i<f.length;i+=3){let a=3*f[i],b=3*f[i+1],c=3*f[i+2],ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;for(let j of[a,b,c]){n[j]+=x;n[j+1]+=y;n[j+2]+=z;}}let o=[];for(let i=0;i<p.length;i+=3){let q=Math.hypot(n[i],n[i+1],n[i+2])||1;o.push(n[i]/q,n[i+1]/q,n[i+2]/q);}return o;}

function stylize(m){
let h=m.j.meshes[6].primitives[0],p=array(m,h.attributes.POSITION),old=p.slice(),on=array(m,h.attributes.NORMAL),f=array(m,h.indices);
if(m.j.meshes[6].name!=="hair_neat_male_scalp_coverage_p06c_mesh"||p.length!==5016||f.length!==9240)throw Error("P06c hair mismatch");
let C=[0,.85,.005],norm=v=>{let l=Math.hypot(...v)||1;return v.map(x=>x/l);},G=(x,w)=>Math.exp(-Math.pow(x/w,2)),part=z=>.082+.020*smooth((.19-z)/.35),field=q=>{
let [x,y,z]=q,s=part(z),upper=smooth((y-1.005)/.145),front=smooth((z+.16)/.32),top=smooth((y-1.032)/.11),major=1-smooth((x-s+.02)/.10),minor=1-major;
return Math.max(-.0035,.012*upper+.026*top*front*major*(.65+.35*G(x+.08,.19))+.003*top*front*minor-.0035*G(x-s,.02)*top*front+.008*G(x-s+.045,.05)*top*front+.011*G(x+.07,.20)*smooth((z-.10)/.15)*smooth((y-.965)/.11)*major-.003*smooth((Math.abs(x)-.24)/.07)*(1-smooth((y-.95)/.11))-.002*smooth((-z-.17)/.12)*(1-smooth((y-.90)/.13)));
};
const lift=[];for(let i=0;i<841;i++){let k=3*i,q=old.slice(k,k+3),d=norm(q.map((x,j)=>x-C[j])),v=field(q),[x,y,z]=q,major=1-smooth((x-part(z)+.02)/.10);for(let j=0;j<3;j++)p[k+j]+=d[j]*v;p[k]-=.016*smooth((y-1.032)/.11)*smooth((z+.16)/.32)*major*G(x+.08,.24);lift.push(v);}
for(let i=0;i<56;i++){let k=3*(841+i),q=old.slice(k,k+3),d=norm(q.map((x,j)=>x-C[j]));for(let j=0;j<3;j++)p[k+j]+=d[j]*lift[1+14*56+i];}
for(let patch=0;patch<3;patch++)for(let row=0;row<27;row++)for(let col=0;col<7;col++){let i=1105+patch*189+row*7+col,k=i*3,q=old.slice(k,k+3),d=norm(q.map((x,j)=>x-C[j])),t=row/26,extra=(patch===0?.005:patch===1?.004:-.001)*Math.sin(Math.PI*t),v=Math.max(-.001,field(q)+extra);for(let j=0;j<3;j++)p[k+j]+=d[j]*v;p[k]+=(patch===0?-.024:patch===1?-.015:.017)*t;}
let n=normal(p,f);for(let i=897;i<1105;i++)for(let k=0;k<3;k++)n[i*3+k]=on[i*3+k];
let zone={},sel={major:q=>q[0]<.055&&q[1]>1.06&&q[2]>-.11,minor:q=>q[0]>.14&&q[1]>1.045&&q[2]>-.11,part:q=>Math.abs(q[0]-part(q[2]))<.028&&q[1]>1.045&&q[2]>-.12};for(let [name,test]of Object.entries(sel)){let a=[];for(let i=0;i<841;i++)if(test(old.slice(i*3,i*3+3)))a.push(lift[i]*1000);zone[name]={samples:a.length,meanRadialMm:a.length?a.reduce((x,y)=>x+y,0)/a.length:null};}
return{p,n,zone};
}

function exportGLB(m,h,pose){
let j=m.j,b=m.bin.slice(),dv=new DataView(b.buffer),prim=j.meshes[6].primitives[0];for(let [id,values]of[[prim.attributes.POSITION,h.p],[prim.attributes.NORMAL,h.n]]){let a=j.accessors[id],v=j.bufferViews[a.bufferView],off=(v.byteOffset||0)+(a.byteOffset||0);if(a.count!==1672||a.componentType!==5126)throw Error("Hair accessor unexpected");for(let i=0;i<values.length;i++)dv.setFloat32(off+i*4,values[i],true);}
let a=j.accessors[prim.attributes.POSITION],mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];for(let i=0;i<h.p.length;i+=3)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],h.p[i+k]);mx[k]=Math.max(mx[k],h.p[i+k]);}a.min=mn;a.max=mx;
j.meshes[6].name="hair_male_sidepart73_p07b_mesh";j.nodes.find(x=>x.mesh===6).name="hair_male_sidepart73_p07b_object";j.extras.P07b={revision:"p7b",baseline:"p6c",baselineSHA256:SOURCE_SHA[pose],sidePart:"right +X to left -X",modifiedMesh:6,gate:"P07B_SIDE_PART_73_SA_REVIEW_REQUIRED"};
let jb=encode(JSON.stringify(j)),pad=(4-jb.length%4)%4,bp=(4-b.length%4)%4,L=12+8+jb.length+pad+8+b.length+bp,o=new Uint8Array(L);let k=0;o.set(encode("glTF"),k);k+=4;w32(o,k,2);k+=4;w32(o,k,L);k+=4;w32(o,k,jb.length+pad);k+=4;w32(o,k,0x4e4f534a);k+=4;o.set(jb,k);k+=jb.length;for(let i=0;i<pad;i++)o[k++]=32;w32(o,k,b.length+bp);k+=4;w32(o,k,0x004e4942);k+=4;o.set(b,k);k+=b.length;while(k<L)o[k++]=0;return o;
}

function check(aBytes,bBytes,pose){
let a=parse(aBytes),b=parse(bBytes);if(JSON.stringify(a.j.materials)!==JSON.stringify(b.j.materials)||JSON.stringify(a.j.extensions)!==JSON.stringify(b.j.extensions)||JSON.stringify(a.j.animations)!==JSON.stringify(b.j.animations))throw Error("Frozen materials/animation changed");
let n1=a.j.nodes.map(x=>x.mesh===6?{...x,name:"HAIR"}:x),n2=b.j.nodes.map(x=>x.mesh===6?{...x,name:"HAIR"}:x);if(JSON.stringify(n1)!==JSON.stringify(n2))throw Error("Nodes anchors drift");
let count=0,arrays=0,samples=0;for(let i=0;i<a.j.meshes.length;i++){if(i===6)continue;let u=a.j.meshes[i].primitives[0],v=b.j.meshes[i].primitives[0];if(JSON.stringify(u)!==JSON.stringify(v))throw Error("nonhair primitive "+i);for(let k of ["POSITION","NORMAL"]){if(!equal(raw(a,u.attributes[k]),raw(b,v.attributes[k])))throw Error("nonhair attr "+i);arrays++;}if(!equal(raw(a,u.indices),raw(b,v.indices)))throw Error("indices "+i);arrays++;count++;}
let u=a.j.meshes[6].primitives[0],v=b.j.meshes[6].primitives[0];if(!equal(raw(a,u.indices),raw(b,v.indices)))throw Error("Hair indices drift");
for(let key of ["POSITION","NORMAL"]){let x=raw(a,u.attributes[key]),y=raw(b,v.attributes[key]);if(!equal(x.subarray(897*12,1105*12),y.subarray(897*12,1105*12)))throw Error("Brow drift");}
for(let clip of a.j.animations)for(let samp of clip.samplers)for(let key of ["input","output"]){if(!equal(raw(a,samp[key]),raw(b,samp[key])))throw Error("Animation drift");samples++;}
return{pose,bytes:bBytes.length,nonhairMeshesExact:count,nonhairArraysExact:arrays,animationSamplerArraysExact:samples,meshCount:b.j.meshes.length,materialCount:b.j.materials.length,vertices:pose==="cross"?9469:9485,triangles:pose==="cross"?18380:18420};
}
const pose=process.argv[2];if(!["cross","kneel"].includes(pose))throw Error("Usage: node build_male_sidepart73_p07b.mjs cross|kneel");
const path=new URL("../p6c/meditator_male_"+pose+"_prayer_p06c.glb",import.meta.url),data=new Uint8Array(fs.readFileSync(path));
if(crypto.createHash("sha256").update(data).digest("hex")!==SOURCE_SHA[pose])throw Error("P06c SHA mismatch");
const hair=stylize(parse(data)),b=exportGLB(parse(data),hair,pose),proof=check(data,b,pose);
fs.writeFileSync(new URL("./meditator_male_"+pose+"_prayer_sidepart73_p07b.glb",import.meta.url),b);
console.log(JSON.stringify({...proof,sha256:crypto.createHash("sha256").update(b).digest("hex"),zones:hair.zone},null,2));
