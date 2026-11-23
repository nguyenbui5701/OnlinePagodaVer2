# Sakura Hero R13 — independently reviewed owner Cycles evidence

**2026-11-21 SA review #6004407478 — Technical Blender/Cycles evidence PASS; ART PARTIAL; production NOT APPROVED.** Source: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004407478

SA directly examined the owner's exact evidence bytes, not a fresh Blender execution by SA:

- `Sakura_R13_Blender_Evidence_Cycles.zip`: **15,307,370 bytes**, SHA-256 `e9441363da7334c5f43fbfa3fecd535129eeed283a0dfb009eeaefc236529d32`, ZIP CRC PASS, **29/29** archive members other than hash list match filename-associated SHA-256.
- **3/3 cases completed**: `r12_baseline`, `r13_final`, `eco_unchanged`; **18/18 actual Cycles PNG images** match JSON byte sizes and SHA; **3/3 stdout completion markers**, empty stderr.
- **Blender 4.5.16 LTS Cycles CPU**, 32 samples, **AgX 0 EV**, World 0.65 and three fixed Sun lights, glTF +Y → Blender +Z axes; top/three-quarter/under/trunk and both full/close portrait 9:16.
- Original QUALITY `sakura_hero_r13_quality.blend`: **12,822,286 bytes**, SHA `46bda0fb631e56d07d23828ce5322fe90412f282d77c27ec0cd9fc4a20284283`; original ECO `sakura_hero_r13_eco.blend`: **3,936,772 bytes**, SHA `41ea93df79576d9eec9c5f55270c1b9a2d0605345119bc52fe39fc4cff323af3`. Both match ZIP and cases, structurally sound through DNA1/ENDB, no malformed blocks, no trailing bytes.
- Original R13 source SHA-256 from Cycles report: QUALITY `5e03020ac3160d6746b96715254e37290d140a1e7b3cee00708a105d2955e840`, ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`.
- Visual SA assessment: R13 trunk S-bend and helical bark improved but collars still have lump-like protrusions/tube crossings; QUALITY petals remain somewhat paper-flat at close range; full 9:16 fits both crown edges but has excessive vertical empty space; ECO unchanged.

**Do not confuse real owner execution with GitHub upload.** The above evidence ZIP / editable .blend and R13 GLB/OBJ/preview binaries were handed through owner channels, **not confirmed present on this GitHub branch**, where `pending_owner_upload` remains correct. Blender R13 technical PASS does not prove native Three.js GLTFLoader parity, RTX 3050 Ti/RTX 3060 VRAM/FPS under TikTok LIVE Studio, artistic production acceptability, or a merge approval. The previously authored R13 scripts/instructions saying `PENDING` are retained as historical instructions; this post-execution audit supersedes their pre-execution status.
