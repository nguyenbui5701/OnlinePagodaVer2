# R17b final binary handoff — geometry and materials frozen

[SA R3](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6033131258) at `29790122d2aae80b9be6fd6852a881be21a7fc10`. Final GLBs already uploaded and canonical at original preview paths:
| Profile | Canonical GLB (existing path) | Bytes | Triangles | SHA-256 (Owner native) | Git blob |
|---|---|---:|---:|---|---|
| QUALITY | `r17b/preview/sakura_hero_r17b.glb` | 6981312 | 236888 | `1ed05dd2c0451364122e20999955dedb3be213305a59a45c61853013495f0267` | `cfcbaa2ed71bedafae959541487c91f6de42ab74` |
| ECO | `r17b/preview/sakura_hero_r17b_eco.glb` | 2149264 | 58212 | `3b7e87f61ed120a2c938e572e0d0fe2c858c6fbc8027657efe16c232906de770` | `d5554055ab689680ca17744653cfc49197b1e773` |

No re-export or replacement. Original R16, intermediate R17, all prior preview/audit/render binaries retained. `asset_manifest.json` has full owner-native geometry facts; SHA values not independently recomputed by SA because large-file transport blocked. The existing old R17 editable source and 24 images are historical; not final R17b source/evidence.

| Final artifact | Path | Current GitHub state |
|---|---|---|
| Editable Blender source | `r17b/final/sakura_hero_r17b_editable.blend` | PENDING_OWNER_NATIVE_RUN_UPLOAD |
| Editable reopen report | `r17b/final/editable_reopen.json` | PENDING |
| New native images | `r17b/final/*_cycles.png` (18) | PENDING |
| Reused baseline images | existing R16 under/close/trunk, 6 images, original `R17_Cycles_Evidence/` | Already uploaded, reuse conditional on SHA and rig |
| Final ledger and reports | `r17b/final/cycles_manifest.json`, `R17B_FINAL_RESULT.json`, `final_manifest.json`, `owner_sha256.txt` | PENDING |
| Compact comparisons | six `*_AB.jpg`, `sheet_manifest.json` | PENDING |
| Native logs | `blender_final_stdout.log`, `blender_final_stderr.log`, `blender_exit_code.txt` | PENDING |

Do not invent SHA or bytes of not-yet-created output. See [run instructions](r17b/README.md). Supply ZIP via chat for independent SA: `r17b/preview/sakura_hero_r17b.glb`, `r17b/preview/sakura_hero_r17b_eco.glb`, `r17b/final/sakura_hero_r17b_editable.blend`, `../r16/sakura_hero.glb`, `../r16/sakura_hero_eco.glb`. Actual final report and Git tree must match on upload. No private data or duplicate ZIP commit. 0 VND. **STOP R17_SA_ART_REVIEW_REQUIRED**, Owner Art GO PENDING, no merge.
