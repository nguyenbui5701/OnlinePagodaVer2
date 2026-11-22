# P0.5e — Windows Blender true Cycles owner A/B, free tooling

Extract `P05E_BLENDER_WINDOWS_STARTER.zip` in a clean directory. Already included: **old P05d GLB**, **new P05e GLB**, `blender_p05e_cycles.py`, `run_p05e_blender.ps1`, camera manifest. SHA-gated original pad from PR #2 still needs manual copy once:

```powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
Get-FileHash -Algorithm SHA256 .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05e_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05e_blender.ps1 -Mode all -Samples 32 -Size 520
```

Adjust the D: checkout path if needed. Runner checks all three original GLB SHA values (old/new/pad), locates Blender 4.5+ (or use `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'`), captures stdout+stderr and fails on nonzero exit (`--python-exit-code 97`) or missing/mismatched PNG. Full run creates four cases P05d old actor/pair, P05e new actor/pair, with identical original front/both 3/4/side/foot/720x1280 medium+close cameras, **additional matched side/low-side/under-3/4 waist diagnostics**, and five imported idle phases each revision. The original real P0.2 lotus is imported in the pair cases. Cycles CPU 32 samples AgX 0EV World .65 and fixed 3 SUN lamps. Two new editable Blender `.blend` actor and review-pair files are saved by Blender for P05e. ZIP `P05E_FEMALE_FOOT_Blender_Cycles_Evidence.zip`, PNGs, case JSON, SHA list, stdout/stderr exist ONLY after the owner has run this.

**Do not treat prior P05d Cycles evidence as P05e Cycles PASS.** Return exact original ZIP and 2 .blend to SA, who inspects side/low-angle at 0,.5,1,1.5,2 and foot. No owner ART OK, male work, runtime or merge until explicit approval.
