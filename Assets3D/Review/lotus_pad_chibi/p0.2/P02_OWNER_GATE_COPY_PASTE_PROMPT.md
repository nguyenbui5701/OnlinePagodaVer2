# Copy-paste ready owner/SA request — P0-02 art approval gate

## Task

Continue AI Visual P0-02 from source task https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_02_ART_REFINEMENT_AND_OWNER_GATE.md on **existing Draft PR #2**, branch `assets/lotus-pad-chibi-p0`; SA-reviewed immutable p0.1 HEAD **`e8eb34c5d405e308e616c89cd385eb5d1d342b2f`**, review https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6005380374. Do not update p0.1 GLB/media or restart Codex #3/#4/integration.

### Prioritized findings

P0: leaf should not read as a thick flat disc at waterline; reduce uniform straight spokes, maintain raised notch and seat support. P1: chibi cap/bun hairline needs softer layered asymmetry without changing calm expression/pose. P1: compare medium/close 9:16 real seated pair composition with fixed camera/light/exposure against actual owner video 3/9/42s, excluding TikTok UI. Do not inflate crowd geometry/LOD without evidence.

### Phases

1. Check original p0.1 two exact GLBs SHA    `0c80e5d4b2590716fdf9a985340fe2446af7ecc056727a03b82a3997db52bba5`,    `f4e184b57046ad442183931bf9fd2f6d7953000ea07270458e291f627f787d2b`. Rerender actual p0.1 at new **shared** rig. p0.1 owner Cycles (30/30 ZIP member SHA/18/18 PNG/3 blends) verified PASS, owner art not approved.
2. Use exact p0.2 art candidate: pad GLB `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9` (262,108 B, 10,648 triangles); chibi GLB `83009fab6f4f00730260ef70dcd4d8605b2c634bc99f1fd6e34a1030833abd4c` (216,012 B, 8,906 triangles). Source files and manifest under `Assets3D/Review/lotus_pad_chibi/p0.2/` on PR #2. Preserve p0.1 contract: seat +Y=.195m, local actor +Z and origin 0, Head [.0,.835,.04], Nameplate [.0,1.335,.03], FX [.37,.805,.16], 2s/17-keyframe native glTF `sit_idle`.
3. Run actual zero-cost Blender Cycles A/B on owner Windows using `run_p02_blender.ps1 -Mode all -Samples 32 -Size 520`: pad top/side/waterline, chibi front/side/three-quarter/back, paired front/3-4/**medium & close 9:16**, idle t=0/.5/1/1.5/2 for both revisions. Verify same camera, SUN lighting, AgX 0EV, original GLB import. Upload evidence ZIP plus p0.2 `lotus_pad_01_p02.blend`, `meditator_base_p02.blend`, `lotus_chibi_pair_review_p02.blend`; record SHA-256, file bytes, tris/meshes/materials, contact/anchor report. Native Three.js and RTX+LIVE Studio remain NOT RUN.
4. SA reviews actual A/B Cycles PNG/JSON and original .blend, visual gap vs owner reference, declares technical PASS/PARTIAL. Show owner two clear images **p0.1 vs p0.2**; ask only **`OK p0.2` / `KEEP p0.1` / `REVISE: ...`**.

**HARD STOP:** Until the owner explicitly selects/approves visual result, record `ART_OWNER_PENDING`, PR #2 Draft, no merge, Codex #3/#4 ON HOLD, integration NOT STARTED. Zero paid tools and no unrelated branches/assets touched.
