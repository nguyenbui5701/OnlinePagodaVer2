# P012B independent remote GLB structure audit

**Audited immutable GitHub commit** `90d7d90e69ba6c857fbda2387d6754aade5dff57` (art branch `assets/p012b-lotus-blossom-bud`; source parent PR #2 `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`). **This is not a Blender Cycles report.**

After a first write, actual GitHub binary refetch discovered **232 degenerate triangles in the initial bloom QUALITY** and **102 in initial bloom ECO** at collapsed petal-tip grid endpoints. Updated source and both bloom GLBs in second commit, preserved scope, and independently re-fetched all four final GLBs.

| Binary | Bytes | SHA256 | Triangles | Degenerate faces | Invalid indices | Zero/invalid normals |
|---|---:|---|---:|---:|---:|---:|
| lotus_bloom_p012b_quality.glb | 50004 | `63edb12d02664a44ce4484b847ef07aeffab6a22a36cf44415b141f56804f0d0` | 1728 | 0 | 0 | 0 |
| lotus_bloom_p012b_eco.glb | 20924 | `8dce16649f0dff541601047628ad7175f0b9ec028e7803b967cf2dee5efc0bd5` | 589 | 0 | 0 | 0 |
| lotus_bud_p012b_quality.glb | 20940 | `fe62a2f9aeb166d0eadf758c75eb47950a9053d8f2149d2a66ceaf5007a05f1a` | 648 | 0 | 0 | 0 |
| lotus_bud_p012b_eco.glb | 8552 | `c442cc04c3b0094a920c2b86fb202233782d5076a97e1110a84b345df3f0d082` | 192 | 0 | 0 | 0 |

**Checks really executed:** all four remote full GLB2 payloads parsed; correct magic `glTF`, version 2, declared byte lengths, JSON and BIN chunks, glTF mesh/material/attribute accessors, 16-bit indices in range, finite FLOAT32 positions, geometry cross-product area above 1e-9 for every face, finite normals with length >=0.8, zero embedded texture definitions or camera/lights. GitHub exact byte SHA-256 matches `asset_manifest.json` for all 4. One mesh containing 2 or 3 material primitives per GLB, +Y-up source coordinates, local root at waterline 0.

**NOT checked in this environment:** real Blender glTF importer, editable native `.blend`, physical Cycles light/camera frame matching, native Three.js 720×1280, real P02 GLB geometry re-import, owner reference-video bytes, RTX FPS or LIVE. The manifest's `cyclesStatus=BLENDER_CYCLES_PENDING_OWNER_RUN` is intentional. Geometry check **does not** constitute `P012B_SA_ART_PASS` or Owner Art GO.

**Reproduction:** `node build_p012b_assets.mjs` (Node >=20, zero external dependencies) should re-export the same files. Check all four hashes. Use `blender --background --python blender_cycles_p012b.py -- --assets <this-dir> --p02 <frozen-P02-GLB>` to load the exact exported GLBs, save the editable Blender source and produce authentic Cycles images. Upload output and log to the same branch for SA review.
