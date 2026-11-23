# P0.3 — conservative chibi hair + 9:16 portrait refinement (owner art gate)

**Scope:** OnlinePagodaVer2 [PR #2](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2) **DRAFT**; branch `assets/lotus-pad-chibi-p0`, based on SA-reviewed P0.2 HEAD `28d895ee1fc6c17d4d9388c05040193e607292fc` and [SA review #6005994936](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6005994936). Art-only. **NO Sakura, runtime, integration, Codex, or merge.**

## Keep P0.2 leaf byte-for-byte
P0.2 lotus GLB **262,108 bytes, 10,648 triangles**, SHA-256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`. The P0.3 generator reproduces exactly the same bytes, but runtime should continue referencing the existing committed P0.2 GLB; **do not overwrite or duplicate the P0.2 GitHub asset**.

## Chibi changes only in hair
P0.2 actor GLB **216,012 bytes / 8,906 triangles**, SHA `83009fab6f4f00730260ef70dcd4d8605b2c634bc99f1fd6e34a1030833abd4c`. New P0.3 GLB **212,040 bytes / 8,724 triangles / 4,463 vertices / 11 meshes / 8 materials**, SHA `646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0`.

The original four bulky frontal cylinders were replaced by **two narrow curved scalp-conforming tapered hair contours**, a continuous subtly scalloped hairline on the original cap and one small rear-bun connector. Hair roughness changed .66→.72 and blue-black subtly lightened. **Independently inspected actual glTF GLBs:** only `hair_blue_black_UpperBodyBreath_mesh` changed (1,462→1,280 triangles), other ten mesh vertices/faces identical, all other material properties exactly unchanged. Face/closed eyes/smile, costume, hands, leg cross, actor identity and 2-second/17-keyframe `sit_idle` unchanged. Combined pad+actor triangles **19,554→19,372** (−182, −0.93%).

## Interface preserved and tested
P0.2 `PadSeatAnchor=[0,.195,0]`; chibi `SeatRoot=[0,0,0]`, `HeadAnchor=[0,.835,.04]`, `NameplateAnchor=[0,1.335,.03]`, `FXAnchor=[.37,.805,.16]`; +Y-up +Z-forward. Animation timestamps and all `UpperBodyBreath.translation` sample arrays byte-identical to P0.2. Actual GLB triangle barycentric seat contact **658 samples, min 14.818 mm gap, zero penetration >5mm** at actor placement Y=.195 **once**.

## Same-camera portrait comparisons (9:16)
Three P0.2/P0.3 shared cameras (same lighting): **old MEDIUM** (1.75,1.26,4.1) FOV47 keeps entire pad but wastes top frame; **refined MEDIUM** (1.18,1.29,2.92), target (0,.61,0), FOV42 puts **100% actor vertices in frame** but **deliberately crops 16.48% peripheral pad vertices**, ≈9% of all scene vertices; **CLOSE** (1.3,1.22,2.55) FOV43 is a deliberate tighter leaf crop. These are art cameras only; **no GLB geometry or runtime camera changed**.

## Evidence status
- **Executed:** real GLB native trimesh/VTK PBR import, 13 A/B camera poses per revision, five true native animation phase samples per revision, fixed warm key/lilac fill/rose rim, no Phong overrides; verified clean source reproducibility exact SHA.
- **P0.2 OWNER CYCLES TECHNICAL PASS** from SA review: 6/6 cases, **32/32 actual PNG SHA**, original P0.2 .blend Git blobs exist but original raw binary SHA-256/ZIP CRC not independently checked due GitHub connector size limits. See `../p0.2/P02_OWNER_CYCLES_SA_AUDIT.md`.
- **P0.3 Blender Cycles NOT RUN, P0.3 editable .blend NOT YET CREATED**. Free owner Windows starter with 4 SHA-locked GLBs and 4 cases (actor + pair × P0.2/P0.3) supplied; same AgX 0 EV/World .65 and three SUN lamps with **28 true Cycles stills expected if full run completes**. No invented Cycles or Blender evidence.
- Native Three.js, GPU/LIVE Studio not run. **ART_OWNER_PENDING**, production not approved, PR #2 Draft, Codex PR #3/#4 and integration on hold.

**Deliverables:** `procedural_lotus_pad_chibi.py`, `render_ab_pbr.py`, `blender_cycles_ab_p03.py`, `run_p03_blender.ps1`, `asset_manifest.json`, `P03_VALIDATION.json`, `P03_CAMERA_CONTRACT.json`, `BINARY_HANDOFF.md`. Actual new GLB/large render images are **owner-download handoff with SHA** until GitHub binary upload is verified. See owner package.

**Owner's decision required after real Cycles A/B:** `OK P0.3` / `KEEP P0.2` / `REVISE HAIR / CAMERA` with the affected view. Do not automatically treat SA advice as owner approval.
