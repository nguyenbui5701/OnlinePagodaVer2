/*
P0.6a Male Chibi Prayer Character — deterministic zero-cost GLB sculpture.
Node.js 22+:
  node build_male_p06a.mjs p5f/meditator_female_cross_prayer_p05f.glb cross
  node build_male_p06a.mjs p5c/meditator_female_kneel_prayer_p05c.glb kneel
Both originals MUST be SHA256 verified by wrapper. Never alter owner originals.
Output contains genuinely new, short male hair geometry and softer male face/shoulder edits;
unchanged praying hands, sleeves, shoes, seat contact, six fabric variants, anchors,
two original idle animations. True Blender source is produced separately on owner PC.
*/
function decodeUTF8(b){let out="";for(let i=0;i<b.length;i++){let c=b[i];if(c<128){out+=String.fromCharCode(c);continue;}let cp;if(c<224){cp=((c&31)<<6)|(b[++i]&63);}else if(c<240){cp=((c&15)<<12)|((b[++i]&63)<<6)|(b[++i]&63);}else{cp=((c&7)<<18)|((b[++i]&63)<<12)|((b[++i]&63)<<6)|(b[++i]&63);}out+=String.fromCodePoint(cp);}return out;}
function encodeUTF8(s){let out=[];for(let i=0;i<s.length;i++){let c=s.codePointAt(i);if(c>65535)i++;if(c<128)out.push(c);else if(c<2048)out.push(192|(c>>6),128|(c&63));else if(c<65536)out.push(224|(c>>12),128|((c>>6)&63),128|(c&63));else out.push(240|(c>>18),128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(out);}
function readU32(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function writeU32(b,o,v){b[o]=v&255;b[o+1]=(v>>>8)&255;b[o+2]=(v>>>16)&255;b[o+3]=(v>>>24)&255;}
function dataGLB(bytes){if(decodeUTF8(bytes.subarray(0,4))!=="glTF"||readU32(bytes,4)!==2||readU32(bytes,8)!==bytes.length)throw Error("INVALID GLB");let n=readU32(bytes,12);if(readU32(bytes,16)!==0x4e4f534a)throw Error("NOT JSON CHUNK");let json=JSON.parse(decodeUTF8(bytes.subarray(20,20+n)));let off=20+n;if(readU32(bytes,off+4)!==0x004e4942)throw Error("NOT BIN");let raw=bytes.subarray(off+8,off+8+readU32(bytes,off));return {json,raw};}
function accelRead(j,raw,id){const a=j.accessors[id],v=j.bufferViews[a.bufferView],off=(v.byteOffset||0)+(a.byteOffset||0),comps=a.type==="VEC3"?3:1,n=a.count*comps,view=new DataView(raw.buffer,raw.byteOffset+off,a.count*comps*4),out=new Array(n);if(a.componentType===5126){for(let i=0;i<n;i++)out[i]=view.getFloat32(i*4,true);}else if(a.componentType===5125){for(let i=0;i<n;i++)out[i]=view.getUint32(i*4,true);}else throw Error("Unexpected glTF accessor component "+a.componentType);return out;}
function writeValues(vals,componentType){let b=new Uint8Array(vals.length*4),d=new DataView(b.buffer);for(let i=0;i<vals.length;i++){if(componentType===5126)d.setFloat32(i*4,vals[i],true);else d.setUint32(i*4,vals[i],true);}return b;}
function bounds3(x){let mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];for(let i=0;i<x.length;i+=3)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],x[i+k]);mx[k]=Math.max(mx[k],x[i+k]);}return [mn,mx];}
function normals3(p,f){let n=new Float64Array(p.length);for(let i=0;i<f.length;i+=3){let a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(let t of [a,b,c]){n[t]+=nx;n[t+1]+=ny;n[t+2]+=nz;}}let out=new Array(p.length);for(let i=0;i<p.length;i+=3){let l=Math.hypot(n[i],n[i+1],n[i+2])||1;out[i]=n[i]/l;out[i+1]=n[i+1]/l;out[i+2]=n[i+2]/l;}return out;}
function smooth(t){let u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);}
function maleHair(){let p=[],f=[],N=56,R=15,cy=.85,cz=.005,ry=.305,rx=.309,rz=.298;
 function V(x,y,z){p.push(x,y,z);return p.length/3-1}
 let pole=V(0,cy+ry+.003,cz),ring=[];
 for(let r=1;r<=R;r++){let row=[];for(let q=0;q<N;q++){let a=2*Math.PI*q/N,front=Math.max(0,Math.sin(a)),back=Math.max(0,-Math.sin(a)),side=Math.cos(a);
  let part=Math.exp(-Math.pow((side-.25)/.24,2))*Math.pow(front,3);
  let yEdge=.868+.105*Math.pow(front,3)-.016*back-.026*part+.006*(side>0?side:0)*front;
  let theta=Math.acos(Math.max(-1,Math.min(1,(yEdge-cy)/ry)))*r/R;
  let ridges=(.0043*Math.sin(7*a+2.2*theta)+.002*Math.sin(12*a-1.5*theta))*Math.pow(Math.sin(theta),1.5);
  let rad=1.024+ridges;
  let x=rx*Math.sin(theta)*Math.cos(a)*rad, y=cy+ry*Math.cos(theta)+.002*Math.sin(5*a+.7)*Math.pow(Math.sin(theta),2);
  let z=cz+rz*Math.sin(theta)*Math.sin(a)*rad;
  row.push(V(x,y,z));
 }ring.push(row);}
 for(let q=0;q<N;q++)f.push(pole,ring[0][q],ring[0][(q+1)%N]);
 for(let r=0;r<R-1;r++)for(let q=0;q<N;q++){let a=ring[r][q],b=ring[r][(q+1)%N],c=ring[r+1][q],d=ring[r+1][(q+1)%N];f.push(a,c,b,b,c,d);}
 // Tiny rounded under-rim: prevents single plane paper edge and holds against scalp.
 let lip=[];for(let q=0;q<N;q++){let i=ring[R-1][q]*3;lip.push(V(p[i]*.976,p[i+1]-.005,cz+(p[i+2]-cz)*.976));}
 for(let q=0;q<N;q++){let a=ring[R-1][q],b=ring[R-1][(q+1)%N],c=lip[q],d=lip[(q+1)%N];f.push(a,b,c,b,d,c);}
 // Two very restrained gently arched eyebrows in hair material. These are
 // genuinely new 3D tube strips nested into the forehead, not paint on skin.
 for(let side of [-1,1]){let last=null;const J=13,S=8;for(let j=0;j<J;j++){let u=j/(J-1),x=side*(.073+.101*u),y=.856+.009*Math.sin(Math.PI*u)-.003*u;
 let frontZ=.006+.315*Math.sqrt(Math.max(.13,1-(x/.300)**2-((y-.862)/.283)**2));
 let row=[];for(let k=0;k<S;k++){let a=k*2*Math.PI/S,fall=.60+.40*Math.sin(Math.PI*u),yy=y+.0047*fall*Math.sin(a),zz=frontZ+.0015+.0042*fall*Math.cos(a);row.push(V(x,yy,zz));}
 if(last)for(let k=0;k<S;k++){let a=last[k],b=last[(k+1)%S],c=row[k],d=row[(k+1)%S];f.push(a,b,c,b,d,c);}last=row;}}
 // Reverse the generated cap/rim winding for correct FRONT-FACING OUTWARD normals.
 // We verify winding against radial scalp normals, not just doubleSided lighting.
 for(let i=0;i<f.length;i+=3){const tmp=f[i+1];f[i+1]=f[i+2];f[i+2]=tmp;}
 return {pos:p,face:f,norm:normals3(p,f)};
}
function sculpt(input,pose){
 if(pose!=="cross"&&pose!=="kneel")throw Error("Pose must be cross/kneel");
 let {json:j,raw:oldRaw}=dataGLB(input);
 if(j.meshes.length!==(pose==="cross"?10:9)||j.materials.length!==21||j.extensions?.KHR_materials_variants?.variants?.length!==6)throw Error("UNEXPECTED IMMUTABLE FEMALE BASELINE");
 const hair=maleHair();let replace=new Map(),measure={pose,oldTriangles:0};
 for(let m of j.meshes)for(let pr of m.primitives)measure.oldTriangles+=j.accessors[pr.indices].count/3;
 function patchAcc(id,vals){let a=j.accessors[id],v=j.bufferViews[a.bufferView];if(a.byteOffset)throw Error("Nonzero accessor offset");const bytes=writeValues(vals,a.componentType);replace.set(a.bufferView,bytes);a.count=vals.length/(a.type==="VEC3"?3:1);if(a.type==="VEC3"){let b=bounds3(vals);a.min=b[0];a.max=b[1];}else{a.min=[Math.min(...vals)];a.max=[Math.max(...vals)];}}
 function deformMesh(idx,fn){let pr=j.meshes[idx].primitives[0],p=accelRead(j,oldRaw,pr.attributes.POSITION),n=accelRead(j,oldRaw,pr.attributes.NORMAL),f=accelRead(j,oldRaw,pr.indices),orig=p.slice(),changed=[];
  for(let i=0;i<p.length;i+=3){let q=fn(p[i],p[i+1],p[i+2],i/3);if(q){p[i]=q[0];p[i+1]=q[1];p[i+2]=q[2];changed.push(i/3);}}
  if(changed.length){let nn=normals3(p,f),impact=new Set(changed);for(let i=0;i<f.length;i+=3)if(impact.has(f[i])||impact.has(f[i+1])||impact.has(f[i+2])){impact.add(f[i]);impact.add(f[i+1]);impact.add(f[i+2]);}for(let vi of impact){n[vi*3]=nn[vi*3];n[vi*3+1]=nn[vi*3+1];n[vi*3+2]=nn[vi*3+2];}patchAcc(pr.attributes.POSITION,p);patchAcc(pr.attributes.NORMAL,n);}
  return changed.length;
 }
 // Subtle squared/soft cheek-jaw transition; strictly head skin, not palms or fingers.
 measure.faceEdited=deformMesh(3,(x,y,z)=>{let a=Math.abs(x);if(y<.72||y>.905||a<.11||a>.27||z<.095)return null;
 let w=Math.exp(-Math.pow((y-.80)/.10,2))*Math.exp(-Math.pow((a-.18)/.115,2));
 let dx=(x<0?-1:1)*.0062*w;if(Math.abs(dx)<.00008)return null;return[x+dx,y,z];});
 // Male slightly straighter shoulders on cloth, never sleeves/prayer wrists.
 measure.topEdited=deformMesh(2,(x,y,z)=>{let ax=Math.abs(x);if(y<.47||y>.615||ax<.125||ax>.285||z>.17)return null;
 let w=smooth((y-.47)/.06)*(1-smooth((ax-.20)/.085));let dx=(x<0?-1:1)*.0055*w;if(Math.abs(dx)<.00008)return null;return[x+dx,y,z];});
 const pr=j.meshes[6].primitives[0],pId=pr.attributes.POSITION,nId=pr.attributes.NORMAL,fId=pr.indices;
 patchAcc(pId,hair.pos);patchAcc(nId,hair.norm);patchAcc(fId,hair.face);
 j.meshes[6].name="hair_neat_male_sidepart_p06a_mesh";
 const hairNode=j.nodes.find(n=>n.mesh===6);hairNode.name="hair_neat_male_sidepart_p06a_object";
 // Less saturated cheek tint but same skin material family.
 let bl=j.materials[8]?.pbrMetallicRoughness?.baseColorFactor;
 if(bl){bl[0]*=.96;bl[1]*=.96;bl[2]*=.97;}
 j.materials[6].doubleSided=true;
 j.asset.generator="OnlinePagodaVer2 P06a procedural male mesh sculpt, Node.js 22 / Blender editable source";
 j.extras={P06a:{revision:"p6a",gender:"male",pose:pose==="cross"?"cross_prayer":"kneel_prayer",
  identity:"Vietnamese chibi, neat short soft sidepart, gently arched eyebrows, slightly straighter shoulder/cheek; shared identity across both poses",
  lineage:pose==="cross"?"P0.5f female APPROVED cross-legged original":"P0.5c female APPROVED kneeling original",
  sourceSHA256:pose==="cross"?"3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4":"a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac",
  originalBottomGarmentsHandsAnimationsAndAnchorsUnchanged:true,seatPlacementWorldY:.195,
  source:"build_male_p06a.mjs",authoring:"scripted editable meshes; Blender .blend created by owner import script",ownerGate:"P06A_MALE_TWO_POSE_OWNER_REVIEW_REQUIRED"}};
 // Rebuild the BIN buffer once, replacing existing hair buffers IN PLACE, i.e.
 // NO orphaned long-female-hair triangles remain in exported male runtime GLB.
 let chunkList=[],next=0;for(let i=0;i<j.bufferViews.length;i++){let v=j.bufferViews[i],source=replace.get(i)||oldRaw.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
 let pad=(4-next%4)%4;if(pad){chunkList.push(new Uint8Array(pad));next+=pad;}v.byteOffset=next;v.byteLength=source.length;chunkList.push(source);next+=source.length;}
 let bin=new Uint8Array(next),off=0;for(let x of chunkList){bin.set(x,off);off+=x.length;}
 j.buffers[0].byteLength=bin.length;
 let jsonBytes=encodeUTF8(JSON.stringify(j));const jPad=(4-jsonBytes.length%4)%4,bPad=(4-bin.length%4)%4;
 let total=12+8+jsonBytes.length+jPad+8+bin.length+bPad,out=new Uint8Array(total);let k=0;
 out.set(encodeUTF8("glTF"),k);k+=4;writeU32(out,k,2);k+=4;writeU32(out,k,total);k+=4;
 writeU32(out,k,jsonBytes.length+jPad);k+=4;writeU32(out,k,0x4e4f534a);k+=4;out.set(jsonBytes,k);k+=jsonBytes.length;for(let i=0;i<jPad;i++)out[k++]=32;
 writeU32(out,k,bin.length+bPad);k+=4;writeU32(out,k,0x004e4942);k+=4;out.set(bin,k);k+=bin.length;for(let i=0;i<bPad;i++)out[k++]=0;
 if(k!==total)throw Error("Internal GLB output length error");
 measure.newTriangles=j.meshes.reduce((sum,m)=>sum+j.accessors[m.primitives[0].indices].count/3,0);
 measure.hairVerts=hair.pos.length/3;measure.hairTriangles=hair.face.length/3;
 measure.inputBytes=input.length;measure.outputBytes=out.length;
 return {bytes:out,metrics:measure};
}
if(typeof process!=="undefined"&&process.argv?.[1]?.endsWith("build_male_p06a.mjs")){
 import("node:fs").then(async fs=>{const crypto=await import("node:crypto");const [file,pose]=process.argv.slice(2);
 if(!file||!["cross","kneel"].includes(pose))throw Error("Usage: node build_male_p06a.mjs <original female GLB> cross|kneel");
 const original=new Uint8Array(fs.readFileSync(file));
 const expected=pose==="cross"?"3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4":"a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac";
 const got=crypto.createHash("sha256").update(original).digest("hex");if(got!==expected)throw Error("Baseline SHA256 mismatch: "+got);
 const r=sculpt(original,pose),filename="meditator_male_"+pose+"_prayer_p06a.glb";fs.writeFileSync(filename,r.bytes);
 const hash=crypto.createHash("sha256").update(r.bytes).digest("hex");
 console.log(JSON.stringify({file:filename,sha256:hash,bytes:r.bytes.length,metrics:r.metrics},null,2));
 }).catch(e=>{console.error(e);process.exitCode=1;});
}