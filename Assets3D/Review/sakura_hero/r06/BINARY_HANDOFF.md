# Sakura R06 — Binary and preview handoff

**Branch** `assets/sakura-hero-r04-sa-review`; PR #1 (Draft). **All files BELOW are `pending_owner_upload`**. GitHub text source does not prove binary delivery.

| Canonical path | Bytes | SHA-256 | Status |
|---|---:|---|---|
| `Assets3D/Review/sakura_hero/r06/sakura_hero.glb` | 3962840 | `076aa8abb662ec4328d7d5260c7badce4e5403f80ca0868b5af56c28f247593d` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/sakura_hero_eco.glb` | 898296 | `3ac8d166dc7423a118483b7bdb520520086e06d5ab7f7bdf6f051d0ef479c102` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/sakura_hero_editable.obj` | 10465898 | `91acd77137958166d9e4de888b0866881afd269ebbf6661c322f1056e6cd7c0d` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_under.png` | 303441 | `37b3600b06b9c3940e449af8a7bc4e6d2e0943959c7b0d95c8b20dbc54070d4a` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_top.png` | 413243 | `6190fb8301348c3016a8e5cf0d835b00774954bdaaadf8aa7927616d8883d69c` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_three_quarter.png` | 341729 | `baaa525a5b6ac5628d2bf3dd7273699e34c274a1bfb9201814157b77e774e6ca` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_side.png` | 380199 | `06723897778846f81d3d6a33c8e38707697082ad8c6a818014d75aaca3f0eeff` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_trunk_33s.png` | 213734 | `52637c59d12fe776885d458e2c4cd3f37eaffd2dff1d567c961d35036cffb5ca` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_under_eco.png` | 241018 | `f5eb5b076265f58eb0da286a4dc4ce8d7f6dcff912176b5a06910640480c390d` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_top_eco.png` | 335013 | `a9ef13b83ab8933f837ab789a5cbc4a2f6398522ff5eaffa352b31e20aef60c4` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_under_noIBL.png` | 324053 | `f6c4105dd18dfcf8b9105d0a35a4ca7781538978c910b6e70a5caaea755867d9` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_under_explicit_AB.png` | 300135 | `cdb7de9d14ece7978b0ad06a79f75f5003ebc955ab35aa095bec69a6392c7da5` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r05_r06_pbr_side_by_side.jpg` | 147032 | `39ba52da27dcd430c02122eb4f5323618f1aa10857c1740b8275774fef8644c0` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_ab_test.jpg` | 145471 | `7b9e869c26c37db69e5f86473094f75729522f9bf5751f684458f23fd173419f` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_quality_eco_pbr.jpg` | 136734 | `f85ab003b536b8d2822c3d63de48b720f40632ff52b0a45a3dfe07cd457668a6` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_pbr_4_views.jpg` | 120459 | `3389444b421f3099c1a25f33d18593a92bcc4986b64ca1e8a8364f4a604dc5f9` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r06_reference_15s_33s.jpg` | 84925 | `5abc8ca90ac3a888a23d55bc0aa6a5d8efff5b0d3b0d569da620438983bd5a17` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r05_pbr_under_matched.png` | 313380 | `1b519e8d86d0c390bcb98802e47224ed670deb12c4bc4255540ae7482ed77eb3` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r06/r05_pbr_top_matched.png` | 430591 | `00a166e81f3d52da0c00f0eb74e603de0d449d9de2fa1b32957e189c311264fa` | `pending_owner_upload` |

## Windows PowerShell (run in repository clone after extracting R06 ZIP)

```powershell
git fetch origin assets/sakura-hero-r04-sa-review
git switch assets/sakura-hero-r04-sa-review
$target='Assets3D/Review/sakura_hero/r06'
# Copy all binary files into $target from the extracted R06 review archive
Get-FileHash "$target/sakura_hero.glb" -Algorithm SHA256
Get-FileHash "$target/sakura_hero_eco.glb" -Algorithm SHA256
# Check each hash against the table. Do not replace R05 hashes.
git add Assets3D/Review/sakura_hero/r06
git commit -m "assets(visual): upload Sakura R06 verified GLBs and previews"
git push origin assets/sakura-hero-r04-sa-review
```

**No .blend exists.** The A/B explicit GLB is a local diagnostic only, not a required owner upload; it can be generated with the source. Ensure R04/R05 files are not modified.
