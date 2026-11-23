# P0.5c true Blender Cycles A/B — Windows owner instructions

Extract `P05C_FEMALE_PALMS_BLENDER_WINDOWS_STARTER.zip` to its own folder. It includes exact P0.5b and P0.5c actor GLBs and the SHA-gated runner plus all necessary source scripts. **Do not change original P0.5b GLB on the PR.** Supply the original frozen P0.2 leaf to `p02_baseline/lotus_pad_01.glb` from your checked-out repo `Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb`. Expected SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05c_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05c_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust repository path/`-BlenderPath` for your Blender installation. The launcher verifies 5 input GLB SHA256s before Blender, uses `--python-exit-code 97`, captures stdout/stderr, checks PNG hashes and aborts on any mismatch. Full clears previous quick evidence. Full produces 8 old/new actor+pair cases, 4 new editable P0.5c `.blend` files (two actor + two review-only pair), PNGs, case JSONs, logs, global SHA list and `P05C_FEMALE_HANDS_Blender_Cycles_Evidence.zip`. On Windows after full completion, send that original ZIP AND all four new `.blend` to SA for **independent** review; do not mark Cycles PASS beforehand. PR #2 Draft / no male/Codex/merge.
