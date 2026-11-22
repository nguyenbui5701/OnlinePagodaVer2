# P0.5d SHA-locked Windows Cycles A/B (cross-legged ONLY)

Extract \`P05D_FOOT_BLENDER_WINDOWS_STARTER.zip\` into a folder with \`p05c_baseline/meditator_female_cross_prayer_p05c.glb\` (SHA \`1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf\`) and \`meditator_female_cross_prayer_p05d.glb\` (SHA \`0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44\`) already in the starter.

Copy ORIGINAL frozen P0.2 leaf from your PR #2 checkout \`Assets3D/Review/lotus_pad_chibi/p3/lotus_pad_01.glb\` into \`p02_baseline/lotus_pad_01.glb\` (SHA \`80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9\`). Adjust repo path:

\`\`\`powershell
New-Item -ItemType Directory -Force .\p02_baseline | Out-Null
Copy-Item 'D:\Vibecode\onlPagodaV2\OnlinePagodaVer2\Assets3D\Review\lotus_pad_chibi\p3\lotus_pad_01.glb' .\p02_baseline\lotus_pad_01.glb
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05d_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05d_blender.ps1 -Mode all -Samples 32 -Size 520
\`\`\`

All three SHA checks fail before Blender if source data mismatch. Supply \`-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'\` if not discovered.

Four cases: p05c_cross_actor, p05d_cross_actor, p05c_cross_pair, p05d_cross_pair (original lotus in pairs), original glTF imports. Frozen rig: Cycles CPU/32 samples, AgX/0EV, World .65, three fixed SUN key/fill/rim. Front, left/right 3/4, true side, foot macros, waterline/quarter, 720×1280 portrait medium + close; five true P0.5d idle times front and side foot macro. Saves **2** new editable \`.blend\` (p05d actor and review pair), true PNGs, JSON, stdout/stderr and SHA256 hash list, zip \`P05D_FEMALE_FOOT_Blender_Cycles_Evidence.zip\`. Full mode overwrites quick evidence; retain full result. No kneeling re-export or Cycles rerun. Blender/Cycles status remains NOT_RUN until owner executes and returns exact files.
