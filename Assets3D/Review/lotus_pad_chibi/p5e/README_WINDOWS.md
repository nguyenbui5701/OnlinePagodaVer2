# Free Windows Blender 4.5+ — real P05d vs P05e Cycles A/B

Extract `P05E_FOOT_WAIST_BLENDER_WINDOWS_STARTER.zip` in a clean directory. It already includes exact old P05d GLB, new P05e GLB, `blender_p05e_cycles.py`, `run_p05e_blender.ps1`, camera/manifest. Copy just the original P02 lotus from checked-out PR #2:

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
Get-FileHash -Algorithm SHA256 .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05e_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05e_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust repository and Blender paths when necessary (`-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`). Script aborts if any SHA mismatches, missing input/Blender, nonzero Blender/Python exit via `--python-exit-code 97`, missing case report/PNG or wrong PNG SHA/bytes. Full mode clears any previous quick evidence, runs **four matched cases** `p05d_cross_actor,p05e_cross_actor,p05d_cross_pair,p05e_cross_pair`, reimports actual original P02 leaf in pair cases, uses unchanged fixed P05d camera/light/AgX 0EV/Cycles CPU32 world .65/3 SUN lamps, and adds **labeled matched low-side waist diagnostics** for old and new. Actor and pair include true five idle frames for t=0/.5/1/1.5/2, max +16mm original action. 9:16 medium/close full resolution **720x1280**. The result is `P05E_FEMALE_FOOT_Blender_Cycles_Evidence.zip` with PNG/JSON/logs/SHA and two **new editable .blend** actor/review pair for P05e. These are not present before the owner runs it.

**SA gate:** Send original evidence ZIP and two .blend to SA, who inspects foot silhouette/front/3⁄4/side plus low-side waist at five frames and verifies SHA/CRC. Only owner may finally approve. No male, Codex or merge.
