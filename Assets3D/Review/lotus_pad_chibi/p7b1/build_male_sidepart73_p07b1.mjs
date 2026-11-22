/* Original P07B1 procedural hairstyle revision: SHA-pinned P06c -> integrated 7/3 cap sculpt.
 Removable legacy ribbon geometry: 960 detached-looking triangles not drawn, no new materials.
 Right (+X) part, broad forelock left (-X); immutable eyebrow/body/animations/anchors. 0 VND.
 Cycles must be performed by owner Windows Blender, NOT falsely claimed here. */
import fs from 'node:fs';import crypto from 'node:crypto';
const SOURCE_SHA={"cross":"c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4","kneel":"38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad"};
function enc(s){let b=[];for(let i=0;i<s.length;i++){let c=s.codePointAt(i);if(c>65535)i++;if(c<128)b.push(c);else if(c<2048)b.push(192|c>>6,128|c&63);else if(c<65536)b.push(224|c>>12,128|c>>6&63,128|c&63);else b.push(240|c>>18,128|c>>12&63,128|c>>6&63,128|c&63);}return new Uint8Array(b);}

function dec(b){let s="";for(let i=0;i<b.length;i++){let c=b[i];if(c<128){s+=String.fromCharCode(c);continue;}let p;if(c<224)p=(c&31)<<6|(b[++i]&63);else if(c<240)p=(c&15)<<12|(b[++i]&63)<<6|(b[++i]&63);else p=(c&7)<<18|(b[++i]&63)<<12|(b[++i]&63)<<6|(b[++i]&63);s+=String.fromCodePoint(p);}return s;}

function rd(b,i){return(b[i]|b[i+1]<<8|b[i+2]<<16|b[i+3]<<24)>>>0;}

function wr(b,i,v){b[i]=v&255;b[i+1]=v>>>8&255;b[i+2]=v>>>16&255;b[i+3]=v>>>24&255;}

function parse(b){if(dec(b.subarray(0,4))!=="glTF"||rd(b,4)!==2||rd(b,8)!==b.length)throw Error("Bad GLB2");const n=rd(b,12),j=JSON.parse(dec(b.subarray(20,20+n))),o=20+n;if(rd(b,o+4)!==0x004e4942)throw Error("No BIN");return {j,bin:b.subarray(o+8,o+8+rd(b,o))};}

function raw(m,id){const a=m.j.accessors[id],v=m.j.bufferViews[a.bufferView],s=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type]||0)*({5126:4,5125:4,5123:2,5121:1}[a.componentType]||0),k=(v.byteOffset||0)+(a.byteOffset||0);if(!s)throw Error("Unknown component");return m.bin.subarray(k,k+a.count*s);}

function arr(m,id){const a=m.j.accessors[id],x=raw(m,id),d=new DataView(x.buffer,x.byteOffset),o=[];for(let i=0;i<a.count*(a.type==="VEC3"?3:1);i++)o.push(a.componentType===5126?d.getFloat32(i*4,true):d.getUint32(i*4,true));return o;}

function equal(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;}

function sm(x){const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);}

function normals(p,f){let x=new Float64Array(p.length);for(let i=0;i<f.length;i+=3){let a=3*f[i],b=3*f[i+1],c=3*f[i+2],ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];for(let k of [a,b,c])for(let t=0;t<3;t++)x[k+t]+=n[t];}let y=[];for(let i=0;i<x.length;i+=3){let d=Math.hypot(x[i],x[i+1],x[i+2])||1;for(let t=0;t<3;t++)y.push(x[i+t]/d);}return y;}

