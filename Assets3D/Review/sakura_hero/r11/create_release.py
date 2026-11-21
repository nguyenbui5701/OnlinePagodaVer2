"""Generate factual R11 metadata, SHA inventory, and owner-facing documentation."""
from pathlib import Path
import json,hashlib,os,zipfile,subprocess
import sys
root=Path(__file__).resolve().parent
sys.path.insert(0,str(root))
from validate_glb import collect
old=root.parent/'r10'
branch='assets/sakura-hero-r04-sa-review'; repo='Assets3D/Review/sakura_hero/r11/'
quality=collect(root/'sakura_hero.glb');eco=collect(root/'sakura_hero_eco.glb')
baseq=collect(old/'sakura_hero.glb');basee=collect(old/'sakura_hero_eco.glb')
assert quality['triangles']==baseq['triangles']==188782
assert eco['sha256']==basee['sha256']
assert eco['triangles']==basee['triangles']==44412
assert quality['vertices']==baseq['vertices']==235142
# GLB JSON attribute counts, verifying native normals are shipped.
def gltf_normals(path):
 data=path.read_bytes();import struct
 count=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+count]);return [m.get('name','') for m in g['meshes'] if any('NORMAL' in p.get('attributes',{}) for p in m['primitives'])]
qual_normals=gltf_normals(root/'sakura_hero.glb')
assert len(qual_normals)==4 and all(x.startswith('Sakura_petal_') for x in qual_normals)
assert len(gltf_normals(old/'sakura_hero.glb'))==0
# SHA of binary + preview media files actually present in local working directory.
paths=['sakura_hero.glb','sakura_hero_eco.glb','sakura_hero_editable.obj',
 'r10_palette_only.glb','r10_emissive_only.glb','r10_albedo_only.glb','r11_geometry_only.glb']
