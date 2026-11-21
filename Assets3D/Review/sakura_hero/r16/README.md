# Sakura Hero R16 — joined old-growth forks and safe gold fissures

**PR #1:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1 · branch `assets/sakura-hero-r04-sa-review` · **Draft, not mergeable for production** · zero-cost **Sakura only**.

## Baseline and gates
SA review [#6004773600](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004773600) independently audited the original owner **R15 Blender/Cycles 3/3 cases, 30/30 PNGs and 41/41 ZIP-member SHA**, with two authentic editable .blend files. **R15 Cycles PASS, artistic PARTIAL**. Updated R15 docs accordingly; actual large GitHub binary uploads remain `pending_owner_upload`.

## P0: real exported-GLB topology audit
Opened SHA-exact raw R15 and R16 GLB files and independently split their triangle faces, counted undirected edge incidences, checked winding and watertightness. This is **not just the generator's JSON**.

| Real exported GLB metric | R15 | R16 |
|---|---:|---:|
| Joined old-growth wood triangles | 15,054 | **20,920** |
| Joined wood vertices | 7,529 | **10,462** |
| Joined wood connected parts | 1 | **1** |
| Watertight / winding consistent | PASS / PASS | **PASS / PASS** |
| Euler / boundary / nonmanifold edges | 2 / 0 / 0 | **2 / 0 / 0** |
| Other bark-material components | 16 | 16 |
| Independent secondary branch-material pieces | 77 | **68** |

**R16 merges all 11 primary arms + selected important secondary arm ID 100 into one actual SDF surface**, not pipe sleeves or larger collars. CPU marching cubes at **0.15m**, polynomial smooth-min k **0.43m**, wood-only windowed-sinc smoothing (18 iterations) and preserve-topology 57% decimation. Other small branch/root/decorative meshes still remain separate; **the entire GLB scene is NOT watertight**. See `R16_VALIDATION.json`, `R16_RAW_GLB_INDEPENDENT_AUDIT.md`, local full JSON audit and `r16_fork_union.py`.

## Gold alignment P1: original per-ribbon audit
R15 creator's pre-export nearest projection max **1.08343m**; direct source R14 to exported R15 GLB gold vertex comparison max **~1.09504m**. R16 bounds nearest-surface projection to **0.25m per original gold vertex**, keeps only continuous safe two-edge rows and never bridges missing rows. The R16 GLB has **20 flat gold segments, 286 retained vertices**, 62 rejected original rows, three complete ribbons omitted for safety. Independent exact exported-R16-versus-R15 retained-vertex correspondence: **mean 0.03050m, P95 0.11574m, MAX 0.16076m**, including 12mm visibility offset. 23-ribbon CSV and before/after displacement heatmap show where unsafe gold was omitted. Existing matte-gold PBR values retained; no raised emissive wire. **Fewer visible gold streaks remains an ART PARTIAL tradeoff**, not full groove recreation.

## QUALITY triangle budget and preservation

| Asset | Triangles | Vertices | GLB bytes | SHA256 |
|---|---:|---:|---:|---|
| R15 QUALITY | 187,368 | 227,360 | 4,985,692 | `9ad2dc4ceb807e0a60d89c8cbfdbcc26f09bd2ba190a1bb1ed09825be23f81ba` |
| **R16 QUALITY** | **191,288** | **229,235** | **5,055,232** | `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c` |
| ECO untouched | 44,412 | 71,032 | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` |

R16 costs **+3,920 triangles (+2.09%) and +69,540 bytes (+1.40%)** for unified wood. All 11 glTF material values and QUALITY flower geometry are unchanged from R15, warm rose and muted emission intact, no explicit NORMAL buffers. ECO byte-identical. QUALITY/ECO GLB and editable OBJ re-generated in clean directory byte-for-byte.

## Same-camera evidence and limitations
**Executed:** actual GLB import + independent topology/winding/edge tests, per-ribbon source/output correspondence; VTK native glTF PBR on **R15/R16 fixed camera, IBL and 3 lamps**, no Phong override: fork front/side/back, top/under/trunk/3-4 and full/medium/close portraits. Fork side has fewer planar crossing main pipes; some low-poly facets and independent thin twigs remain. FULL R16 has **0% vertices cropped**; MEDIUM intentionally clips **~1.21%**, CLOSE intentionally clips **~7.37%**, no geometry changes for cameras.

**NOT EXECUTED YET:** actual Blender R16 Cycles; native Three.js GLTFLoader; RTX 3050 Ti/RTX 3060 with LIVE Studio 720×1280@30fps and VRAM/FPS. VTK screenshots are **not** R16 Cycles proof. **ART PARTIAL, PRODUCTION NOT APPROVED.** Do not merge PR.

## Zero-cost owner regeneration and Blender validation
```powershell
py -m pip install numpy scipy scikit-image trimesh vtk
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
```
For full topology/gold audit, use SHA-exact `r15_quality.glb`, `sakura_hero.glb`, `sakura_hero_eco.glb`, producer `generator_full.log` and `audit_glb_topology_and_gold.py` from the owner source bundle.

Extract `Sakura_R16_Blender_Windows_Starter.zip`, then open PowerShell in extracted directory:
```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R16_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R16_blender.ps1 -Mode all -Samples 32 -Size 520
```
Original glTF materials + **Cycles CPU, AgX, 0 EV, World strength 0.65 and 3 SUNs**, same R15/R16 rig and 10 views/case (including 3 junctions and full/medium/close). This has **not** been executed for R16 by the AI environment. Send original Cycles ZIP and editable R16 QUALITY/ECO .blend to SA. See `README_WINDOWS.md` and `BINARY_HANDOFF.md`.