function sculpt(m){
 let hp=m.j.meshes[6].primitives[0],p=arr(m,hp.attributes.POSITION),old=p.slice(),oldN=arr(m,hp.attributes.NORMAL),indices=arr(m,hp.indices);
 if(m.j.meshes[6].name!=="hair_neat_male_scalp_coverage_p06c_mesh"||p.length!==5016||indices.length!==9240)throw Error("Requires original P06c mesh 6");
 const C=[0,.85,.005],part=z=>.091+.031*sm((.155-z)/.36),g=(x,w)=>Math.exp(-Math.pow(x/w,2)),unit=x=>{const a=Math.hypot(...x)||1;return x.map(q=>q/a);},changes=[];
 for(let i=0;i<841;i++){
  const k=i*3,q=old.slice(k,k+3),[x,y,z]=q,d=unit(q.map((v,t)=>v-C[t])),off=part(z),F=sm((z+.2)/.43),U=sm((y-.984)/.15),crown=sm((y-1.032)/.095),major=1-sm((x-off+.023)/.075),minor=1-major;
  const lift=Math.max(-.0044,.029*crown*F*major+.005*crown*F*minor+.020*g(x-(off-.117),.133)*U*F*major-.0046*g(x-off,.023)*U*F+.014*g(x-(off-.049),.067)*U*F*major-.0045*sm((Math.abs(x)-.225)/.082)*(1-sm((y-.97)/.10))-.003*sm((-z-.18)/.13)*(1-sm((y-.90)/.12)));
  const rim=sm((1.075-y)/.143)*sm((Math.hypot(x,z-.005)-.16)/.115)*sm((z-.06)/.20),main=g(x+.135,.145)*major,opposite=g(x-.134,.105)*minor;
  for(let t=0;t<3;t++)p[k+t]+=d[t]*lift;
  p[k]-=.028*U*F*major*g(x+.04,.27);p[k+1]+=-.049*rim*main+.009*rim*opposite;p[k+2]+=.013*rim*main;
  changes[i]=[p[k]-q[0],p[k+1]-q[1],p[k+2]-q[2]];
 }
 for(let i=0;i<56;i++)for(let k=0;k<3;k++)p[(841+i)*3+k]+=changes[1+14*56+i][k];
 const kept=indices.slice(0,6360);if(kept.some(i=>i>=1105)||indices.slice(6360).some(i=>i<1105))throw Error("Three distinct strips were not isolated in original index tail");
 let n=normals(p,kept);for(let i=897;i<1672;i++)for(let k=0;k<3;k++)n[i*3+k]=oldN[i*3+k];
 const zones={major:q=>q[0]<.055&&q[1]>1.055&&q[2]>-.11,minor:q=>q[0]>.145&&q[1]>1.04&&q[2]>-.11,part:q=>Math.abs(q[0]-part(q[2]))<.03&&q[1]>1.04&&q[2]>-.12,fringe:q=>q[2]>.21&&q[1]<1.015&&q[0]<.08&&q[0]>-.26};
 let zone={};for(let[name,fn]of Object.entries(zones)){let arr=[];for(let i=0;i<841;i++){let q=old.slice(3*i,3*i+3);if(fn(q))arr.push({dY:(p[3*i+1]-q[1])*1000,r:(Math.hypot(...p.slice(3*i,3*i+3).map((v,j)=>v-C[j]))-Math.hypot(...q.map((v,j)=>v-C[j])))*1000});}zone[name]={samples:arr.length,meanYmm:arr.length?arr.reduce((a,b)=>a+b.dY,0)/arr.length:null,meanRadialMm:arr.length?arr.reduce((a,b)=>a+b.r,0)/arr.length:null,minYmm:arr.length?Math.min(...arr.map(x=>x.dY)):null};}
 return{p,n,indices:kept,zone};
}

function exportGLB(m,shape,pose){
 let j=m.j,bin=m.bin.slice(),d=new DataView(bin.buffer),hp=j.meshes[6].primitives[0];
 for(let[id,values]of[[hp.attributes.POSITION,shape.p],[hp.attributes.NORMAL,shape.n]]){let a=j.accessors[id],v=j.bufferViews[a.bufferView],o=(v.byteOffset||0)+(a.byteOffset||0);if(a.count!==1672||a.componentType!==5126)throw Error("Wrong vertex accessor");for(let i=0;i<values.length;i++)d.setFloat32(o+i*4,values[i],true);}
 let a=j.accessors[hp.attributes.POSITION],mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];for(let i=0;i<shape.p.length;i+=3)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],shape.p[i+k]);mx[k]=Math.max(mx[k],shape.p[i+k]);}a.min=mn;a.max=mx;
 let ix=j.accessors[hp.indices];if(ix.count!==9240||ix.componentType!==5125)throw Error("Hair index format");ix.count=6360;
 j.meshes[6].name="hair_male_sidepart73_integrated_p07b1_mesh";j.nodes.find(n=>n.mesh===6).name="hair_male_sidepart73_integrated_p07b1_object";
 j.extras.P07b1={revision:"p7b1",original:"P06c",sourceSHA256:SOURCE_SHA[pose],hairOnly:true,removedDetachedRibbonTriangles:960,partSide:"right +X, major left -X",gate:"P07B_SIDE_PART_73_ART_REVISION_REQUIRED"};
 let js=enc(JSON.stringify(j)),pad=(4-js.length%4)%4,bpad=(4-bin.length%4)%4,len=12+8+js.length+pad+8+bin.length+bpad,b=new Uint8Array(len),o=0;b.set(enc("glTF"),o);o+=4;wr(b,o,2);o+=4;wr(b,o,len);o+=4;wr(b,o,js.length+pad);o+=4;wr(b,o,0x4e4f534a);o+=4;b.set(js,o);o+=js.length;for(let i=0;i<pad;i++)b[o++]=32;wr(b,o,bin.length+bpad);o+=4;wr(b,o,0x004e4942);o+=4;b.set(bin,o);o+=bin.length;while(o<len)b[o++]=0;return b;
}

