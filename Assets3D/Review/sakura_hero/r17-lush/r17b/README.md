# R17b — layered Sakura correction / preview gate

SA R2 [#6032915176](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6032915176), exact previous reviewed `8381da2c19da01e8270f0f41283eabd5c4d16a46`. One candidate on same PR #18. Old R17 source/GLBs/.blend/24 Cycles/six sheets stay untouched. R16 source GLBs SHA-pinned. No new runtime or R18.

## Concrete design
- Detect original R16 canopy cores by connected components in Blender native import. Use 16 azimuthal sectors and actual outer lobe anchors rather than random scattering on existing dense flower faces.
- 16 outer shoulders with staggered height and 1.05–1.75m radial displacement, 8 bridges between adjacent lobes and 6 selective lower skirts; volumetric ellipsoid surface with varied depth/warp. No solid new core hulls, central branch sightline retained; final clearance must be visually checked. All new cluster centers anchored to original crown.
- ECO: adjust seven original Canopy/Sakura_petal materials only, replacing the pale bright palette and excessive emission with warm rose/shadow tones. New five-petal cupped clusters and selective darker underside; QUALITY uses 4 triangles/petal, ECO 2, both indexed. 30×76 flowers QUALITY / 30×46 ECO, design totals 236888/58212 triangles. Actual data from native preview, not preclaimed.
- Compact reversible GLB append: original BIN bytes, original node/accessor/bufferView/mesh arrays and all protected material factors unchanged; new 3 layer nodes, 4 tones, indexed POSITION/NORMAL plus 16-bit indices when safe. Existing R16 lacks serialized normals, retained exactly; new geometry has calculated area-weighted normals. No removal of existing normals or unmeasured performance claims.
- Candidate is tested by GLB2/accessor/indices finite checks, degeneracy count, native import full bounds/root transforms/protected PBR + triangle counts. Exact original buffer/accessor/node comparison is stronger evidence for original wood indices/winding than the previous quantized triangle check. SA independent access still pending.

## Owner run — preview only
From the existing `r17-lush` worktree, first ensure no unrelated changes. Then:

```powershell
git pull --ff-only origin assets/sakura-hero-r17-lush
Set-Location .\r17b
& .\run_r17b_preview.ps1
py .\make_r17b_preview_sheets.py
```

Pillow used by previous sheets; if not installed, `py -m pip install Pillow`. Runner detects Blender or use `-Blender 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`. No full render invocation available at this stage. Blender 4.5.16+ required; scripts not executed in AI worker.

Expected **after a successful actual run**:
- `preview/sakura_hero_r17b.glb` and `preview/sakura_hero_r17b_eco.glb` are real preview candidate exports. They are not final accepted assets. Actual checksums in `preview_manifest.json`.
- 18 native 360×640, 8-sample Cycles PNGs, matched R16/R17/R17b full/wide/under-crown for both LODs, shared R16 lighting and AgX/None/EV0; full and wide camera fit computed once against union actual bounds, no clipping of tree bounds. Under-crown intentionally close. No runtime rings/reflection proof.
- Three `*_ABC.jpg` under 1 MiB, `preview_sheet_manifest.json` containing image SHA and noise-inclusive pixel difference proxies. No arbitrary numeric art PASS threshold.
- Native logs `blender_preview_stdout.log`, `blender_preview_stderr.log`, marker `R17B_PREVIEW_COMPLETE 18 PNG; STOP BEFORE FINAL CYCLES`.

Submit **only `r17b/preview/` outputs**, no unrelated files or caches, on same branch. Preview art review checks meaningful silhouette, warm pink layer depth, ECO flower shape, visible branch clearance and unmodified trunk/root/gold. If preview inadequate, report to SA and stop; don't execute whole Cycles set or start another iteration without direction.

## Next gate (not yet authorized)
Once preview accepted, use exact accepted candidate hashes for final GLB and separate editable Blender collections; no re-export of base geometry. Native verify candidate and reopen .blend, render final 720×1280/32 samples six matched views (full/wide frame entire tree, true aerial, under, close, trunk); reuse historical same-rig reference images when valid, regenerate only necessary cases. Record real world bounds, measured vertex/index/NORMAL bytes, checksums and final sheet index. Supply exact new GLBs/.blend plus two R16 GLBs for independent SA via ZIP if necessary. No final Owner GO, merge, viewer integration, RTX/LIVE. **STOP `R17_SA_ART_REVIEW_REQUIRED`.**
