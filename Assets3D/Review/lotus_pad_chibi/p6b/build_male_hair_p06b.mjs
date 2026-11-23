/*
AI Visual 11 — P0.6b: hair-only sculpt from exact MALE P0.6a GLB
Node.js >=22, no paid models, no external packages.
Input SHA pin: male cross c684934f..., male kneel 9aad5f3f....
Only glTF mesh index 6 POSITION/NORMAL/INDICES changed; all other primitive
accessor bytes, 21 materials, 6 native KHR variants, animations and anchors frozen.
The 2 eyebrow tubes within the original hair primitive are vertex/normal/face-
index byte-identical. New three rounded directional hair layers (open surfaces
whose borders lie slightly BELOW the scalp; not floating ribbons).
Run: node build_male_hair_p06b.mjs ../p6a/meditator_male_cross_prayer_p06a.glb cross
     node build_male_hair_p06b.mjs ../p6a/meditator_male_kneel_prayer_p06a.glb kneel
*/
const EXPECTED={
cross:"c684934ff2ceb8da08265fcc8304f2684255f144dc7df94819f007c5e803cb61",
kneel:"9aad5f3f4d1b84d0a9ffb2cda3bc01b39ece676318ba883e417f7337e9d2251e"
};
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
function gauss(x,w){let q=x/w;return Math.exp(-q*q);}
function shellWarp(x,y,z){
 // Exact P0.6a cap world basis. All offsets are sculpt in METERS.
 const cy=.85,cz=.005,rx=.309,ry=.305,rz=.298;
 const front=smooth((z-.045)/.23),back=smooth((-.05-z)/.19);
 const side=Math.min(1,Math.abs(x)/.32),rim=1-smooth((y-.855)/.125),top=smooth((y-.942)/.175);
 // Hairstyle: asymmetrical off-center part on actor +X, three broad directional swells.
 const flow=x+.48*(z-.07); // flows diagonally from +X crown to -X fringe
 const streakGate=top*smooth((z+.11)/.17);
 const grooves=(-.011*gauss(flow-.145,.030)+.006*gauss(flow-.038,.058)
 +.007*gauss(flow+.115,.065)-.004*gauss(flow+.215,.045))*streakGate;
 // NONuniform hairline: part rises slightly, sweep comes down soft toward left,
 // temple/ear clearance lifts, rear nape center dips just a few mm.
 const hairlineFront=front*rim*(.023*gauss(x-.172,.063)-.023*gauss(x+.115,.135)+.004*x/.32);
 const earClearance=.028*rim*(1-front)*(1-back)*smooth((Math.abs(x)-.21)/.09);
 const taperedNape=back*rim*(.042*smooth((Math.abs(x)-.07)/.22)-.011*gauss(x,.115));
 // Directional top biased gently toward viewer left; slight vertical flattening.
 const shiftX=-.010*top*smooth((z+.09)/.28);
 const shiftY=hairlineFront+earClearance+taperedNape-.003*top;
 const norm=[x/(rx*rx),(y-cy)/(ry*ry),(z-cz)/(rz*rz)];
 const mag=Math.hypot(...norm)||1;
 return[x+shiftX+norm[0]/mag*grooves,y+shiftY+norm[1]/mag*grooves,z+norm[2]/mag*grooves];
}
function newHair(j,bin){
 const pr=j.meshes[6].primitives[0];
 if(j.meshes[6].name!=="hair_neat_male_sidepart_p06a_mesh")throw Error("HAIR MESH REFERENCE NOT P06A");
 const oldPos=readAcc(j,bin,pr.attributes.POSITION),oldNor=readAcc(j,bin,pr.attributes.NORMAL),oldFaces=readAcc(j,bin,pr.indices);
 const originalHairVertexCount=oldPos.length/3,originalHairTriangles=oldFaces.length/3;
 const EXPECT=1105, CAPCOUNT=897, BROWCOUNT=208,CAPTRI=1736;
 if(originalHairVertexCount!==EXPECT||oldFaces.length!==2120*3||oldFaces.slice(CAPTRI*3).some(i=>i<CAPCOUNT))throw Error("P06a original cap/eyebrow topology mismatch");
 let pos=oldPos.slice(),faces=oldFaces.slice(),changed=0;
 // Sculpt shell 0..840. The cap lips 841..896 follow their corresponding rim.
 for(let i=0;i<841;i++){let at=i*3,q=shellWarp(pos[at],pos[at+1],pos[at+2]);if(q.some((v,k)=>Math.abs(v-pos[at+k])>1e-7))changed++;pos[at]=q[0];pos[at+1]=q[1];pos[at+2]=q[2];}
 for(let i=841;i<CAPCOUNT;i++){let corresponding=1+(15-1)*56+(i-841),at=i*3,base=corresponding*3;
 let dx=oldPos[at]-oldPos[base],dy=oldPos[at+1]-oldPos[base+1],dz=oldPos[at+2]-oldPos[base+2];
 pos[at]=pos[base]+dx;pos[at+1]=pos[base+1]+dy;pos[at+2]=pos[base+2]+dz;}
 // Exactly three compact, soft, directional OVER-SCALP clumps, not separate ribbons.
 // On each patch, base/edges are hidden 4-6mm below cap; crest emerges 9-14mm.
 // This creates actual profile overlap + shadow seam, even with original hair PBR.
 const clumps=[
 {name:"sweep_main_center",theta0:.22,theta1:1.09,phi0:.27,phi1:1.67,width:.245,height:.016},
 {name:"sweep_left_flow",theta0:.29,theta1:1.13,phi0:1.22,phi1:2.19,width:.205,height:.012},
 {name:"sweep_right_temple",theta0:.38,theta1:1.03,phi0:.02,phi1:1.07,width:.16,height:.011},
 ];
 const L=21,W=9,cy=.85,cz=.005,rx=.309,ry=.305,rz=.298;
 const patches=[],heights=[];
 function addPoint(x,y,z){pos.push(x,y,z);return pos.length/3-1;}
 for(const clump of clumps){
  let grid=[],minH=Infinity,maxH=-Infinity;
  for(let l=0;l<L;l++){
   let t=l/(L-1),theta=clump.theta0+(clump.theta1-clump.theta0)*t;
   let phi0=clump.phi0+(clump.phi1-clump.phi0)*smooth(t);
   let width=clump.width*(.45+.55*Math.sin(Math.PI*t))*(.7+.3*t);
   let row=[];
   for(let k=0;k<W;k++){
    let s=(2*k/(W-1)-1),phi=phi0+width*s,th=theta+.012*s*Math.sin(Math.PI*t);
    let wav=.0020*Math.sin(7*phi+2*th)*Math.sin(th);
    let rad=1.024+wav;
    let x=rx*Math.sin(th)*Math.cos(phi)*rad;
    let y=cy+ry*Math.cos(th);
    let z=cz+rz*Math.sin(th)*Math.sin(phi)*rad;
    let w=smooth(Math.sin(Math.PI*t))*(1-s*s)*(1-s*s);
    let lift=clump.height*w-.0042,base=shellWarp(x,y,z);
    const vec=[x/(rx*rx),(y-cy)/(ry*ry),(z-cz)/(rz*rz)],mag=Math.hypot(...vec)||1;
    // local convex rounded ridge, zero at buried edges and tips.
    row.push(addPoint(base[0]+lift*vec[0]/mag,base[1]+lift*vec[1]/mag,base[2]+lift*vec[2]/mag));
    minH=Math.min(minH,lift);maxH=Math.max(maxH,lift);
   }grid.push(row);
  }
  for(let t=0;t<L-1;t++)for(let k=0;k<W-1;k++){
   let aa=grid[t][k],bb=grid[t+1][k],cc=grid[t][k+1],dd=grid[t+1][k+1];
   const p=aa*3,q=bb*3,r=cc*3;
   let ux=pos[q]-pos[p],uy=pos[q+1]-pos[p+1],uz=pos[q+2]-pos[p+2];
   let vx=pos[r]-pos[p],vy=pos[r+1]-pos[p+1],vz=pos[r+2]-pos[p+2];
   let cx=(pos[p]+pos[q]+pos[r])/3,cyy=(pos[p+1]+pos[q+1]+pos[r+1])/3,czz=(pos[p+2]+pos[q+2]+pos[r+2])/3;
   let outward=(uy*vz-uz*vy)*cx+(uz*vx-ux*vz)*(cyy-.85)+(ux*vy-uy*vx)*(czz-.005);
   if(outward>=0)faces.push(aa,bb,cc,cc,bb,dd);else faces.push(aa,cc,bb,cc,dd,bb);
  }
  patches.push({name:clump.name,vertices:L*W,triangles:2*(L-1)*(W-1),maxRaisedHeightMeters:+maxH.toFixed(6),edgeBurialMeters:+(-minH).toFixed(6),nose:shellWarp(rx*Math.sin(clump.theta1)*Math.cos(clump.phi1),cy+ry*Math.cos(clump.theta1),cz+rz*Math.sin(clump.theta1)*Math.sin(clump.phi1))});
 }
 const freshNormal=normals3(pos,faces);
 // Freeze P06a eyebrows EXACT in both geometry and shading, not just outward silhouette.
 for(let i=CAPCOUNT;i<CAPCOUNT+BROWCOUNT;i++)for(let k=0;k<3;k++)freshNormal[i*3+k]=oldNor[i*3+k];
 return{pos,norm:freshNormal,faces,oldPos,oldNor,oldFaces,metrics:{
  originalHairVertexCount,originalHairTriangles,updatedHairVertexCount:pos.length/3,updatedHairTriangles:faces.length/3,
  patches,capVertexCount:CAPCOUNT,originalEyebrowVerticesPreserved:BROWCOUNT,
  originalEyebrowTrianglesPreserved:originalHairTriangles-CAPTRI,
  eyebrowPositionsBitwiseUnmodified:true,eyebrowNormalsBitwiseUnmodified:true,
  originalEyebrowTriangleIndicesUnmodified:true,changedOriginalCapVertices:changed,
  changeScope:"hair primitive #6 ONLY: sculpted cap/three layered embedded sweeps; eyebrow buffer floats unchanged"
 }};
}
function sculptMaleP06b(bytes,pose){
 if(!["cross","kneel"].includes(pose))throw Error("Expected pose cross|kneel");
 let {j,bin}=parseGLB(bytes);
 if(j.meshes.length!==(pose==="cross"?10:9)||j.materials.length!==21||j.extensions?.KHR_materials_variants?.variants?.length!==6)throw Error("Unexpected canonical P06A");
 const hair=newHair(j,bin),p=j.meshes[6].primitives[0];
 const repl=new Map();
 function patch(id,values){let a=j.accessors[id],v=j.bufferViews[a.bufferView];if(a.byteOffset)throw Error("offset accessor not supported");repl.set(a.bufferView,pack32(values,a.componentType));a.count=values.length/(a.type==="VEC3"?3:1);if(a.type==="VEC3"){let [mn,mx]=bound3(values);a.min=mn;a.max=mx;}else{a.min=[Math.min(...values)];a.max=[Math.max(...values)];}}
 patch(p.attributes.POSITION,hair.pos);patch(p.attributes.NORMAL,hair.norm);patch(p.indices,hair.faces);
 j.meshes[6].name="hair_neat_male_soft_sidepart_p06b_mesh";
 // Hair is the only changed scene object name; hierarchy and transforms intact.
 const hairNode=j.nodes.find(x=>x.mesh===6);if(!hairNode)throw Error("Missing male hair node");
 hairNode.name="hair_neat_male_soft_sidepart_p06b_object";
 j.extras.P06b={revision:"p6b",scope:"hair-primitive-only",sourceSHA256:EXPECTED[pose],
  source:"build_male_hair_p06b.mjs",hairSculpt:"three attached rounded directional sweep groups and shallow main part, naturally tapered temples/nape",
  eyebrowsPreserved:true,otherMeshesAndColorVariantsAndAllClipsAndAnchorsFrozen:true,gate:"P06B_MALE_HAIR_OWNER_REVIEW_REQUIRED"};
 // Same raw FLOAT/INDEX arrays for all other mesh primitive views and animations.
 let bufs=[],size=0;for(let i=0;i<j.bufferViews.length;i++){
 let v=j.bufferViews[i],b=repl.get(i)||bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
 let pad=(4-size%4)%4;if(pad){bufs.push(new Uint8Array(pad));size+=pad;}
 v.byteOffset=size;v.byteLength=b.length;bufs.push(b);size+=b.length;
 }
 let binOut=new Uint8Array(size),off=0;for(let b of bufs){binOut.set(b,off);off+=b.length;}
 j.buffers[0].byteLength=binOut.length;
 let json=encodeUTF8(JSON.stringify(j)),jpad=(4-json.length%4)%4,bpad=(4-binOut.length%4)%4,total=12+8+json.length+jpad+8+binOut.length+bpad;
 let out=new Uint8Array(total),k=0;out.set(encodeUTF8("glTF"),k);k+=4;w32(out,k,2);k+=4;w32(out,k,total);k+=4;
 w32(out,k,json.length+jpad);k+=4;w32(out,k,0x4e4f534a);k+=4;out.set(json,k);k+=json.length;for(let i=0;i<jpad;i++)out[k++]=32;
 w32(out,k,binOut.length+bpad);k+=4;w32(out,k,0x004e4942);k+=4;out.set(binOut,k);k+=binOut.length;for(let i=0;i<bpad;i++)out[k++]=0;
 if(k!==total)throw Error("Incorrect glTF binary count");
 let allTriangles=j.meshes.reduce((s,m)=>s+j.accessors[m.primitives[0].indices].count/3,0);
 let allVertices=j.meshes.reduce((s,m)=>s+j.accessors[m.primitives[0].attributes.POSITION].count,0);
 return{bytes:out,metrics:{...hair.metrics,pose,allTriangles,allVertices,meshCount:j.meshes.length,materials:j.materials.length,bytes:out.length}};
}
if(typeof process!=="undefined"&&process.argv?.[1]?.endsWith("build_male_hair_p06b.mjs")){
 import("node:fs").then(async fs=>{
  const crypto=await import("node:crypto");const [file,pose]=process.argv.slice(2);
  if(!file||!EXPECTED[pose])throw Error("Usage: node build_male_hair_p06b.mjs ../p6a/<male_p06a.glb> cross|kneel");
  const input=new Uint8Array(fs.readFileSync(file)),hash=crypto.createHash("sha256").update(input).digest("hex");
  if(hash!==EXPECTED[pose])throw Error("FROZEN P06A SHA MISMATCH: "+hash);
  const result=sculptMaleP06b(input,pose),name="meditator_male_"+pose+"_prayer_p06b.glb";
  fs.writeFileSync(name,result.bytes);
  const newhash=crypto.createHash("sha256").update(result.bytes).digest("hex");
  console.log(JSON.stringify({file:name,sha256:newhash,metrics:result.metrics},null,2));
 }).catch(e=>{console.error(e);process.exitCode=1;});
}