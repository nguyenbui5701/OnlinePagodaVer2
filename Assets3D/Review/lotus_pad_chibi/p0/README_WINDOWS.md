> **Post-execution status (SA review #6005380374):** genuine owner p0.1 Blender/Cycles **3/3 cases, 18/18 PNG, 30/30 ZIP SHA and 3 original .blend file-integrity PASS**. These Blender files are owner-controlled, **not uploaded into PR**. The older pre-run instructions below are historical. **ART_OWNER_PENDING**, no merge or Codex. See [P0_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md](P0_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md).

# P0-01 Windows Blender 4.5+ / Cycles

Unzip the supplied starter ZIP. It contains two SHA-pinned real GLBs, `blender_cycles_validate_and_save.py` and `run_p0_blender.ps1`. Install only free Blender.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p0_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p0_blender.ps1 -Mode all -Samples 32 -Size 520
```

Or add `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` with the actual path.

Quick: render joint preview with three views and save `lotus_chibi_seated_review.blend`. Full: import/save separate `lotus_pad_01.blend` and `meditator_base.blend`, create paired review project and render actual Cycles front/side/back/top, water-level, 9:16, anchor debug and `sit_idle` time slices. Script checks SHA inputs, uses true glTF PBR with Cycles CPU, AgX, 0EV, fixed scene lights, and stops if Blender fails to import animation/nodes. Stores reports/logs/hash list and ZIP.

**The producing AI environment cannot run Blender. These evidence files are not claimed to exist until owner actually runs the package.**

**Path hygiene for reruns:** extract into a dedicated lotus-pad-chibi directory, not a Sakura review directory; older original owner logs embedded an unrelated `sakura_hero/p0` path but their files/hashes were internally valid. This historical p0.1 starter is not the p0.2 A/B starter.
