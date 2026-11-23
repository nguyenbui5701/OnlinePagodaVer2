# P0.12-B Binary, Blender and Cycles handoff — PR #10 (SA follow-up)

**Status as of formal SA review** at PR #10 HEAD `3d7d86d589f9a309d03cd9862ba0041795395ddf`: **4 GLB TECH PASS**, **Blender 4.5.16 Cycles execution PASS (20 real PNGs)**, **context composition HOLD**, **Owner Botanical Art GO pending**. Follow-up code prepares a new four-frame render-only composition, but it **has NOT been executed in this assistant environment**.

## Frozen real GLB2 assets — do not re-export

| Asset | Size (bytes) | Tris | SHA-256 |
|---|---:|---:|---|
| `lotus_bloom_p012b_quality.glb` | 50,004 | 1,728 | `63edb12d02664a44ce4484b847ef07aeffab6a22a36cf44415b141f56804f0d0` |
| `lotus_bloom_p012b_eco.glb` | 20,924 | 589 | `8dce16649f0dff541601047628ad7175f0b9ec028e7803b967cf2dee5efc0bd5` |
| `lotus_bud_p012b_quality.glb` | 20,940 | 648 | `fe62a2f9aeb166d0eadf758c75eb47950a9053d8f2149d2a66ceaf5007a05f1a` |
| `lotus_bud_p012b_eco.glb` | 8,552 | 192 | `c442cc04c3b0094a920c2b86fb202233782d5076a97e1110a84b345df3f0d082` |

Independent remote GLB2 checks already PASS and the zero-area petal tip topology was repaired in historical commits. Baseline P02 GLB SHA-256 remains `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`, 262,108 bytes, 2.083084m span.

## Actual remote Blender / Cycles inventory (before four-frame correction)

| Evidence artifact | Real bytes | Git blob SHA | Status |
|---|---:|---|---|
| `P012B_botanicals_editable.blend` | 1,805,896 | `8b0ea3ee72820322fe551b94ed8f95b03e7422da` | Uploaded; SA cannot independently open/decode yet |
| `P012B_Cycles_Evidence/cycles_manifest.json` | 4,237 | `fddc3f935329e673b42ecd19ead7b4d0ede87c38` | 20 original PNG SHA256/size records |
| `P012B_Cycles_Evidence/owner_sha256.txt` | 4,196 | `d21be1fee92850952483edadfff454d9ebde0048` | Owner records of .blend + 20 original PNG hashes |
| `P012B_Cycles_Evidence/blender_cycles_stdout.log` | 106,983 | `d5549f1de1fa3707e390e9c60e6f666660ab3b7d` | Blender 4.5.16 native log; 20 Cycles PNG saved |
| `P012B_Cycles_Evidence/blender_cycles_stderr.log` | 0 | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | Successful run: no stderr |
| `P012B_Cycles_Evidence/blender_cycles_console.log` | 107,261 | `efdbe00cb80144d2d2168ddfd9ea2986b8362425` | Combined successful runner log |

The .blend owner SHA-256 in `owner_sha256.txt` is `672f098d8a9a3d9778fa26ea4703816c62912c2de1bae34c2baefdfbc9814ddc`, **owner-reported only**, not independently decoded by SA. Historical `blender_stderr.log` (816 bytes, Git blob `1a1ff588f102ca64dd6aea0ca48e4586aa6784eb`) records the first failed AgX enum attempt, **not a contradiction** of the successful later Cycles render.

The 16 pre-correction isolated PNGs remain frozen. Current four context-image hashes and exact sizes are recorded by filename in `cycles_manifest.json`; those are valid **old** renders, not the yet-unrendered revised composition.

## Camera correction, exactly four targeted native Cycles images

Scene script: `blender_cycles_p012b.py` (render-only placement/camera, original four GLB imports/sha checks unchanged).
- Frozen P02 visual scale root at Blender XY `(0, +0.83)m` (behind subjects);
- original bloom at `(+0.70, -0.80)m` (right/midground);
- original bud at `(-0.58, -1.15)m` (left/foreground);
- portrait framing: 720×1280, Blender Cycles 32 CPU samples, camera `sensor_fit='HORIZONTAL'`, lens 46mm, common P02 background/lighting unchanged.
- Verified by proposed runtime assertions: actual object bounding-box corners within camera frame, minimum bud visible pixel extent, bud/bloom separated horizontally; native visual SA inspection **still required**.

Run **in `p012b` folder** on existing PR #10 branch:

```powershell
$BlenderExe = Get-ChildItem "C:\Program Files\Blender Foundation" -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
& .\run_p012b_blender.ps1 -ContextOnly -Blender $BlenderExe
```

Only these four PNGs will be freshly rendered:
1. `P012B_Cycles_Evidence/p02_scale_context_quality_720x1280_cycles.png`
2. `P012B_Cycles_Evidence/p02_scale_context_eco_720x1280_cycles.png`
3. `P012B_Cycles_Evidence/water_level_low_quality_720x1280_cycles.png`
4. `P012B_Cycles_Evidence/aerial_quality_720x1280_cycles.png`

Scripts compare SHA-256 of all 16 existing isolated images before/after; Blender saves a new editable .blend and rewrites hash records for twenty total original-plus-updated PNGs. Owner then commits/uploads only four changed context PNGs, `.blend`, updated manifests, hashes and logs to the same PR branch. The four corrected image hashes, sizes and new .blend hash **cannot be stated before running Blender**.

**Gate:** `P012B_SA_ART_REVIEW_REQUIRED`; no SA Art PASS, Owner GO, merge, runtime, or other branch edits. Project-authored art + free local Blender; 0 VND.
