# Zero-cost original Blender P05/P05b Cycles A/B on Windows

Extract \`P05B_FEMALE_HANDS_BLENDER_WINDOWS_STARTER.zip\` into a clean folder. Contains old P05 cross/kneel GLBs under \`p5_baseline/\`, new P05b cross/kneel GLBs, \`blender_p05b_cycles.py\`, \`run_p05b_blender.ps1\`, and SHA manifests.

**Copy the one unchanged ORIGINAL leaf GLB** from cloned PR #2 \`Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb\` to starter \`p02_baseline/lotus_pad_01.glb\` (SHA256 \`80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b6be09\`). Do not re-export.

PowerShell (adjust repository path):

\`\`\`powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05b_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05b_blender.ps1 -Mode all -Samples 32 -Size 520
\`\`\`

Supply \`-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'\` if needed. Full includes eight cases (4 old/new cross/kneel actors, 4 corresponding real frozen-leaf pairs), 5 glTF imported sit_idle stages × front/side for both NEW actor poses, and medium/close 9:16 rendered at **720×1280**. Same old P05 cameras for matched original/new shots; two supplemental quarter-hand and torso cameras. The launcher fails fast on input hash mismatch, Python exit error, missing PNG and report SHA mismatch; full clears quick evidence. On success produces \`P05B_Cycles_Evidence\`, \`P05B_FEMALE_HANDS_Blender_Cycles_Evidence.zip\` and **four P05b .blend** files under actor/pair case folders. Share actual ZIP + .blend with SA. No claim that these exist before owner's run.

STOP: PR Draft, owner gate pending, no male/Codex/merge.
