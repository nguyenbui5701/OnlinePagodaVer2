# AI Visual 16 — Sakura R17 Lush Radiant Blessing Tree

**Separate artist branch:** `assets/sakura-hero-r17-lush` from **exact immutable PR #1 R16 HEAD** `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9`. Draft PR stacked on `assets/sakura-hero-r04-sa-review`. Read-only [Viewer PR #17](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/17) at `1201369e019f6ba04f7437c7dac347e56894ba2a`. See [Task AI Visual 16 §6](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_16_P10B3C_R17_LUSH_BLESSING_TREE.md).

## Current truth and hard blocker

This GitHub commit contains a reproducible R17 **original procedural Blender authoring script and QA recipe**, plus verified **R16 repository metadata and historical native Cycles evidence**. **It DOES NOT contain real R17 GLBs, new .blend or R17 Cycles yet**; no invented hash, geometry result, image, import test or SA Art PASS.

**Why:** The original R16 GLBs are real Git blobs with correct metadata in PR #1, and two genuine R16 editable .blend sources plus R16 Cycles were located in `Blender_Evidence_R16`. However this AI Visual runtime has no Blender and its connected GitHub binary transport returned **empty/undecodable payload for the 5.05MB/1.39MB GLBs**. Consequently **independent R16 bytes/SHA audit could not finish**. Per Task §6 hard hold, **model production is blocked until the Owner runs the exact original-source SHA gate**; do not guess R16 geometry or claim the scripted outputs already exist. The old R16 manifest's `pending_owner_upload` descriptions are historical/stale, not proof of absent GLBs.

## R17 bounded design (to be validated in real Blender)

Rather than rebuilding trunk and roots, the generator imports **both original SHA-gated R16 GLBs**, samples **actual imported canopy mesh faces** (`Canopy_*` and `Sakura_petal_*`), and places deterministic original 3D cupped, double-sided blossom florets with three restrained rose/blush/peach materials and muted gold centers, with 3-D spacing and variable depth. Open gaps remain around the inner branches. Original R16 meshes and their PBR materials are not rewritten intentionally, while the resulting GLB exporter may restructure scene metadata and therefore the **R17 hashes are newly generated, not R16 hashes**.

| Profile | Frozen R16 tris | Added florets (design) | Target additional tris | R17 strict cap |
|---|---:|---:|---:|---:|
| QUALITY | 191,288 | 1,200 | ~28,800 | 250,000 |
| ECO | 44,412 | 420 | ~5,040 | 60,000 |

These are **design/algorithm targets, not executed R17 measurements**. A true geometry delta, mesh counts, output bounds, origin, GLB2 SHA256 and actual file lengths are collected by the real Blender script. Root/worldline `(0,0,0)`, +Y meters, aged dark bark, gold ribbon materials and major branches remain from pinned R16. Secondary interface candidates 45/68 remain a known **proxy risk**, not quietly marked repaired.

## Owner native production on a separate R17 worktree (0 VND)

Checkout only the dedicated new R17 branch/worktree. From the repository root, for a local branch not already checked out:

```powershell
git fetch origin assets/sakura-hero-r17-lush
git worktree add -b assets/sakura-hero-r17-lush .\ReviewPR\R17_Artist origin/assets/sakura-hero-r17-lush
Set-Location .\ReviewPR\R17_Artist\Assets3D\Review\sakura_hero\r17-lush
& .\run_r17_blender.ps1
```

If PowerShell cannot locate Blender, use `& .\run_r17_blender.ps1 -Blender 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with the **actual** installed location. `-SkipRender` may be used for an isolated build smoke, but **does not satisfy the Cycles gate**.

The runner verifies the **source R16 QUALITY/ECO bytes and SHA-256 before creating R17**, then invokes `author_r17_blender.py`, creates `sakura_hero_r17.glb`, `sakura_hero_r17_eco.glb`, `sakura_hero_r17_editable.blend`, and `R17_BUILD_RESULT.json`. On a full run, it renders **24 authentic 720×1280 Cycles** (6 matched cameras × R16/R17 × ECO/QUALITY) and writes `R17_Cycles_Evidence/cycles_manifest.json`, plus native stdout/stderr. The A/B rig uses the same fixed R16 three-SUN setup, AgX/None, exposure 0, 32 samples; its illustrative water plane is **render-only** and no reflection code is added to the app. The full 12-pad ring runtime cannot be claimed from Blender portraits.

**Upload only actual generated R17 files and logs** to the same new artist branch after local checksum verification. Update `asset_manifest.json` with actual bytes/SHA/triangles and mark `uploaded` only after remote binary re-fetch/verification. Contact SA with actual tree/petal-close, under-crown, ring-style aerial and wide/water-facing Cycles screenshots. Do not overwrite any R16 tree or other asset source; no source branch force-push or merge.

**STOP: `R17_SA_ART_REVIEW_REQUIRED`**; `R17_BOTANICAL_HERO_ART_GO` remains PENDING, native Viewer integration/RTX/LIVE remain on separate holds.
