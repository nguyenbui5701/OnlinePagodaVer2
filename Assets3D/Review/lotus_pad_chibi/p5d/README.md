# AI Visual P0.5d — Female Cross-Legged Foot Visibility Micro-Polish

**Official task:** [AI_VISUAL_07](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_07_FEMALE_CROSS_LEGGED_FOOT_VISIBILITY.md). PR #2 **DRAFT**, branch `assets/lotus-pad-chibi-p0`, SA-reviewed incoming HEAD `bdb171b82d9ceb8d72bc42ac0ece64cecf4be166`. New folder `p5d/` only. **NO new kneel, male, Codex, runtime, Sakura, lotus, merge.**

## SA issue → exact change → tested evidence

Owner provisionally accepts P0.5c female art but wants a small visible instep in the crossed legs. On real P0.5c GLB, both existing `sandal_trim_SeatRoot_mesh` ellipsoids lie almost completely inside the trouser sweeps. This cannot be fixed by camera rotation or trouser recoloring.

**ONE surgical P0.5d candidate:** gently tuck `54 / 1,538` POSITION vertices of `ao_ba_ba_pants_SeatRoot_mesh` at right-side cuff, max **20.382mm actual vertex movement**. Recompute only **103 associated NORMAL vertices**; original pants face indices unchanged. Add a smooth closed **162-vertex / 320-triangle** skin-tone instep beneath original cuff, on `SeatRoot`, reusing the original `skin_rose_cream` material. Toe tip at +Z≈0.355m; root overlaps the original hidden cuff/sandal area. Existing `sandal_trim` 84 vertices / 160 triangles and original second foot are **byte-identical to P0.5c**. No new shader, toes or nails. Modest visual evidence in full/3⁄4 and 9:16 phone medium. See `P05D_PHASE_A_FINDINGS.md`.

## Actual GLB / provenance

- Baseline P0.5c cross: `424,784 B / 16,864 triangles / 8,636 vertices / 9 meshes / 21 materials`, SHA256 `1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf`.
- New P0.5d cross: `471,252 B / 17,184 triangles / 8,798 vertices / 10 meshes / 21 materials`, SHA256 `0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44` (+320 triangles/+1 mesh; new file-size overhead includes appended binary data and GLB metadata, NOT a measured GPU result).
- **Surgical raw GLB proof:** Original P0.5c GLB BIN data is a byte-for-byte prefix of P0.5d BIN. Unchanged original 8/9 meshes POSITION/NORMAL/index equal. Pants original INDEX arrays equal, only localized vertices modified. **All 21 material JSON definitions, 6 KHR variant mappings, all old anchor values/nodes and 2×17-keyframe animation data unchanged.**
- Kneeling P0.5c remains frozen at SHA `a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac`; no p5d kneeling GLB exists. Frozen lotus SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.
- **Exact reproducibility:** `procedural_female_cross_foot_p05d.py` uses only the SHA-pinned original P0.5c GLB and free numpy/trimesh. A separate CLEAN directory reproduced the NEW GLB with **identical bytes and SHA**. Original historical P0.5c P04/P05 source-dependency gaps remain documented separately; the P0.5d incremental builder does not depend on them.

## Evidence and honest gates

**Executed:** actual imported GLB native VTK PBR, 15 matched viewpoints per revision (front/3⁄4/side/foot macros/9:16), five P0.5d `sit_idle` times t=0,0.5,1,1.5,2 front/side/phone. Unchanged mesh/animation/material audit on genuine exported GLB. The instep is a single connected watertight shell with correct winding, local bounds X0.106…0.174, Y0.015…0.075, Z0.215…0.355. The shortest sampled vertex-to-vertex distances are ≈3.11mm to pants and ≈2.84mm to original sandal: **PROXY_ONLY**, not proof of no real triangle penetration or physically welded attachment. Original real lotus unavailable in local VTK test.

**P0.5d Blender/Cycles and editable .blend: NOT_RUN / NOT_CREATED HERE.** The previously owner-run P0.5c Cycles SA baseline had all 8 stdout complete and selected 6 PNG SHA checks, but full original ZIP CRC/large .blend raw SHA weren't independently rechecked. A free SHA-locked Windows runner recreates P0.5c/P0.5d SAME Cycles cameras, lights, AgX 0EV, 32 samples, 720×1280 9:16, imports actual frozen lotus, and saves **2 P0.5d editable .blend**, review PNG/JSON/logs/hash ZIP. Do not claim new Cycles PASS until owner runs and SA audits actual evidence. Native Three.js/LIVE GPU NOT_RUN.

**Status:** `P05D_FEMALE_CROSS_FOOT_OWNER_REVIEW_REQUIRED`. PR Draft, no merge or new male/Code work. Paid tools/services cost **0 VND**.
