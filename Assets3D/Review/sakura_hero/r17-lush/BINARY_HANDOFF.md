# AI Visual 16 R17 binary handoff — truthful pending inventory

**Current state:** GitHub branch created from frozen PR #1, original procedural Blender authoring script available. **No R17 binary was generated in AI environment; Blender unavailable and large R16 source binary SHA could not be independently verified through connected GitHub.** Do not treat the following names as existing files on the R17 branch.

| Required new artifact | Planned path within `r17-lush/` | GitHub state | SHA-256 |
|---|---|---|---|
| Original R17 QUALITY GLB2 | `sakura_hero_r17.glb` | `PENDING_NATIVE_EXPORT_AND_OWNER_UPLOAD` | unknown until actual run |
| Original R17 ECO GLB2 | `sakura_hero_r17_eco.glb` | `PENDING_NATIVE_EXPORT_AND_OWNER_UPLOAD` | unknown until actual run |
| Editable Blender source | `sakura_hero_r17_editable.blend` | `PENDING_NATIVE_BUILD_AND_OWNER_UPLOAD` | unknown until actual run |
| Native build audit | `R17_BUILD_RESULT.json` | `PENDING_NATIVE_BUILD_AND_OWNER_UPLOAD` | pending |
| 24 R16-vs-R17 matched Cycles | `R17_Cycles_Evidence/*_cycles.png` | `PENDING_NATIVE_CYCLES_AND_OWNER_UPLOAD` | pending |
| Cycles metadata / output | `R17_Cycles_Evidence/cycles_manifest.json`, `blender_stdout.log`, `blender_stderr.log` | `PENDING_NATIVE_CYCLES_AND_OWNER_UPLOAD` | pending |

**Immutable R16 input names and SHA256:**
- `../r16/sakura_hero.glb` 5,055,232 bytes, `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`.
- `../r16/sakura_hero_eco.glb` 1,393,492 bytes, `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`.

**Run from the actual `r17-lush` folder in a separate new worktree:**
```powershell
& .\run_r17_blender.ps1
```
Optional `-Blender <exact blender.exe path>`. The script refuses a missing, stale or nonmatching R16 GLB; writes an actual new R17 result **only after** its precheck. Do not regenerate historical R16/replace `../r16/` files. Owner uploads only truthful generated outputs, then SHA comparison against `R17_BUILD_RESULT.json`. The `.blend` original R16 exists in `../r16/Blender_Evidence_R16/{r16_final,eco_unchanged}/`, but the R17 generator starts from the **SHA-pinned deployed GLBs** to maintain exact viewer compatibility.

**Gate:** `R17_SA_ART_REVIEW_REQUIRED` / Owner R17 Botanical Hero Art GO pending / no merge or paid service. When owner-run logs/images and GLB blobs exist, AI Visual updates the manifest with **measured** bytes, triangles, bounds, hash and tested Blender source status; until then no legitimate LEVEL 2/3 acceptance.
