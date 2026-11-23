# CODEX 06 — P0.12-A Lotus Community 12-Slot DEMO and Anonymous-to-Real Seat Handoff

**SA assignment:** 2026-11-23. **Owner Design GO:** Twelve visual seats/positions, anonymous meditating characters and visual consistency with the avatars of **real viewers when they later join LIVE**. **Execution status:** `ASSIGNED_TO_CODEX` for a narrow **V2 DEMO ONLY** implementation, not production LIVE or a new GLB/AI Visual task. **STOP at `P012A_SA_REVIEW_REQUIRED`** → SA code/visual review → Owner P0.12-A Visual GO.

## 1. Role, objective, scope & STOP

**Codex / AI Code** implements a **deterministic, performant 12-position lotus community visualization and truthful DEMO occupancy handoff**, using the **already approved** P02 pad and P07b1 male chibi 3D binaries. The actor used by a real demo viewer and a decorative anonymous meditator should have the **same art language**, pose, scale and seat contact. The renderer may share geometry and animation/clones/batched render objects, but **must not share or fabricate identity**.

**Key behavior:** when an authenticated in-app DEMO `member` / `chat` / `gift` event causes `DemoEngine/AvatarRegistry` to allocate `actorId → seatId`, the **same visible slot** must transition smoothly from an anonymous cosmetic occupant to the real actor presentation. When the real actor expires/is removed and no gift reservation remains, that slot may return to a cosmetic anonymous occupant. No two figures overlap on a single seat. A dummy is never shown with the username/photo/profile or gift of a real user, never contributes to `viewerCount` or `confirmedGiftCount`, and is never eligible for focus.

**Strict scope:** extend V2 viewer scene layout/presentation and introduce a **new isolated `demo=community`** synthetic fixture to exercise join/leave and gift. `demo=idle`, `demo=gifts` and `demo=capacity` must reproduce P0.11's current results exactly, including their current 3-real-actor capacity. If testing 12 real DEMO actors is necessary, `maxAvatars:12` and `spawnOnMember:true` may exist **only in explicitly named new DEMO community configuration**, not defaults/live/other scenarios. Event Engine core `packages/v2-events/**` and `protocolVersion=0.1.0` are **read-only** in this task; any discovered engine limit or protocol blocker is an SA stop, not permission for an unreviewed rewrite.

**Out of scope:** a real TikTok API/live adapter or member subscription, fake active viewer counts, new cloud/server transport or gifts, automatic 12-actor production capacity, new Sakura/chibi/pad GLBs, flowers/buds/mountains absent from approved manifest (later P0.12-B AI Visual), Blender/Cycles, AI image/3D generation, P0.13 rose choreography, camera algorithm rewrites, lighting/water/FX recolor, any V1 edit, paid tools, RTX/LIVE Studio benchmark/launch, and merging any PR.

**STOP/GATE:** `P012A_SA_REVIEW_REQUIRED` after one separate, small new stacked PR with real native WebGL proofs, code/tests and identity/capacity logs. SA review and Owner visual acceptance precede P0.12-B/C or hardware work. Codex may report blockers or submit a narrower partial PR rather than silently expand scope.