function compare(orig,current,pose){
 const a=parse(orig),b=parse(current);if(JSON.stringify(a.j.materials)!==JSON.stringify(b.j.materials)||JSON.stringify(a.j.extensions)!==JSON.stringify(b.j.extensions)||JSON.stringify(a.j.animations)!==JSON.stringify(b.j.animations))throw Error("Frozen material/animation drift");
 let na=a.j.nodes.map(x=>x.mesh===6?{...x,name:"hair"}:x),nb=b.j.nodes.map(x=>x.mesh===6?{...x,name:"hair"}:x);if(JSON.stringify(na)!==JSON.stringify(nb))throw Error("Frozen node transforms drift");
 let non=0,num=0,samples=0;for(let i=0;i<a.j.meshes.length;i++){if(i===6)continue;let x=a.j.meshes[i].primitives[0],y=b.j.meshes[i].primitives[0];if(JSON.stringify(x)!==JSON.stringify(y))throw Error("Protected primitive changed");for(let key of ["POSITION","NORMAL"]){if(!equal(raw(a,x.attributes[key]),raw(b,y.attributes[key])))throw Error("Protected attr "+i);num++;}if(!equal(raw(a,x.indices),raw(b,y.indices)))throw Error("Protected indices "+i);num++;non++;}
 const x=a.j.meshes[6].primitives[0],y=b.j.meshes[6].primitives[0],i0=arr(a,x.indices),i1=arr(b,y.indices);if(i0.length!==9240||i1.length!==6360||!equal(i0.slice(0,6360),i1))throw Error("Incorrect ribbon removal");
 for(let field of ["POSITION","NORMAL"]){let p=raw(a,x.attributes[field]),q=raw(b,y.attributes[field]);if(!equal(p.subarray(897*12,1105*12),q.subarray(897*12,1105*12)))throw Error("Brow byte drift");if(!equal(p.subarray(1105*12),q.subarray(1105*12)))throw Error("Unused old ribbon vertices altered");}
 for(let anim of a.j.animations)for(let s of anim.samplers)for(let field of ["input","output"]){if(!equal(raw(a,s[field]),raw(b,s[field])))throw Error("Animation samples drift");samples++;}
 const six=b.j.extensions.KHR_materials_variants.variants.map(x=>x.name);if(six.join("|")!=="pastel_lilac|blush_rose|sage_green|sky_blue|warm_cream|terracotta")throw Error("Variants drift");
 for(let anim of b.j.animations)for(let s of anim.samplers)if(b.j.accessors[s.input].count!==17)throw Error("17 keys fail");
 return {pose,bytes:current.length,nonHairMeshesExact:non,nonHairAccessorArraysExact:num,nativeSamplerArraysExact:samples,hairTriangles:2120,removedRibbonTriangles:960,totalTriangles:pose==="cross"?17420:17460,vertices:pose==="cross"?9469:9485,meshes:b.j.meshes.length,materials:b.j.materials.length,eyeBrow208Frozen:true,anchorsFrozen:true,drawcallDelta:0};
}
const pose=process.argv[2];if(!['cross','kneel'].includes(pose))throw Error('Usage: node build_male_sidepart73_p07b1.mjs cross|kneel');
const input=new Uint8Array(fs.readFileSync(new URL('../p6c/meditator_male_'+pose+'_prayer_p06c.glb',import.meta.url)));
if(crypto.createHash('sha256').update(input).digest('hex')!==SOURCE_SHA[pose])throw Error('P06c source SHA mismatch');
const shape=sculpt(parse(input)),out=exportGLB(parse(input),shape,pose),proof=compare(input,out,pose);
fs.writeFileSync(new URL('./meditator_male_'+pose+'_prayer_sidepart73_p07b1.glb',import.meta.url),out);
console.log(JSON.stringify({...proof,sha256:crypto.createHash('sha256').update(out).digest('hex'),geometry:shape.zone},null,2));
