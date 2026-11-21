# AI Visual P0-02 — Owner-directed visual refinement and ART ACCEPTANCE GATE

**Status:** HISTORICAL P0.2 visual-refinement task; P0.3 baseline now available. **Current assignment is [AI_VISUAL_03 female áo bà ba + long hair](AI_VISUAL_03_FEMALE_AO_BA_BA_LONG_HAIR.md)**. Its owner visual gate remains open; do not restart Codex. 

**Previous status:** ACTIVE — VISUAL-ONLY. **Owner direction:** 2026-11-21: focus solely on appearance of the 3D lotus pad + seated chibi; **do NOT advance Codex/integration until owner explicitly approves this artwork**. Source of truth: [AI Visual PR #2](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2), review HEAD `e8eb34c5d405e308e616c89cd385eb5d1d342b2f`. All files/claims must be grounded in actual GLB and owner Cycles evidence. Keep Sakura R16 art-frozen.

## Required prompt and handoff format — follow Sakura process

**Must follow [Design/07 — SA prompt-writing rule](../Design/07_WORK_RULES.md)** and the phase/evidence style used in [Design/15 Sakura example](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md). Treat this `Task/AI_VISUAL_02` file as the authoritative detailed assignment and use a **standalone, copy-paste-ready** prompt. For p0.2, include: exact PR #2/head baseline, SA review URL, prioritized visual findings, immutable p0.1 baseline, Phase 1→4 action plan, true Cycles A/B views, GLB/BLEND/idle/anchor preservation, SHA+bytes+triangles, zero-cost, branch paths and large-binary handoff; end with explicit **owner image approval gate**. Do **not** copy legacy Sakura R04 SHA values. Do **not** restart Codex before owner says OK.

## Source and known evidence

- Main task [AI_VISUAL_01](AI_VISUAL_01_LOTUS_PAD_CHIBI.md); [Design/13](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md); [Design/16](../Design/16_P0_APPROVAL_AND_HANDOFF.md).
- Owner independently supplied genuine Blender/Cycles ZIP `P0_LOTUS_CHIBI_Blender_Evidence_Cycles.zip`; SA verified its PNGs and three Blender files. [Review #6005380374](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6005380374): **asset technical prototype PASS, owner art approval PENDING**. Current GitHub PR #2 README/manifest still say `PENDING_OWNER_BLENDER_RUN` and must be updated to owner-run verified PASS in small documentation only.
- Current source GLBs are real and on branch: `lotus_pad_01.glb` SHA256 `0c80e5d4b2590716fdf9a985340fe2446af7ecc056727a03b82a3997db52bba5`; `meditator_base.glb` SHA256 `f4e184b57046ad442183931bf9fd2f6d7953000ea07270458e291f627f787d2b`.
- **Do not auto-modify the current approved interface**: `PadSeatAnchor=[0,0.195,0]`, actor `SeatRoot=[0,0,0]`, `HeadAnchor=[0,0.835,0.04]`, `NameplateAnchor=[0,1.335,0.03]`, `FXAnchor=[0.37,0.805,0.16]`, `sit_idle` = 2 s hierarchical breathing. If geometry/scale forces anchor adjustments, supply measured new manifest and clear backwards-incompatible version; do not silently reuse old positions.

## Visual-only observations on actual current Blender Cycles

1. **Lotus leaf top/side:** true 3D notch, veins, rounded jade edges and underside exist, but side profile reads as a mostly flat, thick disc; veins are very regular radiating straight from the center. Study subtle asymmetric upward/downward curvature, softer thin-rim transition and less uniform biological vein hierarchy while retaining real seating/support.
2. **Seated chibi front/side/back:** calm smiling closed-eye meditation, legs crossed, compact outfit are readable. Hair reads as a smooth cap with an isolated rear bun; test a slightly more organic layered fringe/part and hairline and balanced head/body/hand silhouette; preserve original chibi personality and the serene expression. Do not aim for realism or copyrighted characters.
3. **Pair 9:16/full/close:** existing pair is usable prototype but subject is small relative to the frame in some shots and lighting is purple-gray/dull; offer one proper clean **medium 9:16 hero** and one tight chibi+pad close-up. Match video `chuav2.mp4` ~3s/~9s/~42s from **real owner reference when available**; avoid inventing unverified exact-video features.

## Required iterative work

- Keep **CURRENT** PR #2 files as immutable `p0.1` comparison baseline. Produce **one conservative `p0.2` visual candidate**, with additional optional leaf and hair A/B details if helpful; do not radically redesign without owner input. No blanket polygon inflation; measure triangles/bytes and keep cost appropriate for instancing 10/30/100 avatars later.
- Export *real* editable Blender + separate glTF2 `lotus_pad_01.glb` and `meditator_base.glb`, original `sit_idle` preserved, named anchors measured; generate **same-camera/same-light Cycles A/B** between p0.1 and p0.2: leaf top/side/waterline; chibi front/side/three-quarter/back; both seated front/three-quarter/9:16 medium and close, and 5 idle phase samples. Include PNG contact sheet and original JSON+SHA-256 for independent SA + owner review. Zero-cost only.
- Do not alter Sakura R16, PR #1, or runtime software. Don't move branches/overwrite p0.1 review until explicit instruction; create versioned directory and commit to **AI Visual PR #2 branch only**, or follow its own PR-versioning rules.
- **Owner final decision required:** Owner explicitly says **OK** to chosen visual prototype. Before that: `ART_OWNER_PENDING`; PR #2 remains Draft/no merge, Codex #3/#4 **on hold**, integration task NOT STARTED. A technical Cycles PASS is not owner aesthetic signoff.

## SA/art checkpoints

- [ ] Pad looks convincing at water-level and overhead, still supports chibi without floating/penetration
- [ ] Chibi face, hair, silhouette, crossed legs and hands read well at 9:16 screen size
- [ ] Both agree in palette/scale with the Sakura R16 world / owner reference
- [ ] No regressions in GLB load, materials, anchors, idle animation, SHA source provenance
- [ ] Same-camera Cycles p0.1/p0.2 visuals provided to **owner** with a clear accept/revise choice
- [ ] Explicit **OWNER VISUAL ACCEPTANCE** recorded before SA unpauses Codex or integrations

**Next action:** AI Visual p0.2 on PR #2 for SA and owner visual review, not Codex.
