# R17b — run final evidence only

SA accepted preview [R3 #6033131258](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6033131258) at `29790122d2aae80b9be6fd6852a881be21a7fc10`. Do not run `run_r17b_preview.ps1`, `run_r17_blender.ps1` or `audit_r17_read_only.py` again. No export. The two existing `preview/*.glb` are canonical final delivery, frozen by exact SHA. See [root README](../README.md) and [manifest](../asset_manifest.json).

## Owner run (Windows)
In the existing clean R17 artist worktree, inside `r17-lush/r17b/`:

```powershell
git status --short
git pull --ff-only origin assets/sakura-hero-r17-lush
& .\run_r17b_final.ps1
```

Use the same Blender **4.5.16 LTS** as the previous build and preview; if autodetection finds a different version, supply `-Blender 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with the actual path. Pillow already used for preview sheets; if missing, `py -m pip install Pillow`. Runner executes final-only Blender then sheet generation. If interrupted, rerun the same runner: per-frame checkpoint reuses existing matching SHA/settings frames and valid editable receipt. If a checksum or material/visibility check fails, stop and send logs. Do not rerender the previous preview or edit any GLB.

### Actual output paths (not yet generated)
- `final/sakura_hero_r17b_editable.blend`, `final/editable_reopen.json`: two editable collections with verified separate visibility.
- `final/*_cycles.png`: 18 new native images, 12 R17b + six R16 (full/wide/true overhead). Six original R16 under/close/trunk reused by SHA from `../R17_Cycles_Evidence/`. `final/cycles_manifest.json` indexes all 24; 720×1280, 32 samples, same rig within pairs. No extra R17 set.
- `final/*_AB.jpg`: six compact sheets and `final/sheet_manifest.json`.
- `final/R17B_FINAL_RESULT.json`, `final/final_manifest.json`, `final/owner_sha256.txt`, `final/blender_final_stdout.log`, `final/blender_final_stderr.log`, `final/blender_exit_code.txt`.
- `final/render_checkpoint.json` local retry cache, ignored by Git; `.blend1`/tmp ignored. Generated evidence text stored without line-ending conversion to preserve reported checksums.

Success markers: `R17B_FINAL_APPROVED_GLB_SHA_LOCK_PASS`, `R17B_FINAL_EDITABLE_REOPEN_PASS` (or verified reuse), `R17B_FINAL_COMPLETE 12 R17B + 6 NEW R16 + 6 REUSED R16`, `R17B_FINAL_SHEETS_PASS 6`, `R17B_FINAL_EVIDENCE_READY_OWNER_UPLOAD`.

Review six real A/B sheets before uploading; inspect ECO underside, crown close, overhead, rounded lobes, branch windows, gold. If issue, report it without auto-changing geometry. After success stage only new final evidence:

```powershell
git add -- .\final\
git diff --cached --stat
git commit -m "evidence(r17b): add frozen candidate editable source and final native Cycles"
git push origin assets/sakura-hero-r17-lush
```

Send exact new HEAD. Root manifest/README/BINARY_HANDOFF/PR description will then be reconciled against real remote final inventory; no claim of upload before it exists. For independent SA attach ZIP with both canonical R17b GLBs, final editable .blend and both original R16 GLBs (five files; keep ZIP outside repo, no duplicate commit). SA independent SHA pending. No final art acceptance or merge. **STOP `R17_SA_ART_REVIEW_REQUIRED`.**
