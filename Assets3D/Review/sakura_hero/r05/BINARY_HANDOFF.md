# Sakura Hero R05 — Binary handoff / MEDIA_PENDING
**Target branch:** `assets/sakura-hero-r04-sa-review` (existing PR #1) — **DO NOT push to main**.  
**Revision:** R05; R04 assets and checksums are immutable.  
**Status for every binary listed:** `pending_owner_upload`; verified in local R05 review package but **NOT PRESENT on GitHub**.

| Canonical repo path | Exact bytes | SHA-256 of actual local bytes | GitHub status |
|---|---:|---|---|
| `Assets3D/Review/sakura_hero/r05/sakura_hero.glb` | 8971236 | `fabe3eae4eb6efb37ed4ed185dda55a124638a63dfcf05b6ce8eb5685b6555d8` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_eco.glb` | 1887408 | `2ab6357a63d1c6b827b795b998ebdb0b6008d716544c9daa04e17a22a656521b` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_editable.obj` | 23405821 | `9d97b10a4f81dcad01e0bcf4003300bfd3789f2f407c67463584e604d935b425` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_r05_4_views.jpg` | 253452 | `80028cf11dbf7a750cc13dd222f0b148a4b7b2f751cef97fb9a13a183e28503f` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_preview_top.png` | 742888 | `2598e99e55dee2a4b93bdaab1ae63f28d626771251376ae64645ec27d259ba08` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_preview_under.png` | 896456 | `faddfc827a47a5b2357c0112151203459dd51a72cd92fec474ea45bc4c36709b` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_preview_side.png` | 698396 | `e0e9abece5c257969563e68f6aab18a60dbd4d949a75deb9d65148b7d92b5a01` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/sakura_hero_preview_three_quarter.png` | 708221 | `328be2d4394ef0d79679f44df69a05c56066a1129e95ceb9bb6852e6f0baa59c` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r05/r05_reference_comparison.jpg` | 132908 | `6ea11b59d6d13838f3386ca9f644d3a0ae22b4f1e6af5253902be86583fff835` | `pending_owner_upload` |

**`.blend` does not exist:** Blender was not available; do not invent a filename or SHA. Instead, the editable polygon OBJ and generator Python source are supplied.

## Windows PowerShell owner upload (same PR)

1. Download `OnlinePagodaV2_SakuraHero_R05_Review.zip` from the AI Visual chat and extract; find `r05/` directory.
2. In your local Git worktree, checkout feature branch (never `main`):
```powershell
git clone https://github.com/nguyenbui5701/OnlinePagodaVer2.git
cd OnlinePagodaVer2
git fetch origin assets/sakura-hero-r04-sa-review
git switch assets/sakura-hero-r04-sa-review
$dest = 'Assets3D/Review/sakura_hero/r05'
# Copy r05/*.glb, r05/*.obj, r05/*.png and r05/*.jpg from the extracted ZIP to $dest
Get-FileHash "$dest/sakura_hero.glb" -Algorithm SHA256
Get-FileHash "$dest/sakura_hero_eco.glb" -Algorithm SHA256
git status --short
git add Assets3D/Review/sakura_hero/r05
git commit -m "assets(visual): upload verified Sakura R05 GLB and preview binary files"
git push origin assets/sakura-hero-r04-sa-review
```
3. Compare every copied file byte size and SHA-256 to this table before committing. If a file differs, leave it pending and report discrepancy. If using Git LFS, verify pointer policy before staging.
4. Tell AI Visual after upload so GitHub file existence/hash may be checked; update manifest from `pending_owner_upload` to `uploaded` **only after direct verification**.
5. SA rechecks exact R05 GLB (not just filename) in Blender + Three.js and gives separate art acceptance. No Codex production integration yet.

No owner video or copyrighted TikTok UI included in the GLB. Software/API cost: **0 VND**.