## 2. Repo, exact baseline, branch, protected assets

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Exact immutable accepted visual baseline:** [P0.11 PR #8](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8), branch `feature/v2-p011-twilight-lighting-water`, HEAD **`9f15513c451eacc5f52a62c47ebd17085beea15e`**. This is Owner P0.11 Visual GO and [SA TECH PASS #6015829891](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8#pullrequestreview-6015829891). PR #8 stacked on PR #7 `323955bed04e88f37cc251f8ae902e5ef7550eb5`, PR #6 `675675cdf4d1a6868f370e6417ac689a15c1054b`, PR #5 `844361b5edd8ca1c2498ee1e708c66b634312069`.
- **Create new branch from that exact SHA**, suggested `feature/v2-p012a-community-demo`. Open **stacked PR targeting `feature/v2-p011-twilight-lighting-water`** (PR #8 head branch), not `main` or PR #7. Check current PR #8 head immediately before branching and submission; if it has moved or dependency merged/rebased, STOP and ask SA to re-pin. Do not write to old worktrees/PR #5–#8, rebase or force push.
- **Allowed diff:** `apps/v2-viewer/**` only, notably `src/seat-scene.ts`, `src/slice-driver.ts`, viewer `src/main.ts` query routing, an isolated typed `src/community-layout.ts` and/or `src/community-presentation.ts`, focused `test/*.test.ts`, `P012A.md` and evidence. No modification to `packages/v2-events/**`, `Assets3D/**`, GLB manifests, V1, platform adapter or other branches.
- **Freeze source GLBs/hashes (SHA-256 / bytes):** Sakura QUALITY `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c` / 5,055,232; Sakura ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` / 1,393,492; lotus P02 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9` / 262,108; chibi P07b1 `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097` / 589,932. Also freeze `sakura-r16.json` and `p08-assets.json`.

## 3. Required reading order and source truth

1. [Design/07_WORK_RULES.md](../Design/07_WORK_RULES.md), [Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16_P0_APPROVAL_AND_HANDOFF.md](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00_P0_EXECUTION_ORDER.md](00_P0_EXECUTION_ORDER.md).
2. [Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), **Owner-approved and revised** [Design/18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md](../Design/18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md) **Section 5 identity contract**, [Design/13_3D_EVENT_INTEGRATION_CONTRACT.md](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/09_GIFT_CAMERA_DIRECTOR.md](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/10_GRAPHICS_PROFILES.md](../Design/10_GRAPHICS_PROFILES.md), [Design/12_CORE_PRIORITIES_AND_AI_ROLES.md](../Design/12_CORE_PRIORITIES_AND_AI_ROLES.md).
3. [CODEX 05 P0.11 task](CODEX_05_P011_ATMOSPHERE_TREE_LIGHTING_REFLECTIVE_WATER.md) and the formal [SA re-review PR #8](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8#pullrequestreview-6015829891), existing [P011 Windows runbook](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/9f15513c451eacc5f52a62c47ebd17085beea15e/apps/v2-viewer/P011.md), actual [browser evidence](https://github.com/nguyenbui5701/OnlinePagodaVer2/tree/9f15513c451eacc5f52a62c47ebd17085beea15e/apps/v2-viewer/evidence/p011).
4. Inspect at **exact P0.11 SHA** `apps/v2-viewer/src/{seat-scene,main,seat,asset,verified-glb,lighting,camera,slice-camera,slice-driver,gift-fx}.ts` **where those files actually exist**, `src/{p08-assets,sakura-r16}.json`, viewer tests and package.json. Read `packages/v2-events/src/{engine,registry,focus,protocol,fixture}.ts` **read-only**. `AvatarRegistry.touch()`, `SeatRegistry.take()`, `SliceDriver` and `createSeatScene().present()` are essential.
5. Owner's original reference `chuav2(1).mp4` was inspected by SA but is not in the repo. Codex must use **Design 17 6–10s, 11–19s, 26–29s, 40–43s** scene descriptions unless the clip is actually in its own environment; never claim it was watched locally without access. Reference TikTok UI, names, profile photos and branded gifts are not to be copied.

## 4. Grounded SA assessment and architectural decisions

| Finding | Existing truth at P0.11 | P0.12-A acceptance direction |
|---|---|---|
| Hero Sakura, dusk lake and P0.9 camera | Owner P0.11 visual GO and SA TECH PASS; 30/30 viewer+event tests | FREEZE these authored looks/routes |
| Seat scene | `seat-scene.ts` creates **three** lotus seats and shows seat1 preview with no avatars | **12 visual positions**, keep three original IDs/positions/orientation/anchors; add new deterministic safe arc positions `visual-4..12` |
| Real DEMO occupancy | `SliceDriver` config has `maxAvatars:3`; `spawnOnMember:false` by engine default, while chat/gift can spawn. `AvatarRegistry` owns actorId/seatId; `room` event supplies viewerCount | Add isolated **`demo=community`** to prove member-sourced allocation, and explicitly declare any 12-seat DEMO option; preserve all old fixtures |
| Anonymous decorator | Existing renderer hides seats with no actor, except preview seat1 | New renderer-owned anonymous look with `decorId`, no names/actor IDs/room IDs or fake gifts, visible at non-real slots |
| Join/leave handoff | No render-state transition for a cosmetic character becoming real | Real snapshot `actorId + seatId` overrides the cosmetic mesh at a slot; on release/TTL return to cosmetic, preserving contacts and not resetting a gift in progress |
| Assets | Existing P02 and male P07b1 approved; original GLBs/manifest pinned | Reuse only approved sources in this task; inventory female/flower/bud candidates, but do not commission or invent missing asset |
| Performance | P0.11 SwiftShader timings only, not Owner RTX | Same-host old/new browser and 3→12 scene-item cost; do not claim 30 FPS GPU or LIVE |

**No false occupancy:** If a snapshot lacks a real actor for a visual slot, it stays anonymous (or empty); the scene may be visually populous without any real viewers. `viewerCount` is NEVER set to visible slot count. Anonymous decorative characters are not legitimate FIFO focus targets. Real viewers must only be derived from a valid typed accepted event, not by guessing from chat text, Like, `room` count or any synthetic model state.

## 5. Execution phases with objective gates

### Phase 1 — Audit, verify assets and lock a reversible design

1. Read exact baseline SHA, note clean branch, compare P0.11 screenshots/profile and inspect `seat-scene.ts` three original anchors. Verify real original asset files and all 4 hashes. Inventory other potentially approved female pose/flower/bud assets **from their PR manifest/source**; report availability with SHA/provenance, do not alter/import into this task.
2. Produce a readable **top-down slot map** in task evidence (typed JSON + a technical visualization derived from real 3D coordinates, not an image-generation concept). Keep `seat-1..seat-3` exactly, add 9 original extra slots avoiding the water-tree root/canopy, 3D camera corridor, frame clipping and visible foliage.
3. Write down **authoritative** actor IDs and seat keys vs **cosmetic** decorative IDs. Document which old DEMO scenario uses `maxAvatars=3` and which new scenario tests `spawnOnMember=true`. Decide explicitly whether to demonstrate 3 real actor capacity with 12 visible slots or 12 real actors within named DEMO only; do not silently set global engine defaults. Prioritize minimum change that proves the Owner's behavior.
4. Record baseline real WebGL 720×1280 and same-host metrics for `?demo=idle`, `?demo=gifts`, `?demo=capacity` and P0.11 camera seed `9`. New `?crowd=off` or `?world=legacy` switch is proposed (not present at baseline) to verify exact previous scene behavior when off; if created, document it.

### Phase 2 — Implement the 12-position scene without fake identity

1. Use existing verified pad and actor source in `createSeatScene`; add **9 non-overlapping visual slots** while **keeping original 3 real seat IDs/position/yaw unchanged**. Bind each `REAL_OCCUPIED` by `seatId` from snapshot, but keep `DECORATIVE_ANONYMOUS` in a distinct renderer-only namespace. Avoid injecting decorative actors into `Snapshot.avatars`, `SeatRegistry`, `room` events, UI nameplates or confirmed gift tallies.
2. Make the anonymous actor visually identical in style and correct sit-contact to real viewers, but suppress real nameplate/FX. Reuse approved art/animation and a controlled seed-derived small set of actual GLB material/variant palettes **only if the existing GLB truly supports those variants in current runtime**; never invent implemented hair/appearance variants. Even if anonymous and real use the same geometry, the visual handoff must not create duplicate meshed bodies or unnatural popping.
3. Keep meditating subjects facing Sakura. Preserve tree-root clearance, pad surface contact and respect P0.11 dark twilight/water reflective palette. Maintain separable ECO/QUALITY caps and avoid per-frame new GLB loads, geometries, per-actor materials or unnecessary animation work when far/occluded.
4. **Only within `demo=community`**: supply deterministic `member` events whose typed identities arrive at scheduled virtual times, plus duplicate/reconnect/disconnect, TTL or release and one real gift. Use engine's already supported `spawnOnMember:true` **in this scenario only**. If proving all 12 real seats is warranted, choose an explicit `maxAvatars:12` isolated setting, cover overflow and confirm that no production/default behavior changes. A `room` viewer count event is never an avatar creation command.
5. For a real arrival, choose existing correct mapped seat, transition `D → R` at same coordinates and display only real sanitized name where permitted, with an age/time-bounded fade that does not overlap GLB silhouettes. For expiry and departure, only switch back after engine actually releases seat and no active/reserved gift remains. Multiple events for same user reuse the same real actor, never spawn duplicates. If focus is already active, avoid cosmetic replacement until focus ends.
6. Preserve gift A→B→C fixture exactly in `demo=gifts`; ensure `demo=community` selected focus never targets a decorative ID and fallback remains text-only when all true seats are allocated. Verify queue fairness/dedup and no wrong person during member arrival/reconnect.

### Phase 3 — Tests, visual evidence, and performance

1. Preserve P0.11 event/viewer tests/builds (baseline **8+22=30 tests**); add focused tests for seeded placement reproducibility, 12 visual slots vs true actor counts, no overlap/near-tree clipping, D↔R lifecycle and actor binding, duplicate joins, reconnect/room change, TTL/gift reservation, no-seat and `viewerCount` independent from visual density. Existing old scenarios must produce identical `actorId → seatId`, focus and confirmed gift totals and P0.11 camera sampled poses.
2. At least **6 real native WebGL 720×1280** captures: (a) low community/empty and decorated A/B; (b) arrival at actual `seatId` with before/after screenshot, no duplicate; (c) aerial Sakura showing mid/far parallax; (d) low lake level and bloom-free scenery; (e) gift on real viewer with readable name/FX and no decorative misfocus; (f) after seat release / returning decorative; (g) under-tree clear golden bark. Include seed/virtual timestamp/profile and exact source SHA. **Do not use AI-generated images as proof**. Offer a full-quality interactive browser URL with true implemented options.
3. Run 85s no-gift and a community lifecycle ≥66s, A→B→C old gift regression, scene count 3/12 profiles ECO and QUALITY, two seeds (9/71) and browser context loss/restoration if new clone disposal logic warrants it. Measure actual additional draw calls, triangles, JS memory, geometry/material resources, rAF p50/p95/p99 and browser errors. Compare same host, same camera and resolution to P0.11; distinguish SwiftShader vs actual RTX. Watch for high CPU cost from 12 independent AnimationMixers.
4. Asset identities must remain checksum-exact and same imported animation anchors/idle. If a verified existing model cannot share materials/rig safely, report P0.12-A PARTIAL instead of substituting fake mesh. Test missing/tampered GLB fail-closed behavior.
5. Provide `apps/v2-viewer/P012A.md` with Windows PowerShell steps, exact CLI flags implemented and a machine-readable `evidence/p012a/` directory: design map, snapshot/occupancy trace, test/build logs, source hashes, frame-time/asset reports, actual screenshots, known limits. If `npm.cmd run evidence:p012a` is introduced, implement and run it; do not claim the script existed before.

### Phase 4 — Small stacked PR and SA handoff

- Submit only V2 viewer files, tests and evidence; no AI Visual GLB/Blender or source modifications. Explain **current real-to-anonymous handoff works ONLY under the accepted synthetic `member/chat/gift` DEMO events**; a real LIVE adapter and member-event availability remain unverified and unimplemented.
- Record exact P0.11 baseline SHA and new PR HEAD, changed paths, tests/scripts and actual browser measurements, a **per-slot table** of `decorId` or `actorId/seatId`, a real join/leave ledger, no-seat fallback and regression results.
- Explicitly state **0 VND** costs, no media created, no TikTok LIVE, RTX hardware, V1, GLB re-export, unauthorized PR merge, camera rewrite or event-core change.
- **STOP: `P012A_SA_REVIEW_REQUIRED`**, await SA review → Owner P0.12-A Visual GO → only then plan missing original lotus/bud AI Visual and broader community P0.12-C. Do not begin P0.13 automatically.

## 6. Acceptance / STOP matrix

| Gate | PASS | HOLD/BLOCKER |
|---|---|---|
| **LAYOUT** | Deterministic 12 visible positions with clear lake depth; original seat1–3 coordinates, ID, actor facing/contact and camera shot safety preserved | Tree occluded, figures overlap, camera intersects pad, real seat displaced |
| **IDENTITY** | D is cosmetic only; R from exact accepted engine snapshot; actual member joins replace correct slot without ghost; no duplicate/names for anonymous | Dummy counted as viewer or gifted actor; member claimed from a `room` total |
| **EVENTS** | Old gift FIFO A→B→C and confirmed counts unchanged; DEMO community member join/TTL/reconnect tested with no-seat truthful; room epoch respected | Replayed gift, ghost focus, wrong seat, default engine semantics altered |
| **VISUAL** | Real 720×1280 ECO+QUALITY before/after; same approved models visually coherent; mobile portrait composition is occupied yet calm | Visual density fake or image-only, nameplate/actor obscured, art re-export |
| **PERFORMANCE** | Renderer resources bounded and logged, same-host old/new frame intervals and draw calls recorded; adaptive LOD or density if needed | Unbounded objects/clones, regression unmeasured, false RTX/LIVE pass |
| **EVIDENCE** | Four original GLB SHA/bytes, exact source SHA, reproducible demo seed/member trace, 30 old tests+new pass, two builds PASS, code-only scope | Missing asset/hash, nonexistent command claimed passed, evidence from wrong branch |

**Note:** This phase is not a claim that LIVE connection itself is ready. The Owner has approved **visual behavior** of real viewers in the lake; later connector/provider event authority must be verified separately. Focus accuracy and security must never be sacrificed to achieve a visually crowded pond.

## 7. Verified Windows commands (Node >=24)

```powershell
# In a NEW Codex P0.12-A worktree rooted at PR #8 exact SHA
Set-Location packages/v2-events
node --version
npm.cmd ci
npm.cmd test
npm.cmd run build

Set-Location ../../apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --port 5182 --strictPort
```

**Candidate viewer URLs** (only parameters already verified at P0.11 are safe now): `http://127.0.0.1:5182/?seed=9&profile=quality&clean=1&look=twilight` and `?demo=gifts&seed=9&profile=quality&clean=1&look=twilight`. **`?demo=community` and `?crowd=off` are new proposals**, not existing URLs or proof until Codex implements/tests them. Report the actual working URL only after implementation.

## 8. Required concise final Codex report

`SA finding → code action → objective evidence → status`, exact PR/head/base, assets and Event Engine SHA unchanged, actual 12 slots and real vs decorative actor counts, member→real→decorative timeline, no false focus/viewers, original gift regression, screenshots, real same-host timings, 0 VND and STOP `P012A_SA_REVIEW_REQUIRED`. If code or assets cannot satisfy the contract without changing an out-of-scope package, mark `BLOCKED` and ask SA for a new task instead.
