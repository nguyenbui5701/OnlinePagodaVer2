# AI Visual P0-01 — Original 3D lotus leaf pad + seated meditation chibi

**New branch:** `assets/lotus-pad-chibi-p0` (from main, independent of Sakura PR #1). Task [AI_VISUAL_01](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_01_LOTUS_PAD_CHIBI.md). **Review-only prototype; not an integrated runtime asset or production approval.**

## Actual deliverables and status
- Real **`lotus_pad_01.glb`**, original green floating 3D leaf (radial concave notch, real leaf thickness, 15 vein ridges, dark underside, stem under the proposed water plane), SHA `0c80e5d4b2590716fdf9a985340fe2446af7ecc056727a03b82a3997db52bba5`, **270,128 bytes**, **10,984 tris**, 5 mesh / 5 Principled-compatible glTF PBR materials.
- Real **`meditator_base.glb`**, original large-headed dark-hair-bun/ivory-lilac robe cross-legged seated chibi with hands, face, material set, named hierarchical anchors and a **native glTF `sit_idle` animation** (2.0s loop, 17 keys, 0–16mm gentle body/head bob), SHA `f4e184b57046ad442183931bf9fd2f6d7953000ea07270458e291f627f787d2b`, **205,588 bytes**, **8,484 tris**, 11 meshes / 8 materials.
- Exact actor local origin is **[0,0,0] seat contact**, local forward **+Z**, up **+Y**; pad anchor **[0, 0.195, 0] m** above proposed world water `Y=0`. Renderer seats the actor with translation `[0,.195,0]` (not arbitrary guessing). Head `[0,.835,.04]`, nameplate `[0,1.335,.03]`, FX `[.37,.805,.16]`, all measured/read from exported glTF anchor nodes; they follow animated `UpperBodyBreath` node.
- Independent actual binary GLB parsing and trimesh re-import **PASS**; native VTK physically based actual GLB importer rendered turntable, water-level, top, 9:16, anchor debug, **5 actual `sit_idle` samples**. See `PBR_Review/` media.
- **Blender NOT AVAILABLE on the producing container.** `blender_cycles_validate_and_save.py` and `run_p0_blender.ps1` let owner use free Blender 4.5+ to import actual GLBs, verify nodes/animation, create real editable **`lotus_pad_01.blend`** and **`meditator_base.blend`**, and render genuine Cycles evidence. These `.blend` files and true Blender Cycles screenshots are currently **PENDING OWNER RUN**, not fabricated or marked PASS.
- Zero paid services; no copyrighted avatar extraction, no TikTok user data, no changes to Sakura R16, V1, Codex or runtime.

## GLB measurement / seat contact

| Asset | GLB bytes | Tris | Vertices | Meshes | Mats | Textures | Bounding box [width,height,depth] m |
|---|---:|---:|---:|---:|---:|---:|---|
| lotus_pad_01 | 270,128 | 10,984 | 5,530 | 5 | 5 | 0 | [2.09308, 0.452102, 2.043781] |
| meditator_base | 205,588 | 8,484 | 4,315 | 11 | 8 | 0 | [0.703, 1.154961, 0.634742] |

**Contact test:** projected all **658 original GLB seated lower-body vertices** onto mathematical pad top at the same XZ after placing actor on seat anchor. Minimum clearance **14.8 mm**, **0 penetrations greater than 5 mm**, contact threshold 40 mm PASS. This is a sampled *vertex-to-surface* test, not physical collision/cloth simulation; slightly floating fabric or feet may need a Cycles visual touch-up.

## LOD and animation restrictions
First task prioritizes one convincing pair, **no near/far LOD variants yet**. Pad is suitable for future instancing but this PR does not implement renderer instancing. Actor uses one animated glTF node, **not a skinned bone skeleton**; arms/head/eyes share UpperBodyBreath motion, fixed crossed legs remain stationary. `react_gift` deferred. Animated clip playback verified by VTK importer but **native Three.js import/player still NOT RUN**.

## Owner commands

1. Unzip `P0_LOTUS_CHIBI_Blender_Windows_Starter.zip` (two SHA-verified original GLBs, a Python Blender importer/source script, PS1 runner, instructions).
2. In PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p0_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p0_blender.ps1 -Mode all -Samples 32 -Size 520
```

3. Send `P0_LOTUS_CHIBI_Blender_Evidence_Cycles.zip` plus original .blend files; independent SA should verify hashes, actual imported glTF2 materials, 2-second animation, pad seated 9:16 and anchor positions.

**No native Three.js, LIVE Studio FPS/VRAM, or art approval is implied by standalone VTK multi-angle render.** Task review must decide visual fidelity against owner clip at ~3s/9s/42s; this session only accessed the approved textual Design/01 observations, **not the actual `chuav2.mp4` video bytes**.
