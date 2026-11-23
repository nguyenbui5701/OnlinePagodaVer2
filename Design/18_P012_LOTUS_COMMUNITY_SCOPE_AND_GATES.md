# Design 18 — P0.12 Lotus World & Community: SA proposal for Owner sign-off

> **2026-11-23 — SA DESIGN DRAFT, NOT AN IMPLEMENTATION TASK.** Owner explicitly accepted P0.11's browser appearance ("tôi đánh giá oke") after P0.11 SA TECH PASS at [PR #8 review #6015829891](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8#pullrequestreview-6015829891). Record **OWNER_P011_VISUAL_GO** for the P0.11 scoped dark-twilight/reflective-water look, not an overall scene-completeness, performance, merge or LIVE GO. The existing Owner-approved [Design 17](17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md) explicitly places **P0.12 Lotus World & Community** before P0.13 gift choreography, P0.14 scene-parity and P1.0 hardware/LIVE. **This document proposes the next design.** Until Owner approves the actual P0.12 layout/identity/asset scope, SA should issue **no P0.12 Codex/AI Visual task**. Do not edit runtime/PRs here.

## 1. Sources, frozen state, reading order, authority

- Mandatory [Design/07_WORK_RULES.md](07_WORK_RULES.md), [Design/13_3D_EVENT_INTEGRATION_CONTRACT.md](13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md](14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/17](17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), and [Design/16](16_P0_APPROVAL_AND_HANDOFF.md), then relevant manifest and event/camera code.
- P0.11 **Owner-approved source baseline** is [PR #8](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8) HEAD **`9f15513c451eacc5f52a62c47ebd17085beea15e`**; still open and stacked on [PR #7](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7) **`323955bed04e88f37cc251f8ae902e5ef7550eb5`**, [PR #6](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/6) **`675675cdf4d1a6868f370e6417ac689a15c1054b`**, and [PR #5](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/5) **`844361b5edd8ca1c2498ee1e708c66b634312069`**. Nothing here authorizes any merge or changing those existing heads.
- Existing reviewed baseline has **three world-space lotus seat positions** in `apps/v2-viewer/src/seat-scene.ts`, R16 Sakura ECO/QUALITY, P02 lotus pad, P07b1 male actor, typed actor↔seat identity and event-driven A→B→C focus, smooth P0.9 cinematic and P0.11 dark-lake lighting/water. The user-supplied 46.87s `chuav2(1).mp4` was inspected earlier by SA; it is **not a GitHub asset**.
- Search of the default branch for lotus flower/bud GLB did not establish an existing approved flower/bud asset; **that is insufficient to claim no such asset exists in reviewed asset PR #1/#2 or Owner library.** Require an explicit SHA/manifest/animation inventory before commissioning anything.
- Role ownership by Rules: **SA** designs and issues later isolated tasks; **AI Visual** creates any **genuinely missing**, original, versioned flower/bud/mountain assets with Blender/GLB and Cycles evidence; **Codex** handles **V2 renderer/seat registry, deterministic layout, instancing/LOD, performance and event presentation**, never authoring production meshes or faking 3D assets. Owner approves design, asset beauty, new crowd model and eventual visual result.

## 2. Grounded gap against video, not a regression of P0.11

| Reference time | Desired scene feature | Current validated gap / proposed remedy |
|---|---|---|
| 00:00–00:05 | Foreground lotus/chibi against dark moving water, subtle flower/bud | Existing pad and actor PASS; add **only missing** nearby botanical accents |
| 00:06–00:10 | Community depth: many occupants across foreground/midground, petals and lotus | Existing demo seat layout has 3 positions; propose ring/arc layout and readable separate depth rows |
| 00:11–00:19 | Wide/aerial occupied pads among Sakura tree halo | Derive seeded staged seat/prop distribution around unchanged R16 trunk and safe camera corridors |
| 00:26–00:29 and 00:40–00:43 | Lake-level parallax with lotus buds/flowers, distant silhouettes and occupied community | Add original few botanical assets, far low-poly environment only if approved, fog/LOD not fake names |
| 00:33–00:36 | Under-tree foreground chibi against majestic gold trunk | Preserve P0.11 light look; avoid blocking bark/gift camera with new pads or models |

**Do not copy** identities, chat, gifts, viewer photos, TikTok UI or non-owned media from reference. Matching reference composition does not require reusing the exact number, placement, model or silhouette of people.

## 3. Proposed P0.12 architecture and phased work

### P0.12-A — Inventory, layout & identity contract (SA design, Owner review first)

1. Inventory **actual GLBs and source assets** on approved PRs/manifests: R16 Sakura, P02 pad, P07b1 male cross, already accepted female/pose/color variants, available original lotus flower/bud or hill assets. Verify **real** file path, GLB SHA-256/byte size, source (.blend), rig/idle clips, LOD/anchor compatibility, Cycles proof and license. Mark missing rather than inventing.
2. Design a **seed-repeatable, non-overlapping** ring/arc lake layout at world Y=0 with clear corridors to Sakura trunk and uninterrupted CLOSE/COMMUNITY/AERIAL/UNDER_TREE + A/B/C gift views. Produce **top-down coordinate map and three native 9:16 mock layout screenshots** before asset production. Preserve current three hero `seat-1..3` keys/positions/actor facing; treat extra seats as *new* IDs only after event capacity design approval. Do not move currently tested focus seats to chase a decorative composition.
3. Formalize four distinct scene-item roles: `real occupied seat`, `unoccupied/decorative pad`, `approved decorative anonymous character` (ONLY if Owner explicitly opts in), and `flower/bud/background prop`. Never assign fake online person, name, comment, gift, avatar picture, room ID or authoritative Event Engine actor to decoration. A no-seat gift must remain **text-only**, never transfer to a decorative avatar.
4. **Proposed visual-density checkpoints, not automatic capacity changes:** current 3 → experiment 12 → experiment 24 visible scene items/seat-capable points. For a meaningful community, distinguish number of pads vs real occupied actors vs approved anonymous stand-ins; do not claim 24 real users if only 3 are connected. 40–60 far LOD only after measured Owner hardware and a new scope.
5. Lock asset manifest/anchor contract (world +Y, actor forward +Z, PadSeatAnchor/SeatRoot, head/name/FX anchors) and a no-conflict ownership matrix **before** AI Visual and Codex modify anything.

### P0.12-B — AI Visual, only for verified missing art (separate task/PR)

1. Prioritize a **minimal original lotus blossom + lotus bud pair**, optionally one low-poly distant bank/hill silhouette **only if** not already present or reliably achievable from approved current assets. Avoid a wholesale tree/chibi redesign.
2. Deliver versioned `.blend` + actual openable `.glb`, manifest with exact SHA-256/bytes/triangles/material/texture/LOD/pivot/scale/licensing. Render Cycles front/side/3Q/aerial/low at matched P0.11 twilight exposures and full 720×1280 scene composition; a concept JPG is not a GLB.
3. Use free tools/assets with commercial-compatible provenance and **0 VND** without Owner-specific authorization. No 3D generation by Codex, no overwrite R16/P02/P07b1. Keep files on **new AI Visual asset PR**, owner-upload gating for large binaries; **SA review → Owner art GO** prior to consuming in viewer.
4. If existing validated GLBs cover the requested assets, **skip** this asset task rather than generating an unnecessary Blender phase.

### P0.12-C — Codex world, occupancy & renderer (separate task/stacked PR, after contract)

1. Add small typed V2 scene registry, seeded placement, batched/instanced pads and decorative flora where appropriate. Keep correct shadow, near/mid/far LOD and memory bounds for ECO/QUALITY; preserve P0.11 3-lighting-look blends and lake reflection, existing gift ring, P0.10 motes/petals/leaf pools.
2. **Event Engine remains authoritative:** real actors/confirmed gifts/room-session mapping only on allocated real seats; no camera focus on empty pad or anonymous decoration. P0.9 seeded cinematic variations and face-to-tree directions preserved for real actors. Any change to capacity or seat registry requires **explicit** evidence-driven SA approval and separate correctness tests; never silently grow live actor capacity by adding visual pads.
3. Run technical density validation at scene-item stages 3/12/24 on browser/software baseline with genuine render counts; do not claim GPU 30 FPS or RTX/LIVE readiness. Test line-of-sight for tree, all guest gift seats, no clipping/contact errors and no offscreen nameplates. A crowded scene must still allow a readable tree in aerial and actor in gift focus.
4. As each art asset passes gate, consume frozen, hash-verified GLB sources without code-created fake mesh replacements. Produce 720×1280 **real WebGL** before/after for low-angle community, aerial, under-tree, gift A→B→C, long idle and capacity fallback.

### P0.12-D — SA visual/performance review and Owner GO

- **Technical PASS:** all existing P0.11 tests/builds and A→B→C gift FIFO pass, 85s no-gift camera and return continuously clear, no fake identities, unchanged original GLB hashes, deterministic crowd layout and bounded profiles, measurable drawcalls/triangles/textures/memory/rAF times, no high-severity new graphics errors.
- **Art PASS:** real new original GLB/BLEND and Cycles if generated; shot comparison against source video at 6–10s, 11–19s, 26–29s and 40–43s. The scene reads as a lake community **not a random carpet of pads**, and characters retain head/name/contact and meaningful scale.
- **Owner Visual GO:** actual browser scene accepted. Separate gates for hardware ECO/QUALITY and later LIVE Studio still outstanding.
- **STOP:** `P012_SA_REVIEW_REQUIRED` after new implementation PR. No automatic P0.13, merges or LIVE.

## 4. Owner decisions needed before SA issues tasks

1. **Anonymous decorative people?** Recommended **yes**, but visibly distinguish them in model and data from real viewer-bound actors; if no, build a populated visual rhythm with empty pads/lotus flowers while real seats remain tied only to authenticated DEMO/room actors.
2. **First visual checkpoint:** recommend **12 scene items / pads** (not 12 claimed live viewers), then up to 24 if camera composition and resource caps are safe. Existing three real mapped seats must continue working.
3. **Minimal initial art:** one lotus blossom and one bud, plus only verified missing far silhouette. Prefer reuse of already approved asset variants and no new hair/poses.
4. Preserve **dark navy/lavender dusk and pink/gold reflective water** accepted at P0.11; do not commission a new full environment style.

**SA recommendation:** Owner confirms these choices → SA versions a small **P0.12-A asset/identity/layout audit** (or closes it inside Design) → only verified missing AI Visual work proceeds → Codex viewer work after manifest gate → SA review → Owner scene Visual GO. Keep current PR #8 open until a separate merge decision; no production branch mutation or merge.
