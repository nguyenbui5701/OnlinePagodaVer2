# R17b — frozen final evidence / SA Final Review

[SA R3 #6033131258](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6033131258) accepted preview at `29790122d2aae80b9be6fd6852a881be21a7fc10`; Task AI Visual 16 §9. Owner final evidence uploaded at exact `5e8a324ea39acc3d8ac56e99f02fead312f3ef41`. Same draft PR #18, frozen PR #1 and read-only Viewer PR #17. **R17B_SA_PREVIEW_GO / R17B_FINAL_NATIVE_EVIDENCE_UPLOADED / R17B_FINAL_EDITABLE_OWNER_REOPEN_PASS / R17_BINARY_SA_VERIFICATION_PENDING / MERGE_HOLD.** Not final SA or Owner Art GO.

## Canonical frozen GLBs
| Profile | Canonical path | Bytes | Triangles | Vertex records | Owner SHA-256 | Git blob |
|---|---|---:|---:|---:|---|---|
| QUALITY | `r17b/preview/sakura_hero_r17b.glb` | 6981312 | 236888 | 297635 | `1ed05dd2c0451364122e20999955dedb3be213305a59a45c61853013495f0267` | `cfcbaa2ed71bedafae959541487c91f6de42ab74` |
| ECO | `r17b/preview/sakura_hero_r17b_eco.glb` | 2149264 | 58212 | 98632 | `3b7e87f61ed120a2c938e572e0d0fe2c858c6fbc8027657efe16c232906de770` | `d5554055ab689680ca17744653cfc49197b1e773` |

| LOD | Meshes / materials | POSITION / NORMAL / INDEX bytes | Y-up world XYZ bounds (m) |
|---|---|---|---|
| QUALITY | 14 / 15 | 3571620 / 820800 / 2569056 | `[[-14.178767204284668,-0.5183812975883484,-13.425017356872559],[14.489616394042969,26.48044204711914,14.410984992980957]]` |
| ECO | 13 / 14 | 1183584 / 331200 / 615744 | `[[-14.275399208068848,-1.026049256324768,-13.268314361572266],[13.287308692932129,24.86863899230957,11.898303031921387]]` |

Both GLBs unchanged since SA preview. Owner-native locked SHA and original audit reused; zero degenerates, original BIN/accessor/mesh/node/index prefixes and protected wood/gold PBR unchanged, seven preapproved ECO floral material changes only. Original min/max Y unchanged. 30 clusters/LOD; 2280/1380 added flowers. Compared with R17, bytes reduced 60.89%/44.23%, vertex records reduced 54.86%/33.21% (QUALITY/ECO). No new geometry/material edits or export. Existing root target/editable/Cycles fields refer to historical R17; canonical R17b is `r17b.canonicalGLBs` and `r17b.final` in root manifest.

## Actual final editable source
`r17b/final/sakura_hero_r17b_editable.blend` — 22191226 bytes; owner SHA-256 `9043df77297e82051dbdc6da2c9bbe5ac38895fa1155d9661fd9ef8cca3d63e2`; Git blob `b97cc9208dc000d8838c91b26f2a18b2cbaae910`. Owner imported exact GLBs and reopened the saved source with QUALITY (14 meshes/15 materials/236888 tris) visible and ECO (13 meshes/14 materials/58212 tris) hidden; switched ECO visibility and restored saved default. Per-material triangle assignments/PBR and transforms matched before/after reopen. See [editable receipt](r17b/final/editable_reopen.json). Independent SA .blend opening and raw GLB SHA remain pending.

## Actual final Cycles
Blender 4.5.16 LTS CPU Cycles, 720×1280, 32 samples, identical camera/light/exposure within each R16/R17b pair. 24 final-grade records: 12 new R17b, six new R16 full/wide/overhead, six original R16 under/close/trunk reused at their original paths by SHA. Exit code 0, stdout 111383 bytes, stderr empty, native completion and lock/reopen markers present. [Final result](r17b/final/R17B_FINAL_RESULT.json), [Cycles ledger](r17b/final/cycles_manifest.json), [final manifest](r17b/final/final_manifest.json), [SHA ledger](r17b/final/owner_sha256.txt), [sheet ledger](r17b/final/sheet_manifest.json). All 32 inventory files plus final manifest and SHA ledger present on GitHub; sizes and Git blob IDs checked, Owner hashes consistent across records. 41 SHA ledger entries include six reused baseline frames and both existing canonical GLBs. Independent binary SHA not claimed.

| Final A/B view | QUALITY / ECO luma delta >16 (%) | AI Visual observation |
|---|---:|---|
| [crown_close_9x16](r17b/final/crown_close_9x16_AB.jpg) | 6.94 / 54.66 | ECO much less pale; distinct low-poly petals, QUALITY has rounded additions. |
| [hero_full_9x16](r17b/final/hero_full_9x16_AB.jpg) | 2.08 / 7.72 | Whole tree framed, warmer/full crown. |
| [hero_wide_water_9x16](r17b/final/hero_wide_water_9x16_AB.jpg) | 3.81 / 14.45 | Layered silhouette, rounded QUALITY shoulders remain. |
| [true_aerial_9x16](r17b/final/true_aerial_9x16_AB.jpg) | 4.77 / 18.23 | True overhead shows larger spread, more distinct ECO layers; some lobes visibly rounded. |
| [trunk_fork_9x16](r17b/final/trunk_fork_9x16_AB.jpg) | 2.05 / 12.38 | Bark and gold identity retained; foliage affects surrounding shading. |
| [under_crown_9x16](r17b/final/under_crown_9x16_AB.jpg) | 3.41 / 37.30 | Skirts and branch openings visible; ECO underside darker and polygonal. |

Luma delta is a noise-inclusive proxy, not segmentation or volume. Direct AI Visual review of all six sheets supports completion of evidence; remaining rounded outer lobes and darker ECO underside are disclosed for SA decision. No new substantial defect identified, no additional art iteration or rerender recommended. No reference-video re-review, historical 45/68 secondary contact proxy remains unresolved; render-only water is not native Viewer ring/reflection proof, no physical GPU/RTX/LIVE PASS. 0 VND software/license cost.

## STOP
Independent SA verification still needs exact large binary bytes: Owner can attach ZIP of two canonical R17b GLBs, new final .blend and two original R16 GLBs; no duplicate repo commit. See [BINARY_HANDOFF](BINARY_HANDOFF.md). **STOP `R17_SA_ART_REVIEW_REQUIRED`**, separate Owner `R17_BOTANICAL_HERO_ART_GO` PENDING. No merge/Codex/runtime edits. Keep task active.
