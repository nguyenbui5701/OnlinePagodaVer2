# Design 20 — P0.12-C Botanical Runtime Integration Contract

> **2026-11-23 / OWNER BOTANICAL ART GO + SA ART PASS.** The Owner explicitly approved the reviewed bloom and bud in the 2026-11-23 conversation after [SA Art PASS review #6017468836](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10#pullrequestreview-6017468836). This closes `OWNER_P012B_BOTANICAL_ART_GO` **only for the exact four P0.12-B GLB binaries and their original visual designs**. It authorizes SA to issue one **P0.12-C Codex integration task**. It **does not** authorize merging asset PR #10 or Viewer PR #9, source art changes, LIVE, GPU certification, production actor-capacity changes or P0.13.
>
> **SA work boundary:** version design and integration contract only; do not write/edit Viewer runtime, GLB geometry, source branch or PR dependencies during SA handoff.

## 1. Immutable source-of-truth revisions / roles

- **Rules:** [Design/07](07_WORK_RULES.md), [Design/14](14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/13](13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/17](17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), [Design/18](18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md), [Design/19](19_P012B_BOTANICAL_ASSET_AUDIT_AND_SCOPE.md), [Design/16](16_P0_APPROVAL_AND_HANDOFF.md).
- **Frozen Runtime branch:** [PR #9](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/9), HEAD **`0a5d060d0ec4eeda19d62cfcd4a58a29f58c38bf`**, branch `feature/v2-p012a-community-demo`, base PR #8 `9f15513c451eacc5f52a62c47ebd17085beea15e`. P0.12-A SA TECH PASS and Owner Visual GO. Existing 3 real seats, 9 extra renderer-owned anonymous slots, Sakura/R16, P02, P07b1, Twilight/P0.11, P0.10 gift and P0.9 cinematic all freeze.
- **Frozen Art branch:** [PR #10](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10), HEAD **`9a01b39afde642d55dcf9bc7639f3a84ef913e4d`**, branch `assets/p012b-lotus-blossom-bud`, base PR #2 `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`. Four real GLB2 source binaries passed exact checks/geometry, true Cycles context and **Owner Botanical Art GO**. PR #10 stays independent, DRAFT/unmerged unless Owner later authorizes.
- **Codex** owns asset *loading/staging/verification*, object scene placement, batching/instancing/LOD and tests **using only approved artist GLB geometry/materials**. **AI Visual** remains owner of GLB geometry; no additional Blender rerun or art iterations needed. **Owner** provides final P0.12-C live-browser visual decision.

**Critical branch issue:** PR #10 does not share PR #9 ancestry. A new Viewer integration PR must be **stacked on PR #9**, but GLB bytes live in **a different branch**. **Do not merge/cherry-pick PR #10** into the Viewer branch. Implement a deterministic read-only binary staging/import from **the exact PR #10 SHA** modeled on existing `apps/v2-viewer/scripts/stage-p08.mjs` (which runs `git cat-file blob SHA:path`, locally fetches pinned source refs if necessary, validates bytes and SHA-256, and stages under viewer `public/**`). Maintain provenance from PR #10 to runtime manifest.

## 2. Approved four-asset contract and size limits

Original binary source directory: `Assets3D/Review/lotus_botanicals/p012b/` at **PR #10 HEAD `9a01b39afde642d55dcf9bc7639f3a84ef913e4d`**.

| Canonical file | Exact byte size | SHA-256 | Triangle budget | Valid shape |
|---|---:|---|---:|---|
| `lotus_bloom_p012b_quality.glb` | **50,004** | `63edb12d02664a44ce4484b847ef07aeffab6a22a36cf44415b141f56804f0d0` | 1,728 | open, layered ivory/blush flower |
| `lotus_bloom_p012b_eco.glb` | **20,924** | `8dce16649f0dff541601047628ad7175f0b9ec028e7803b967cf2dee5efc0bd5` | 589 | same bloom LOD |
| `lotus_bud_p012b_quality.glb` | **20,940** | `fe62a2f9aeb166d0eadf758c75eb47950a9053d8f2149d2a66ceaf5007a05f1a` | 648 | closed upright bud and calyx |
| `lotus_bud_p012b_eco.glb` | **8,552** | `c442cc04c3b0094a920c2b86fb202233782d5076a97e1110a84b345df3f0d082` | 192 | same closed bud LOD |

Manifest: [P012B asset manifest at exact reviewed HEAD](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/9a01b39afde642d55dcf9bc7639f3a84ef913e4d/Assets3D/Review/lotus_botanicals/p012b/asset_manifest.json).

- `+Y` up; meters/unit 1; model root at **world waterline `Y=0`**. Open bloom bounds approximately 0.74 m across ×0.30 m high; bud ~0.29 m diameter ×0.634 m high. No animations, texture images or imported cameras/lights. QUALITY flower 3 PBR materials, bud 2. No copying P02 into flower/bud GLBs.
- Existing P02 original hash `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9` (2.083 m span), R16 + P07b1 remain unchanged. Stage only these four approved new binary versions; never mutate/checksum-bypass art.
- The editable `.blend` is delivered in PR #10; independent Blender source-open was not performed by SA but actual 20 native Cycles and GLB imports are recorded. This limitation is accepted as documented; no new Blender gate for copying approved GLBs.

## 3. Visual composition and identity — required invariants

**Scene intent:** add a *small*, deterministic scatter of native 3D blooming flowers and buds between existing 12 lily-pad figures, primarily foreground and midground with occasional distance bloom, inspired by video around **00:00–05, 00:06–10, 00:26–29 and 00:40–43**. Do not copy the video's livestream UI or viewer identities. Flowers are **decorative props only**, never viewer-bound actors, seat registries or targets.

- Keep **all 12 P0.12-A visual slot positions, 3 real hero seats, 9 renderer-only anonymous figures, seed and actor-facing** intact. Do not increase room count or actor capacity or place plants *on* a seated pad. Validate with the actual P02 pad bound (P0.12-A conservative radius ~1.067m) + floral max extent + margin, and against root/branches, camera passages, and gift nameplate/FX ray.
- Propose **small, measured scene presets rather than uncontrolled density**: ECO initial **3 open blooms + 5 buds**, QUALITY initial **5 blooms + 8 buds**. These are **target proposal caps** for the first browser evidence, **not fixed artistic claims**; Codex may select a lower count if occlusion or frame-time degrades, but must document final per-profile counts. Do not add extra avatar bodies, new seats, terrain/hills or alternate Sakura.
- The bloom and bud remain **separate geometry** at approved original scales with slight deterministic yaw, conservative jitter and optional tiny bounded sway without creating new mesh/materials every frame. Place root at Y=0 plus only a small documented waterline offset if the actual water-plane shader needs contact; do not make flowers appear to levitate or sink. Original leaves and actor bottom contact remain exact.
- Differentiate foreground vs midground, not random carpet; honor camera low, aerial, under-tree and A/B/C gift. More petals/particles are not part of this task (P0.10 already owns ambience).
- In ECO/QUALITY, use GLB-geometry/material reuse with **instancing for repeated flora** whenever materially feasible; no reauthoring vertex topology. Pin deterministic seed and scene slots so identical camera/seed/clock produce identical A/B images.
- **No fake identity:** flora cannot have `actorId`, `seatId`, a nameplate or gift FX target; DEMO `viewerCount` comes from accepted `room` events, not flowers. Existing no-seat fallback and gift A→B→C preserved.

## 4. Binary acquisition and rollback contract

1. Introduce a **new separate** `p012b-botanicals.json` (exact schema chosen by Codex, versioned and auditable) with source ref `refs/pull/10/head`, immutable **commit `9a01b39...`**, exact art path, original bytes/SHA-256, per-LOD triangles and bounds/material counts. **Do not overwrite** `p08-assets.json` or `sakura-r16.json` and their source hashes.
2. `scripts/stage-p012b.mjs` and `npm.cmd run assets:p012b` stage the **exact four source files** from PR #10 commit with `git cat-file` byte/hash validation, verifying glTF2 header and declared length. Existing `npm.cmd run assets:p08` stays unchanged. If local checkout lacks PR #10 commit, fetch only source branch/ref and **assert exact pinned commit is present**, not use mutable latest branch bytes. Never secretly merge/cherry-pick/copy generated art between PR heads.
3. At runtime, load from viewer `public/p012b/` through existing `importVerifiedGlb` with correct abort handling and **fail closed** on missing/tampered/wrong-LOD/corrupt GLB; report clear actionable staging error. Verify triangles, mesh/material counts, +Y and waterline bounds, texture count=0 against manifest. Avoid hiding missing source with a fabricated geometry fallback. When botanical optional feature is **explicitly disabled**, no new GLB staging/load is required.
4. Provide explicit viewer comparison switch **`?botanicals=off`** (documented and tested; **not available at PR #9 baseline**); **`?botanicals=on`** enables flora in `demo=community` and possibly `demo=idle` only after no-regression review. Preserve original `demo=gifts` and `demo=capacity` **byte-for-byte scene appearance** by default unless the Owner separately authorizes broader rollout. Do not break `?crowd=off` baseline truth.
5. Cleanly dispose only newly owned instancing buffers/objects/material clones; don't dispose original P02/Sakura/actor shared materials twice. Renderer context-loss, pagehide, abort and HMR require no unbounded leaks. The binary source remains a Git tree at PR #10, **not a downloaded ad-hoc file with unpinned path**.

## 5. Verification gates, output and deferred decisions

- **P0.12-C code evidence**: same-host native 720×1280 browser WebGL paired `botanicals=off/on` with same seed/profile/camera/time at community LOW, LAKE, AERIAL, UNDER TREE, first real member arrival and gift focus/no-seat, 85s idle/no gift and ≥66s new community lifecycle. At least six actual screen captures, **both ECO and QUALITY**. Verify correct flower/bud sizes vs 2.083m pad and no overlay occlusion; show count of visible floral instances per shot.
- Run all Event Engine + Viewer tests/builds, baseline P0.12-A old DEMOs `idle/gifts/capacity/community`, 2 seeds (9/71), and new seed/layout/clearance/render/disposal/GLB SHA failure tests. Record baseline+new FPS and frame p50/p95/p99, draw calls, triangles, textures, geometry/memory, console errors with actual Edge/SwiftShader or owner GPU attribution; **do not assert RTX/LIVE readiness without corresponding hardware tests**.
- **Deliverable**: one small new Codex PR **branched at exact PR #9 HEAD** `0a5d060d...`, base target `feature/v2-p012a-community-demo`; only `apps/v2-viewer/**` source/tests/evidence/doc/manifest/staging changes. The PR #10 asset branch remains separate and unmerged; **no art production, Blender or V1**.
- After SA Technical PASS, **Owner P0.12-C Visual GO** is a separate gate. Only then decide whether a subsequent **P0.12-D actor variant** task should integrate already-existing P05f/female palettes. Those variants' GLB existence does not prove actual Owner Art GO or rig compatibility; do not mix them into floral integration.
- **STOP** at `P012C_SA_REVIEW_REQUIRED`, no unapproved merges, P0.13, true LIVE adapter, studio stream, terrain hills, paid service or hardware FPS claims. PRs #2/#5–#10 remain exactly as previously reviewed.

## 6. Owner decisions recorded

- **P0.12-A Owner Visual GO:** 12 decorative chibi/seat community DEMO accepted at PR #9 HEAD.
- **P0.12-B Owner Botanical Art GO:** distinct open lotus bloom + closed bud ECO/QUALITY **approved in user's latest message** on PR #10 HEAD `9a01b39...` after SA Art PASS. No aesthetic rework requested.
- **New current assignment:** isolated P0.12-C *Viewer integration of approved lotus botanical GLBs*, Codex only. No new design clarification necessary because this is the next step already proposed; SA issues the versioned Task after this contract.
