# Sakura Hero R10 — binary handoff (NOT uploaded to GitHub)

Branch: `assets/sakura-hero-r04-sa-review` | PR #1 (Draft). Root: `Assets3D/Review/sakura_hero/r10/`. Every row is **`pending_owner_upload`**. No `.blend` for R10 yet; the first true R10 Blender file will be owner-generated and must be measured and added separately.

| Exact repo path | Bytes | SHA-256 | Status |
|---|---:|---|---|
| `Assets3D/Review/sakura_hero/r10/sakura_hero.glb` | 5,096,052 | `ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/sakura_hero_eco.glb` | 1,393,492 | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/sakura_hero_editable.obj` | 12,693,668 | `ed4213795d6aae7436c106fb93c7ba26317eb360e90332f5bc1e3ba8d03aae67` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/R09_R10_three_quarter_MATCHED_PBR.jpg` | 77,692 | `e8fa0f23b901e6a77b7a26f593ba6c21419ff7b46ecaba2fd9e6ec87c8d82ac1` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/R09_R10_top_MATCHED_PBR.jpg` | 85,875 | `b55e9b3ce560feed9f96c90967e3de7ebc2be93991d7564f18ae10ca992c1229` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/R09_R10_trunk_33s_MATCHED_PBR.jpg` | 61,329 | `3faeff062ab4ed935383574831bd886b0e757573fa146dccca0ef4f1ea0bbf82` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/R09_R10_under_MATCHED_PBR.jpg` | 96,157 | `7108ea9315d3d5ff71355f5890f9c967196826f07a58feecca07e1385b3a9900` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r09_quality_three_quarter_vtk_pbr.png` | 208,073 | `6b9b3d7c5a9356d936b9faf9cef1a75f9cf128ba686942dacfd1757409b88a44` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r09_quality_top_vtk_pbr.png` | 239,375 | `c43e4a8b23ef695566842b11d552c0b07a8a62278c768d11a23b52742693f537` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r09_quality_trunk_33s_vtk_pbr.png` | 142,044 | `03759c1d920144deb761ff444e8ea4bab370df5d6dbb519d7517cd37cfd55b59` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r09_quality_under_vtk_pbr.png` | 199,029 | `82d1a9364b42d5d3b6239f665cd6e5c23e2a4c353924478ddef1530594a59afd` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r10_eco_top_vtk_pbr.png` | 188,010 | `4f62982e1d89f4be3711e3f063d0252687f9d27944e87475e8e86b848bff4b8e` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r10_quality_three_quarter_vtk_pbr.png` | 197,434 | `e45d5ad2b03f8e3aff1ad31eda4bd3c5530e60bd9c85c1269f356d1fba2788f2` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r10_quality_top_vtk_pbr.png` | 220,182 | `d4f56637e94d0e42b6e4341f91f6768b6acc36ae1b47c460a56f399b85ffbb46` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r10_quality_trunk_33s_vtk_pbr.png` | 140,503 | `737d83939ac60466edc2b88352d5049b4f70610f93e9e1682025538c8a76b0d7` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r10/PBR_Review/r10_quality_under_vtk_pbr.png` | 189,842 | `511a60eb66a2fae12864eca53918ce14e9fff12a6e3d7b3b8555fc579c2c31ef` | `pending_owner_upload` |

**ECO carries forward byte-identical R09 geometry and SHA.** This is a deliberate unmodified reuse, not using a stale checksum for changed bytes.

### Owner PowerShell push
```powershell
git fetch origin assets/sakura-hero-r04-sa-review
git switch assets/sakura-hero-r04-sa-review
# Extract the two model binaries, OBJ, and images to Assets3D/Review/sakura_hero/r10/
Get-FileHash Assets3D/Review/sakura_hero/r10/sakura_hero.glb -Algorithm SHA256
Get-FileHash Assets3D/Review/sakura_hero/r10/sakura_hero_eco.glb -Algorithm SHA256
git add Assets3D/Review/sakura_hero/r10
git commit -m "assets(visual): upload R10 original GLBs and review media"
git push origin assets/sakura-hero-r04-sa-review
```
Do NOT push R09/older revision files again. Do NOT mark uploaded until branch SHA is verified.
