# BINARY_HANDOFF — P012B (revision 2: tip topology repaired)

GitHub branch: `assets/p012b-lotus-blossom-bud`. Stacked PR base `assets/lotus-pad-chibi-p0`, protected baseline `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`.

| Real GLB | Bytes | Triangles | SHA-256 |
|---|---:|---:|---|
| `lotus_bloom_p012b_quality.glb` | 50004 | 1728 | `63edb12d02664a44ce4484b847ef07aeffab6a22a36cf44415b141f56804f0d0` |
| `lotus_bloom_p012b_eco.glb` | 20924 | 589 | `8dce16649f0dff541601047628ad7175f0b9ec028e7803b967cf2dee5efc0bd5` |
| `lotus_bud_p012b_quality.glb` | 20940 | 648 | `fe62a2f9aeb166d0eadf758c75eb47950a9053d8f2149d2a66ceaf5007a05f1a` |
| `lotus_bud_p012b_eco.glb` | 8552 | 192 | `c442cc04c3b0094a920c2b86fb202233782d5076a97e1110a84b345df3f0d082` |

All four actual GLB2 files are Git blobs. Petal-tip zero-area triangles detected by independent remote binary audit were repaired (width ~5 mm across at extreme endpoints), normals recalculated and bound accessors updated. **Do not use the original first-commit checksums.** Run the committed Node generator to reproduce these revised bytes; exact SHA per file must match above.

Native editable `.blend` and true Blender Cycles PNGs remain `pending_owner_blender_run` (Blender not installed in this assistant environment). After loading the four GLBs and frozen original P02 on an Owner Blender installation, the included `blender_cycles_p012b.py` saves `P012B_botanicals_editable.blend` and matched images. No invented Blender reports.

```powershell
$root = 'Assets3D/Review/lotus_botanicals/p012b'
node \"$root/build_p012b_assets.mjs\"
Get-FileHash \"$root/lotus_bloom_p012b_quality.glb\" -Algorithm SHA256
Get-FileHash \"$root/lotus_bloom_p012b_eco.glb\" -Algorithm SHA256
Get-FileHash \"$root/lotus_bud_p012b_quality.glb\" -Algorithm SHA256
Get-FileHash \"$root/lotus_bud_p012b_eco.glb\" -Algorithm SHA256
blender --background --python \"$root/blender_cycles_p012b.py\" -- --assets \"$root\" --p02 \"Assets3D/Review/lotus_pad_chibi/p0.2/lotus_pad_01.glb\"
```

Upload generated `.blend`, actual PNGs and Cycles log/evidence on this same branch for SA Art review; do not merge/modify baseline branches or integrate viewer.
