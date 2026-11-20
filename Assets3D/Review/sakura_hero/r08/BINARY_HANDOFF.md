# Sakura Hero R08 — Verified binary handoff

**PR:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1  
**Branch:** `assets/sakura-hero-r04-sa-review`  
**Destination folder:** `Assets3D/Review/sakura_hero/r08/`

Only R08 is described here. **Nothing in the table below is claimed uploaded to GitHub.** Every entry remains `pending_owner_upload` until the exact bytes are checked on the feature branch.

| Canonical repository file | Bytes | SHA-256 | State |
|---|---:|---|---|
| `Assets3D/Review/sakura_hero/r08/sakura_hero.glb` | 4,500,120 | `616417f22a2d3cd34c9708e500428449154fd97d1efd142838b390ce3187386e` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/sakura_hero_eco.glb` | 1,380,376 | `e249b45befc009c657b257d5c37064f250882fdbb9a9338f7bb8335b56cfcdc9` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/sakura_hero_editable.obj` | 11,300,508 | `90e109bea45eba8b94aaf3dd22cb4096cefcd956ddc54893bb199f1135ff7c65` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r07_r08_eco_top_pbr.jpg` | 77,203 | `244ff43650ab97664d5638224507f029b547113d95aae6656cbfdfdc934ba5cc` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r07_r08_eco_under_pbr.jpg` | 100,339 | `073d18a44c99a7fdf60520139cfeab6d0a53c729858966297afcae81158bcef3` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r07_r08_quality_top_pbr.jpg` | 97,300 | `2d862ce4efc99222b270c9e0f002d3887276262ff3cfbae6b4f884ac9565194b` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r07_r08_quality_under_pbr.jpg` | 115,522 | `0aed33fc2cf4d111fdf63d6be4ffc15bca41c54b3126c75d30bebd9cd4491478` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r07_r08_trunk_33s_pbr.jpg` | 70,213 | `2cdbeedfe085208b2a2c3968d5e438b5a200d0405e2499780bc27bcb1be08079` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_eco_three_quarter_pbr.png` | 175,204 | `5630cf2d817ecb671509b340a5b81e9762dc28af413468b7117ecc6b8b927475` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_eco_top_pbr.png` | 189,544 | `5949e14c993201922e22b3b48b40ba4e87cb3300704d5c9d5bd1d6769ec2f681` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_eco_under_pbr.png` | 172,838 | `056be1f6d784c14287cb408f7c601141e84703b7fce5c76162299c341b323cae` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_eco_top_pbr.jpg` | 87,741 | `43611b2eeb7de032607a2e1b6bd01273de893ff2fa77da786d1bf2e8b1d5dc45` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_eco_under_pbr.jpg` | 103,826 | `3ae4fd55cde0467f40caefd1e905856898eeb968b8247eeed1320a67090b19be` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_side_pbr.png` | 238,991 | `bc7a50440109d285ead1d2d75470f951584cbf7e5686cd404a6bdd8038a0b9e2` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_three_quarter_pbr.png` | 212,959 | `420ff26763a6a9b18adbf0571cefb031c269de482160a3490897c897cde05205` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_top_pbr.png` | 248,276 | `72b16ba86f4410d11cb057c66b68e23b9e5a7449db9f3bd9d6009dd3b7a1e0de` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_trunk_33s_pbr.png` | 145,615 | `45bfca634ef0588151229840fe936ff13627281b07dabb52df99b10f44a19557` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_quality_under_pbr.png` | 206,058 | `0c8ad8d5f3051ff2583add6ca6d93c9adf9ee5fd4354789c7c930872d27093b6` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_video_15s_quality_evidence.jpg` | 127,039 | `34dfe0c87d63adf1a96df14ec1d67edff710e9d4f5e788602e8ca5e2b59910f7` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r08/r08_video_33s_trunk_evidence.jpg` | 96,552 | `9ea57ae78ec457dd9e7dbfb2cf632e241324a7bcf56c3010dd271241c7a76996` | `pending_owner_upload` |

## Owner upload steps (PowerShell, after extracting R08 ZIPs)

```powershell
git clone https://github.com/nguyenbui5701/OnlinePagodaVer2.git
cd OnlinePagodaVer2
git fetch origin assets/sakura-hero-r04-sa-review
git switch assets/sakura-hero-r04-sa-review
$target = 'Assets3D/Review/sakura_hero/r08'
New-Item -ItemType Directory -Force $target | Out-Null
# Copy R08 .glb, OBJ, and selected .png/.jpg files into $target
Get-FileHash "$target/sakura_hero.glb" -Algorithm SHA256
Get-FileHash "$target/sakura_hero_eco.glb" -Algorithm SHA256
# Compare both hashes and sizes against table. Do not upload mismatched bytes.
git add Assets3D/Review/sakura_hero/r08
git commit -m 'assets(visual): owner uploads verified Sakura R08 GLB and render bytes'
git push origin assets/sakura-hero-r04-sa-review
```

**No `.blend` exists, so no fabricated `.blend` SHA or pending file is listed.** Do not overwrite R04/R05/R06/R07. Owner video frames are for internal visual comparisons only; do not upload full TikTok UI as a production asset.
