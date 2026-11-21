# P0.3 hair-only / portrait Blender Cycles A/B — free Windows runner

Extract the owner ZIP in its own folder with **four exact GLBs**:
\`p02_baseline/lotus_pad_01.glb\` (same P0.2 leaf), \`p02_baseline/meditator_base.glb\`, \`lotus_pad_01.glb\` (SHA-identical P0.2 leaf) and \`meditator_base.glb\` (P0.3 chibi), plus \`blender_cycles_ab_p03.py\` and \`run_p03_blender.ps1\`.

Open PowerShell in that extracted directory:

\`\`\`powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p03_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p03_blender.ps1 -Mode all -Samples 32 -Size 520
\`\`\`

If auto-detect fails add \`-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'\` with your installed path. SHA checks run before Blender. Native stderr/logs captured, \`--python-exit-code 97\` to detect Python errors. Full mode clears previous quick evidence before generating fresh reports.

Four cases \`p02_actor\`, \`p03_actor\`, \`p02_pair\`, \`p03_pair\`; fixed matching Cycles CPU **32 samples, AgX/0EV, World .65, three SUN lamps**. Actor front/side/3-4/back plus **5 real sit_idle phases**; pair front/3-4/old medium/new refined medium/close 9:16. **28 PNGs expected** in full run, plus JSON, logs, SHA list and new \`meditator_base_p03.blend\` and \`lotus_chibi_pair_review_p03.blend\` (pair for review ONLY). Reuse P0.2 leaf .blend; leaf unchanged.

Output \`P03_LOTUS_CHIBI_Blender_Cycles_AB_Evidence.zip\`. Send original ZIP and two .blend files to SA for actual Cycles SHA/visual audit. **Do not claim Cycles PASS before owner runs it.** P0.2's previously passed evidence is a separate historical baseline.
