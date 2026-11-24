# R18 — focused preview binary handoff (pending upload)

| Profile | Canonical GLB | Bytes | Triangles | Vertex records | SHA256 (Owner report) |
|---|---|---:|---:|---:|---|
| QUALITY | `sakura_hero_r18.glb` | 6995332 | 237433 | 298010 | `656cfaf7302dc49ff24c8643f4946536b9d1e77e71a5be7d18538aae01e54f29` |
| ECO | `sakura_hero_r18_eco.glb` | 2165220 | 58782 | 99082 | `ad6f84f1c04468bba376e5ab7040993870b676cc0ec31b5911b782747750ff9b` |

| File | Bytes | SHA256 |
|---|---:|---|
| `attachment_diagnostics.json` | 49998 | `d883c2330696a0ad9494f93cce13bca1154ecb5f75fa59761f545ea0b3249bc0` |
| `validation.json` | 21953 | `0121fb56481dc4b185cf1cdbaf2334eea9e9cc1a97e06b9f73efb5f67f5edd18` |
| `R18_build_stdout.log` | 2756 | `d0367f81c1ad99daef10e949057046c1e0b95f03c090be8975d8bacbdbe14a1f` |
| `R18_preview_stdout.log` | 43369 | `b5a78c9b89c1cede4524601043f8055e83d6a566e0e606f35bf647df1d55582b` |
| `R18_Repair_Preview/preview_manifest.json` | 12648 | `467d105c4f099f2e09de41473dc71651c86090fb337d4456a0870b42ab5b83cc` |
| `R18_Repair_Preview/quality_r17b_repair_side.png` | 1225720 | `ed878ebc64558b1c62cdcd7b0dc78caf09a56f92ed84e91ff1c62a115e25e481` |
| `R18_Repair_Preview/quality_r18_under_tree.png` | 1170139 | `807a9304da9b831b18f861c8e62b1e3b344b8229c67d96093e19e7ca450565c3` |
| `R18_Repair_Preview/quality_r18_repair_side.png` | 1215543 | `601ad1483079af2a16e7094a2a7b4bd849c4f566607bdac2af18d155c63c4dc7` |
| `R18_Repair_Preview/eco_r17b_repair_side.png` | 1215991 | `fe9e61cf0e39aba731f75f9cfacbefa13a31cec7eccc6a97a519a709f207a802` |
| `R18_Repair_Preview/eco_r18_under_tree.png` | 1134519 | `e77c9038aa393031dc9ab00e220870a855e80f492b72c25f2b1fd8864d21ccbc` |
| `R18_Repair_Preview/eco_r18_repair_side.png` | 1221075 | `4d9ec04f861451372a18053df78a8c6fe6c21aed4b9e6836366ca535a8ce39b0` |

Actual Owner files are available locally, not yet present in PR. Original Audit files remain pinned in PRE_SA_AUDIT_REVIEW.json; upload the unchanged JSON, six audit images and ledger, original audit logs, plus actual two GLBs, validation/diagnostics, preview folder and Build/Preview logs (including available stderr). ZIP remains outside repo. Before staging run Get-FileHash -Algorithm SHA256 on both GLBs and verify table. Do not regenerate any binary or repeat passed steps. Do not commit stale/partial outputs. Stage only scoped R18 files, pull --ff-only first, commit and push same branch. No final editable source or final Cycles until explicit SA preview GO. Independent raw GLB SHA pending; supply exact GLBs as attachment if needed for SA. 
