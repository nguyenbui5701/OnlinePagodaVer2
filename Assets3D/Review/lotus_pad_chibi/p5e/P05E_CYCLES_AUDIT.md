# P05e renderer evidence audit — do not mislabel VTK as Cycles

**Executed locally:** Actual SHA-pinned P05d/P05e raw GLBs reimported into trimesh and the VTK glTF importer with PBR materials, same fixed cameras/lighting; 19 original + diagnostic angles, 5 imported `sit_idle` phases for old and new including true low side. Original animation Y values at t=0/.5/1/1.5/2 were 0/8/16/8/0 mm. Actor-only old/new waist ray-triangle test (`vtkOBBTree`) over 725 rays each of left/right horizontal/low-up camera sampling windows at each of 5 times: **old 19.172–57.379% rays hit background; new 0%**. This is a windowed *occlusion* proof, not an assertion that garments have zero contact/intersection errors from all angles.

**NOT EXECUTED:** Blender is unavailable in this Python container. P05e true Blender/Cycles 32-sample actor/pair, editable .blend, original P02 lotus seated collision, native Three.js, GPU/LIVE Studio have **NOT RUN**. Original P05d owner Cycles 4/4 PASS is an earlier version only. The free Windows starter requires the exact original P02 pad, has original SHA checks, 4 matched cases, old/new low/side t0/.5/1/1.5/2 and original 720x1280 9:16 medium/close. Do not publish a fake Cycles image or SHA/ZIP for missing data.

**Gate:** Keep PR #2 Draft, owner art PENDING until original Cycles/Blender projects submitted to SA and owner explicitly approves.