paths+=sorted('PBR_Review/'+p.name for p in (root/'PBR_Review').iterdir() if p.suffix.lower() in ('.jpg','.png'))
files=[]
for name in paths:
 p=root/name
 files.append({'file':name,'repositoryPath':repo+name.replace('\\','/'),'bytes':p.stat().st_size,
               'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'status':'pending_owner_upload'})
manifest={
 'manifestVersion':'0.11.0','revision':'R11','assetId':'sakura_hero',
 'status':'GEOMETRY_PBR_VTK_PROTOTYPE_BLENDER_R11_NOT_EXECUTED',
 'branch':branch,'pullRequest':'https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1',
 'source':'original Python/trimesh deterministic procedural geometry; no paid tools or external textures',
 'coordinateSystem':{'up':'+Y','units':'meters','pivot':[0,0,0]},
 'quality':quality,'eco':eco,
 'baselineR10':{'quality':baseq,'eco':basee},
 'diffVsR10':{'qualityTriangles':0,'qualityVertices':0,'qualityBytes':quality['bytes']-baseq['bytes'],
              'qualityBytesPct':round((quality['bytes']/baseq['bytes']-1)*100,3),
              'ecoExactCarryForward':True},
 'geometry':{'petalDesign':'four triangles per petal, single sheet doubleSided; rounded 6-point lip using unchanged topology',
             'qualityNormals':'Explicit coherent glTF NORMAL vec3 on 4 petal materials (R10 none), front alignment verified',
             'qualityNormalsMeshNames':qual_normals,
             'bark':'quality-only selective knot/flute amplitude increase; recessed gold preserved; branch continuity not fully solved',
             'eco':'exact R10 bytes, no geometry/material change'},
 'materialAB':{'baseline':'R10 original real GLB; high emissiveFactor [0.30,0.17,0.18] for petal materials',
    'r10_emissive_only.glb':'R10 positions/faces/color unchanged; ONLY emission factors R11',
    'r10_albedo_only.glb':'R10 positions/faces/emission unchanged; ONLY baseColorFactor R11',
    'r10_palette_only.glb':'R10 positions/faces unchanged; BOTH emissive and albedo R11',
    'r11_geometry_only.glb':'R11 positions/faces/normals but original R10 palette/emissive',
    'sakura_hero.glb':'R11 final geometry + R11 palette/emissive'},
 'pbrEvidence':{'VTKnativePBR':'EXECUTED: actual GLB imported, synthetic dusk gradient IBL+3 scene lights, top/under/trunk. No Phong override.',
                'blenderR10':'PASS by owner and independent SA (review #6003449385); not repeated locally',
                'blenderR11':'NOT EXECUTED; Windows Cycles A/B script supplied',
                'lightingContract':'R11_BLENDER_AB_CONTRACT.md',
                'threeJsGLTFLoader':False,'gpuLiveStudioBenchmark':False},
 'costVND':0,'binaryHandoff':files,
}
(root/'asset_manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
validation={'revision':'R11','structural':{'quality':quality,'eco':eco},
 'materialGltfNormals':qual_normals,
 'r10PaletteOnlySamePositionsAndFaces':True,
 'r11GeometryOnlySamePositionsAndFaces':True,
 'materialABPBR':'VTK native PBR executed 4-case top, under, trunk; A/B source GLBs actually exported',
 'blenderCyclesAB':'NOT EXECUTED in this environment; owner-run Windows script syntax-compiled only',
 'validatedR10Blender':'SA confirmed R10 Cycles import/render and original 2 .blend file integrity',
 'unresolved':['R11 Cycles image parity, particularly pale top canopy','R11 material/normal underside shading in Blender','native ThreeJS material parity','LIVE Studio GPU FPS/VRAM on owner hardware','old-growth branch merge art fidelity'],
 'costVND':0}
(root/'R11_VALIDATION.json').write_text(json.dumps(validation,indent=2,ensure_ascii=False)+'\n')
rows=['| File path in repo | Bytes | SHA-256 | Status |','|---|---:|---|---|']
rows += [f"| `{f['repositoryPath']}` | {f['bytes']} | `{f['sha256']}` | `pending_owner_upload` |" for f in files]
(root/'BINARY_HANDOFF.md').write_text(f'''# Sakura R11 binary handoff — no binary claimed uploaded

**PR:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1  
**Branch:** `{branch}`  
**Folder:** `{repo}`

All files in this inventory are **`pending_owner_upload`**. The exact full paths, bytes and SHA-256 refer to locally checked binary bytes. No `.blend` R11 exists until the owner runs Blender.

'''+"\n".join(rows)+'''

Original R10 QUALITY is the **baseline input** for Blender A/B and stays in the R10 directory on GitHub with SHA `ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273`. The Windows starter also contains a copy called `r10_sakura_hero.glb`, **not a new R11 production asset**. The four A/B diagnostic GLBs in the table must not be mistaken for production variants.

After copying selected verified files to the branch folder, run `Get-FileHash <file> -Algorithm SHA256`, compare with this table, then `git add Assets3D/Review/sakura_hero/r11`, commit and push to the existing branch, **never main**. Do not mark uploaded until verifying the actual GitHub byte hashes.
''')
(root/'README.md').write_text(f'''# Sakura Hero R11 — controlled material/geometry art prototype

**PR:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1; branch `{branch}`. Sakura tree only, zero cost; NOT approved for production. R04–R10 preserved.

## SA R10 decision used
Review #6003449385 confirms real Blender 4.5.16 LTS Cycles CPU import/render PASS for R10 QUALITY/ECO; owner-supplied original two .blend bytes independently hashed and parsed. It does NOT mean R10 appearance or native Three.js passed. Cycles showed nearly-white pink QUALITY aerial, sharp petals and tubular branches.

## R11 delta
- **QUALITY colors:** less pale, warmer/lower-albedo four petal materials; petal PBR emissive factors reduced from `[.30,.17,.18]` to `[.045,.018,.024]`. Canopy core emission similarly reduced from `[.20,.09,.12]` to `[.025,.01,.014]`. Blender lighting and exposure are NOT changed for the main R10/R11 A/B.
- **QUALITY geometry:** replace spiky lip with a curved oval fan using EXACT same 4 triangle faces/petal; reduce exaggerated outer-lobe warp and edge petal scale; encode native glTF NORMAL on all four petal materials with verified orientation; selective bark flute amplitude tweak while retaining recessed gold fissures. Branch junctions and roots remain stylized, NOT final art.
- **ECO unchanged:** byte-identical R10/R09 ECO, validated SHA. No global polygon increase.
- **Cost caveat:** NORMAL attributes add ~2.5 MB to QUALITY GLB (+{manifest['diffVsR10']['qualityBytesPct']}%) despite same triangles/vertices. This memory/bandwidth tradeoff needs owner GPU/Three.js review; do not claim FPS benefit.

## Independent A/B matrix
For exact light/camera/exposure parity, *test original glTF files* with `blender_ab_validate_r11.py` using `run_sakura_R11_blender.ps1`.
- R10 original; R10 emissive-only changed; R10 albedo-only changed; R10 both changed (palette-only)
- R11 geometry+normal-only under R10 material settings; R11 final; ECO unchanged
- Two separate controls on **R10 original**: Blender Standard vs AgX; 75% world-and-sun intensity vs original dusk rig

A/B diagnostic GLBs use unchanged mesh positions/faces and verified material changes. No Photoshop or post-render color correction. `build_ab_diagnostics.py` regenerates them.

## Rebuild free 3D geometry locally
```powershell
py -m pip install numpy trimesh vtk pillow
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\\procedural_sakura_source.py
py .\\build_ab_diagnostics.py
py .\\validate_glb.py .\\sakura_hero.glb .\\sakura_hero_eco.glb
```
The A/B builder expects R10 original GLB in sibling `..\\r10\\sakura_hero.glb`. Using the original supplied binary rather than a new exporter is important for exact checksums.

## Cycles checkpoint — owner Windows, NOT yet executed for R11
Extract `Sakura_R11_Blender_AB_Windows_Starter.zip`, open PowerShell in its folder:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\run_sakura_R11_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\run_sakura_R11_blender.ps1 -Mode all -Samples 32 -Size 520
```
Launcher first verifies all input SHA-256s. Then imports actual GLBs in Blender 4.5+, uses Cycles CPU and the *same* 50° top / 44° under / 44° three-quarter / 56° trunk cameras. It saves a real editable `.blend` for R11 QUALITY and unchanged ECO. See `R11_BLENDER_AB_CONTRACT.md`. Submit `Sakura_R11_Blender_Evidence_AB.zip` plus both `.blend` files separately. The quick test does **not** include every diagnostic condition; use `-Mode all` for full matrix.

## Visual proof status
Native VTK PBR on actual GLB: **executed** and images in `PBR_Review` compare four controlled combinations. R11 richer rose color in this rig, but flower sheets can read as larger flat tiles, so genuine Blender softness is still UNVERIFIED. Referenced video ~15s/~33s is not camera-calibrated; scene fog and petals are external to this tree asset.

No Blender R11, native Three.js glTFLoader test, RTX 3050 Ti/3060 GPU + LIVE Studio benchmark or production acceptance claimed. PR remains DRAFT.
''')
(root/'R11_VISUAL_GAP_ANALYSIS.md').write_text('''# R11 visual gap report — SA R10 review #6003449385

## Findings from SA
- R10 native Blender/Cycles and both original .blend SHA/structure independently PASS. QUALITY aerial is near white, soft peach/pink separation is weak.
- QUALITY petals and multiple branches still angular, old-growth forks mechanical. ECO polygonal tiles/branch exposure visible but geometry is in budget. R10 not final art.

## Controlled tests and observations
1. **Color/emission separation**: R10 source petal base colors were close to white (e.g. blush `[251,207,208]`, cream `[248,215,198]`) and all petals had emissive `[.30,.17,.18]`. New QUALITY reduces both. A/B GLBs isolate (a) emissive only, (b) albedo only, (c) both, (d) geometry/normals only, (e) combined. VTK native PBR screenshots use the identical GLB importer/IBL/lamps. Pure Blender Cycles evidence for R11 is still pending; no claim that R11 has solved washed-out appearance in Cycles yet.
2. **AgX vs light exposure**: owner-run A/B supplies R10 AgX 0EV vs R10 Standard 0EV with unchanged light rig, and a separate R10 case with 75% SUN/World energy under AgX 0EV. These have not been executed in Blender yet. Cross-engine image pixel values do not constitute a radiance calibration.
3. **Flower silhouettes**: native R11 petal vertex normals added to four flower glTF materials with no extra triangles, and a 4-triangle rounded oval fan silhouette replaces long pointed lips. In VTK some patches look broader/larger and still read as tessellated sheets; therefore this is only a **geometry experiment**, not a solved softness gate.
4. **Bark**: qualitative incremental flute/knot relief rather than all-new fused branch mesh. Embedded gold fissures remain. Old-growth shape and branch merging remain OPEN, especially around ~33s.
5. **ECO**: R11 ECO byte-identical to R10. No new geometry or performance claim.

## Quantitative cost
QUALITY triangles **188,782 → 188,782 (0%)**, vertices **235,142 → 235,142 (0%)**, materials **11 → 11**. QUALITY GLB bytes **5,096,052 → 7,599,884** (+49.13%) because glTF NORMAL attributes are now explicitly serialized for all four flower groups. This is a real asset size tradeoff, **not a verified speed improvement**. ECO remains 44,412 triangles/71,032 vertices/10 materials/1,393,492 bytes, exact SHA unchanged.

## Gates still open
Blender R11 Cycles owner execution, fixed-light A/B and corresponding actual .blend SHA; native Three.js glTFLoader PBR parity; 3050 Ti 4GB and 3060 8GB LIVE Studio FPS/VRAM; SA quality art sign-off; exact large binary GitHub upload. No paid services; zero-cost only.
''')
(root/'R11_BLENDER_AB_CONTRACT.md').write_text('''# Cycles PBR controlled A/B — R10 vs R11

**This is a test protocol, NOT an executed Blender R11 report.** Execute on owner's Windows Blender 4.5+ using the two scripts in this R11 directory.

**Inputs**: original unmodified R10 QUALITY 5,096,052 B/SHA `ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273`, R11 QUALITY/ECO and four real diagnostic GLB files. Each case starts Blender `--background --factory-startup` and imports source glTF PBR as **Principled BSDF**; no material override, Phong switch or compositing. PBR properties are read from each GLB.

**Fixed lighting (main cases)**: synthetic dusk World `[0.69,0.47,0.60]`, Strength **0.65**; three `SUN` lights:
- KEY at glTF position `(22,40,26)` toward `(0,9,0)`, energy 2.1, RGB `(1,.84,.82)`, angular size .12.
- RIM at `(-18,23,-15)`, energy 1.05, RGB `(1,.76,.89)`, angular size .17.
- LOWER FILL at `(6,3,18)`, energy .72, RGB `(1,.74,.83)`, angular size .32.

Coordinate mapping `(x,y,z)_GLB -> (x,-z,y)_Blender`; verify imported tree height aligned to Blender +Z. Camera angles are VERTICAL FOV: top `(3,54,10)→(0,13.5,0)`, up `(0,0,-1)`, **50°**; under `(3,4.8,18.5)→(0,11.9,0)`, up `(0,1,0)`, **44°**; three-quarter `(31,25,31)→(0,11.6,0)`, **44°**; trunk `(4.8,4,11.5)→(0,6.6,0)`, **56°**. All positions are GLB +Y-up before axis conversion.

**Color management**: Blender `AgX`, look `Medium High Contrast` where supported, exposure **0EV**, gamma 1.0; Cycles **CPU**, samples 32, resolution 520×603, no post Photoshop. WORLD and Sun intensities fixed for all ordinary A/B GLBs.

**Isolation matrix**:
| Case | Model geometry | Base albedo | Emissive | Blender tone/lighting |
|---|---|---|---|---|
| r10_baseline | R10 | R10 | R10 | AgX, reference rig |
| r10_emissive_only | R10 | R10 | R11 | AgX, reference rig |
| r10_albedo_only | R10 | R11 | R10 | AgX, reference rig |
| r10_palette_only | R10 | R11 | R11 | AgX, reference rig |
| r11_geometry_only | R11 | R10 | R10 | AgX, reference rig |
| r11_final | R11 | R11 | R11 | AgX, reference rig |
| eco | EXACT R10 ECO | R10 ECO | R10 ECO | AgX, reference rig |
| r10_standard | R10 | R10 | R10 | **Standard** 0EV, reference rig |
| r10_light75 | R10 | R10 | R10 | AgX, all Sun + World energy **×0.75** |

The last two are *independent one-variable controls*, not directly compared to R11 under changed lights. Compare visual gradients and highlights with identical camera sizes; do not claim numeric equivalence to VTK IBL. Blender screenshot and JSON/output SHA must be verified before calling any R11 test PASS.
''')
(root/'LICENSE_AND_PROVENANCE.md').write_text('''# R11 original asset provenance / commercial use
All R11 geometry, palette choices, normals and test scripts are original locally written procedural work for OnlinePagodaVer2. Only NumPy, trimesh, VTK, Pillow and the freely available Blender application are used; no third-party 3D model or paid AI generation. Owner reference video is used only for artistic comparison, not a mesh texture. Project owner may use these outputs commercially. Zero-cost service expenditure: 0 VND. Do not include Blender or system fonts in the repository or output ZIPs.
''')
print('QUALITY SHA',quality['sha256'],'ECO SHA',eco['sha256'],'file inventory',len(files))
