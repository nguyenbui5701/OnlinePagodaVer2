// Original procedurally authored botanical art for OnlinePagodaVer2 P0.12-B.
// Run: node build_p012b_assets.mjs (Node >=20). No npm deps. License: MIT.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const rawModels=(function makeAssets() {
  const PI=Math.PI,TAU=2*PI;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  function tint(a,b,t){return [mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t),1]}
  function makeGroup(){return {positions:[],colors:[],indices:[]}}
  function addPoint(g,p,c){const i=g.positions.length/3;g.positions.push(p[0],p[1],p[2]);g.colors.push(...c);return i}
  function addGrid(g,rows,cols,fn,flip){
    const ids=[];
    for(let i=0;i<=rows;i++){const r=[];for(let j=0;j<=cols;j++){
      const t=i/rows,s=2*j/cols-1,z=fn(t,s);
      r.push(addPoint(g,z.p,z.c))
    }ids.push(r)}
    for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
      const a=ids[i][j], b=ids[i+1][j],c=ids[i][j+1],d=ids[i+1][j+1];
      if(flip){g.indices.push(a,b,c,b,d,c)}else{g.indices.push(a,c,b,b,c,d)}
    }
  }
  function addTube(g,y0,y1,r0,r1,segments,col){
    const base=g.positions.length/3;
    for(let k=0;k<=1;k++)for(let i=0;i<segments;i++){
      const a=TAU*i/segments, r=k?r1:r0;
      addPoint(g,[r*Math.cos(a),k?y1:y0,r*Math.sin(a)],col)
    }
    for(let i=0;i<segments;i++){
      const j=(i+1)%segments,a=base+i,b=base+segments+i,c=base+j,d=base+segments+j;
      g.indices.push(a,b,c,b,d,c)
    }
  }
  function addDome(g,rings,seg,radius,y,height,col){
    const base=g.positions.length/3;
    for(let k=0;k<=rings;k++){
      const t=k/rings,rad=radius*Math.sqrt(Math.max(.0002,1-t*t));
      for(let i=0;i<seg;i++){const th=TAU*i/seg;addPoint(g,[rad*Math.cos(th),y+height*t,rad*Math.sin(th)],col)}
    }
    for(let k=0;k<rings;k++)for(let i=0;i<seg;i++){
      const a=base+k*seg+i,b=base+(k+1)*seg+i,c=base+k*seg+(i+1)%seg,d=base+(k+1)*seg+(i+1)%seg;
      g.indices.push(a,c,b,b,c,d)
    }
  }
  function one(kind,lod){
    const quality=lod==="quality";
    const groups={petal:makeGroup(),green:makeGroup(),gold:makeGroup()};
    const p=groups.petal,g=groups.green,gold=groups.gold;
    if(kind==="bloom"){
      const rings=quality?[
        {n:8,start:.046,len:.155,w:.064,y:.198,tip:.295,phase:.11},
        {n:10,start:.060,len:.246,w:.079,y:.188,tip:.265,phase:.29},
        {n:11,start:.071,len:.306,w:.081,y:.170,tip:.196,phase:.07}
      ]:[
        {n:8,start:.047,len:.196,w:.077,y:.187,tip:.275,phase:.11},
        {n:9,start:.066,len:.306,w:.087,y:.170,tip:.208,phase:.29}
      ];
      for(let ri=0;ri<rings.length;ri++){
        const R=rings[ri];
        for(let k=0;k<R.n;k++){
          const theta=TAU*(k+R.phase)/R.n,dx=Math.cos(theta),dz=Math.sin(theta), tx=-dz,tz=dx;
          const variation=((k*7+ri*3)%5-2)*.002;
          addGrid(p,quality?6:4,quality?4:3,(t,s)=>{
            const w=R.w*Math.pow(Math.sin(PI*t),.78)*(.87+.13*t);
            const radial=R.start+R.len*t;
            const side=s*w;
            const y=mix(R.y,R.tip,t)+.022*s*s*Math.sin(PI*t)-.026*Math.sin(PI*t)+variation*t;
            const tipInk=clamp((t-.27)/.73,0,1);
            const c=tint([.985,.94,.925],[.90,.64,.72],.13+.72*tipInk+.08*Math.abs(s));
            return {p:[radial*dx+side*tx,y,radial*dz+side*tz],c}
          },false)
        }
      }
      addTube(g,0,.180,.021,.025,quality?16:10,[.30,.44,.29,1]);
      for(let k=0,n=quality?8:6;k<n;k++){
        const th=TAU*k/n;
        addGrid(g,3,2,(t,s)=>{
          const r=.024+.118*t,lat=.028*s*Math.sin(PI*t);
          return {p:[r*Math.cos(th)-lat*Math.sin(th),.169+.030*t+.009*s*s,r*Math.sin(th)+lat*Math.cos(th)],c:[.34,.49,.33,1]}
        },false)
      }
      addDome(gold,quality?6:4,quality?16:10,.063,.193,.050,[.96,.70,.30,1]);
      for(let k=0,n=quality?16:9;k<n;k++){
        const a=TAU*k/n, r=.065;
        const x=r*Math.cos(a),z=r*Math.sin(a);
        const kbase=gold.positions.length/3, sz=quality?.005:.006;
        addPoint(gold,[x-sz,.227,z],[.98,.74,.37,1]);
        addPoint(gold,[x+sz,.229,z],[.98,.74,.37,1]);
        addPoint(gold,[x,.269+(k%3)*.004,z],[.98,.84,.48,1]);
        gold.indices.push(kbase,kbase+1,kbase+2)
      }
    } else {
      addTube(g,0,.317,.016,.021,quality?16:10,[.31,.43,.30,1]);
      const layers=quality?[{n:9,offset:0,delta:0,span:.46},{n:5,offset:.27,delta:-.011,span:.36}]:[{n:7,offset:0,delta:0,span:.51}];
      for(let l=0;l<layers.length;l++){
        const L=layers[l];
        for(let k=0;k<L.n;k++){
          const theta=TAU*(k+L.offset)/L.n;
          addGrid(p,quality?6:4,quality?3:2,(t,s)=>{
            const ang=theta+s*L.span*(1-.28*t),rr=.031+.119*Math.pow(Math.sin(PI*t),.80)-.010*t+L.delta;
            const y=.302+.332*t-.013*s*s*Math.sin(PI*t)+.003*(k%3)*Math.sin(PI*t);
            const c=tint([.96,.89,.86],[.89,.54,.65],.28+.60*t+.06*Math.abs(s)+.035*(k%3));
            return {p:[rr*Math.cos(ang),y,rr*Math.sin(ang)],c}
          },true)
        }
      }
      for(let k=0,n=quality?7:5;k<n;k++){
        const a=TAU*k/n;
        addGrid(g,quality?4:3,2,(t,s)=>{
          const r=.020+.108*Math.sin(PI*(.12+.74*t)),ang=a+s*.36*(1-.35*t);
          const y=.308+.138*t-.015*s*s*Math.sin(PI*t);
          return {p:[r*Math.cos(ang),y,r*Math.sin(ang)],c:[.35+.04*t,.52+.03*t,.34,1]}
        },true)
      }
    }
    function calculateNormals(group){
      const n=group.positions.length/3,ns=new Float64Array(n*3);
      for(let i=0;i<group.indices.length;i+=3){
        const a=group.indices[i],b=group.indices[i+1],c=group.indices[i+2],v=group.positions;
        const ax=v[3*b]-v[3*a],ay=v[3*b+1]-v[3*a+1],az=v[3*b+2]-v[3*a+2];
        const bx=v[3*c]-v[3*a],by=v[3*c+1]-v[3*a+1],bz=v[3*c+2]-v[3*a+2];
        const x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;
        for(const q of [a,b,c]){ns[3*q]+=x;ns[3*q+1]+=y;ns[3*q+2]+=z}
      }
      const out=[];for(let i=0;i<n;i++){const x=ns[3*i],y=ns[3*i+1],z=ns[3*i+2],d=Math.hypot(x,y,z)||1;out.push(x/d,y/d,z/d)}return out
    }
    const ordered=Object.entries(groups).filter(([name,group])=>group.indices.length);
    let bin=[],views=[],acc=[],meshPrims=[],mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
    const writeU16=(v)=>{bin.push(v&255,(v>>8)&255)};
    const writeF32=(v)=>{const a=new ArrayBuffer(4);new DataView(a).setFloat32(0,v,true);const q=new Uint8Array(a);bin.push(q[0],q[1],q[2],q[3])};
    const align=()=>{while(bin.length%4)bin.push(0)};
    function makeView(write,len,target){
      align();const offset=bin.length;write();const i=views.length;views.push({buffer:0,byteOffset:offset,byteLength:bin.length-offset,...(target?{target}:{})});return i
    }
    function makeAccessor(view,ct,n,type,ex){
      const i=acc.length;acc.push({bufferView:view,componentType:ct,count:n,type,...(ex||{})});return i
    }
    const materialData=[
      {name:"P012B_Petals_Ivory_Blush",pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:.78},doubleSided:true},
      {name:"P012B_Muted_Green",pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:.82},doubleSided:true},
      {name:"P012B_Warm_Gold_Center",pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:.73},doubleSided:true}
    ];
    const materials=[];
    let totalTri=0,totalVerts=0;
    for(const [name,group] of ordered){
      const n=group.positions.length/3,normals=calculateNormals(group);
      const localMin=[Infinity,Infinity,Infinity],localMax=[-Infinity,-Infinity,-Infinity];
      for(let j=0;j<n;j++)for(let k=0;k<3;k++){
        const v=Math.fround(group.positions[3*j+k]);
        localMin[k]=Math.min(localMin[k],v);localMax[k]=Math.max(localMax[k],v);
        mins[k]=Math.min(mins[k],v);maxs[k]=Math.max(maxs[k],v)
      }
      const vPos=makeView(()=>{for(const f of group.positions)writeF32(f)},n*12,34962);
      const vNor=makeView(()=>{for(const f of normals)writeF32(f)},n*12,34962);
      const vCol=makeView(()=>{for(const f of group.colors)bin.push(Math.round(clamp(f,0,1)*255))},n*4,34962);
      const vIdx=makeView(()=>{for(const k of group.indices)writeU16(k)},group.indices.length*2,34963);
      const ai=makeAccessor(vPos,5126,n,"VEC3",{min:localMin,max:localMax});
      const an=makeAccessor(vNor,5126,n,"VEC3");
      const ac=makeAccessor(vCol,5121,n,"VEC4",{normalized:true});
      const ix=makeAccessor(vIdx,5123,group.indices.length,"SCALAR");
      const mi=materials.length;materials.push(materialData[name==="petal"?0:name==="green"?1:2]);
      meshPrims.push({attributes:{POSITION:ai,NORMAL:an,COLOR_0:ac},indices:ix,material:mi,mode:4});
      totalTri+=group.indices.length/3;totalVerts+=n
    }
    align();
    const id=`lotus_${kind}_p012b`;
    const gltf={asset:{version:"2.0",generator:"OnlinePagodaVer2 P012B original procedural botanical art"},scene:0,scenes:[{nodes:[0]}],nodes:[{name:id+"_root",mesh:0}],meshes:[{name:id+"_"+lod,primitives:meshPrims}],materials,accessors:acc,bufferViews:views,buffers:[{byteLength:bin.length}],extras:{up:"+Y",metersPerUnit:1,waterlineY:0,rootAtWaterline:[0,0,0],revision:"p012b"}};
    const json=JSON.stringify(gltf);
    const jBytes=[];for(let i=0;i<json.length;i++)jBytes.push(json.charCodeAt(i));while(jBytes.length%4)jBytes.push(32);
    const size=12+8+jBytes.length+8+bin.length;
    const out=new Uint8Array(size);const d=new DataView(out.buffer);
    d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,size,true);
    d.setUint32(12,jBytes.length,true);d.setUint32(16,0x4e4f534a,true);
    out.set(jBytes,20);const off=20+jBytes.length;
    d.setUint32(off,bin.length,true);d.setUint32(off+4,0x004e4942,true);out.set(bin,off+8);
    return {name:`${id}_${lod}.glb`,bytes:out,stats:{assetId:id,kind,lod,bytes:out.length,triangles:totalTri,vertices:totalVerts,meshCount:1,primitiveCount:meshPrims.length,materials:materials.length,textureCount:0,boundsMinMaxMeters:[mins,maxs],boundsMeters:maxs.map((v,i)=>v-mins[i]),originMeters:[0,0,0],upAxis:"+Y",waterlineY:0,doubleSided:true,hasVertexColor:true,animations:[],cameras:0,lights:0}}
  }
  return [one("bloom","quality"),one("bloom","eco"),one("bud","quality"),one("bud","eco")];
})();
// Resolve collapsed tip-grid triangles deterministically, then recompute normals + accessors.
const models=rawModels.map((function patchBloomGLB(m){
  if(!m.name.startsWith("lotus_bloom_"))return m;
  const original=m.bytes,hd=new DataView(original.buffer,original.byteOffset,original.byteLength),jlen=hd.getUint32(12,true);
  const json=JSON.parse(String.fromCharCode(...original.slice(20,20+jlen)).trim()),base=20+jlen+8;
  const positions=json.accessors[json.meshes[0].primitives[0].attributes.POSITION],normals=json.accessors[json.meshes[0].primitives[0].attributes.NORMAL],ix=json.accessors[json.meshes[0].primitives[0].indices];
  const posOffset=base+json.bufferViews[positions.bufferView].byteOffset,norOffset=base+json.bufferViews[normals.bufferView].byteOffset,idxOffset=base+json.bufferViews[ix.bufferView].byteOffset;
  const quality=m.name.includes("_quality"),rows=quality?6:4,cols=quality?4:3,per=(rows+1)*(cols+1);
  if(positions.count%per!==0)throw Error("unexpected bloom topology "+m.name);
  for(let petal=0;petal<positions.count/per;petal++)for(const row of [0,rows]){
    const start=petal*per+row*(cols+1),x=hd.getFloat32(posOffset+start*12,true),z=hd.getFloat32(posOffset+start*12+8,true),r=Math.hypot(x,z);
    if(r<.01)throw Error("invalid tip radial center");
    for(let k=0;k<=cols;k++){
      const s=2*k/cols-1,at=posOffset+(start+k)*12,delta=.0025*s;
      hd.setFloat32(at,x-delta*z/r,true);hd.setFloat32(at+8,z+delta*x/r,true)
    }
  }
  const accum=new Float64Array(positions.count*3);
  function pos(i){const o=posOffset+12*i;return [hd.getFloat32(o,true),hd.getFloat32(o+4,true),hd.getFloat32(o+8,true)]}
  for(let i=0;i<ix.count;i+=3){const ia=hd.getUint16(idxOffset+i*2,true),ib=hd.getUint16(idxOffset+(i+1)*2,true),ic=hd.getUint16(idxOffset+(i+2)*2,true);
    const a=pos(ia),b=pos(ib),c=pos(ic),u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const no=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    if(Math.hypot(...no)<1e-9)throw Error("degenerate after tip patch "+m.name+" triangle "+i/3);
    for(const k of [ia,ib,ic])for(let h=0;h<3;h++)accum[3*k+h]+=no[h]
  }
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.count;i++){
    const v=pos(i),ns=accum.slice(3*i,3*i+3),length=Math.hypot(...ns)||1;
    for(let h=0;h<3;h++){hd.setFloat32(norOffset+12*i+4*h,ns[h]/length,true);lo[h]=Math.min(lo[h],v[h]);hi[h]=Math.max(hi[h],v[h])}
  }
  positions.min=lo;positions.max=hi;
  const allPos=json.meshes[0].primitives.map(p=>json.accessors[p.attributes.POSITION]),mins=[0,1,2].map(k=>Math.min(...allPos.map(a=>a.min[k]))),maxs=[0,1,2].map(k=>Math.max(...allPos.map(a=>a.max[k])));
  const txt=JSON.stringify(json),jb=[];for(let i=0;i<txt.length;i++)jb.push(txt.charCodeAt(i));while(jb.length%4)jb.push(32);
  const bb=original.slice(base,base+json.buffers[0].byteLength),total=12+8+jb.length+8+bb.length,final=new Uint8Array(total),dd=new DataView(final.buffer);
  dd.setUint32(0,0x46546c67,true);dd.setUint32(4,2,true);dd.setUint32(8,total,true);dd.setUint32(12,jb.length,true);dd.setUint32(16,0x4e4f534a,true);
  final.set(jb,20);const bo=20+jb.length;dd.setUint32(bo,bb.length,true);dd.setUint32(bo+4,0x004e4942,true);final.set(bb,bo+8);
  m.bytes=final;m.stats.bytes=total;m.stats.boundsMinMaxMeters=[mins,maxs];m.stats.boundsMeters=maxs.map((v,i)=>v-mins[i]);
  return m
}));
const dest=path.dirname(fileURLToPath(import.meta.url));
for(const m of models){const f=path.join(dest,m.name);fs.writeFileSync(f,m.bytes);console.log(JSON.stringify({...m.stats,filename:m.name,sha256:crypto.createHash('sha256').update(m.bytes).digest('hex')}));}
