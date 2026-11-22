# 16 — P0 design approval, R16 Sakura freeze and implementation handoff

> **P0.5e owner art rejection — 2026-11-22:** Owner supplied original P0.5d Cycles FRONT and SIDE and rejected the capsule-like exposed foot and gap between upper torso/shirt and crossed legs in a low side view. SA parsed actual GLB shirt minY=0.267000854m versus pants maxY=0.252515256m (14.49mm global Y gap at rest, at least 30.49mm at peak breathing), and found same slit in P0.5c original. [Review #6010466650](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010466650) calls for changes. New authoritative [AI_VISUAL_08 P0.5e task](../Task/AI_VISUAL_08_FEMALE_CROSS_FOOT_WAIST_CONTINUITY.md) on PR #2 fixes ONLY foot anatomy and lower-shirt/waist continuity across five idle stages. Preserve hands, hair, áo bà ba design/six colors, kneeling, lotus, animation and anchors. No male, Codex, integration or PR merge pending SA and owner GO.


> **P0.5d final cross-foot owner gate — 2026-11-22:** After SA verified P0.5c real GLB and Blender Cycles in [PR #2 review #6010091090](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010091090), the owner **temporarily accepts female P0.5c art**, except the cross-legged trousers/legs hide the feet; asks for only a **small believable exposed instep / foot tip**. Current active task **[AI_VISUAL_07](../Task/AI_VISUAL_07_FEMALE_CROSS_LEGGED_FOOT_VISIBILITY.md)**, new p5d/ version on PR #2. **P0.5c palms, kneeling GLB, apparel, hair, six colors, lotus, animation and anchors remain frozen.** SA validates new GLB + real Cycles and owner decides. No male, Codex, integration or merge during the gate.


> **P0.5c owner-selected hand gesture gate — 2026-11-22:** Owner explicitly requests **one additional, tightly scoped pass** to orient the **two female prayer palms toward each other** and make their gentle contact look natural, after SA's review of P0.5b PR #2 HEAD `4c8762912024866778dfe1f39f50ca77ccc26744` ([review #6009865513](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6009865513)). **Current active task:** [AI_VISUAL_06 — P0.5c Female Prayer Palm Orientation](../Task/AI_VISUAL_06_FEMALE_PRAYER_PALM_ORIENTATION.md), new immutable `p5c/`. Preserve `p5b/`, both leg poses, áo bà ba, hair, palettes, anchors, animations and frozen lotus. **SA review and explicit owner female approval required; no male, Codex #3/#4, integration, GPU/LIVE or PR merge.** Previous tasks below are historical, not concurrently active.


> **P0.5b owner prayer-hand art gate — 2026-11-22:** SA reviewed PR #2 HEAD `a3673005d2c262bb8577c43335747e62d6dbce96` using owner-rendered actual P0.5 Blender Cycles and SHA-verified both real GLBs. **Both female leg poses are the retained working baseline, but their praying hands need art refinement before owner approval** (blocker). Active task: [AI_VISUAL_05 prayer hands refinement](../Task/AI_VISUAL_05_FEMALE_PRAYER_HANDS_REFINEMENT.md), new versioned `p5b/`, preserving `p5/`. No male, Codex #3/#4, integration, GPU/LIVE Studio, PR merge or next stage until owner approval gate explicitly changes. Previous designs remain valid as future plan.


> **P0.5 female prayer pose owner gate — 2026-11-22:** Owner accepts overall P0.4 female appearance as the working baseline and requests (1) **improved cross-legged knees/legs plus palms-together prayer hands**, and (2) **a separate kneeling-on-both-knees prayer-hands pose**. SA issued [AI_VISUAL_04](../Task/AI_VISUAL_04_FEMALE_PRAYER_POSES.md) for a new versioned p5 on PR #2. P0.4 remain immutable; **both poses require owner visual approval**. No male, Codex #3/#4, integration or merge until owner issues subsequent instructions.


> **Further owner art direction — 2026-11-21:** Owner accepts the lotus pad / chibi P0.3 overall look as a **baseline**, but **NOT final female art signoff**. Current active task: [AI_VISUAL_03 — Female Áo Bà Ba, color variants and waist-length hair](../Task/AI_VISUAL_03_FEMALE_AO_BA_BA_LONG_HAIR.md), on existing PR #2 branch in a versioned P0.4 folder. **Female first → SA review → explicit owner OK female → only then create male character task**. Codex PR #3/#4 and vertical-slice integration stay on hold until separately released by owner. Keep previous P0 scope and production gates unchanged.

> **Sequencing amendment — owner 2026-11-21:** The approved P0 *architecture* remains unchanged, but the owner has **paused parallel Codex/integration work** to focus solely on the art quality of **lotus pad + seated chibi** on PR #2. Visual iteration and explicit owner **OK** is now a **hard prerequisite** before any further Codex execution or integrated vertical-slice work. Existing PR #3 and #4 remain as reviewed prototypes on hold, not rejected. See [AI_VISUAL_02](../Task/AI_VISUAL_02_ART_REFINEMENT_AND_OWNER_GATE.md). No merge or release authorization implied.


**Owner authorization:** 2026-11-21 — owner explicitly accepted SA's recommendation to proceed with the P0 plan. **Status: P0 DESIGN BASELINE APPROVED FOR IMPLEMENTATION**, not acceptance of final runtime behavior, GPU results, release or the still-open production defaults. Previous Design/01–15 remain the normative design references; changes to contracts require an SA-reviewed versioned amendment.

## 1. What is approved

- V2 is a standalone Windows/TikTok LIVE-friendly **real 3D** meditation lotus garden, judged against owner-provided `chuav2.mp4` at ~3/9/15/20/33/42 seconds. V1 `nguyenbui5701/OnlinePagoda` remains isolated and unchanged.
- P0 has two independent workstreams: **AI Visual** creates real original/editable 3D models (Blender/GLB/animations/manifest) with zero-cost tools; **Codex** writes application code (3D renderer, shaders, camera, typed DEMO Event Engine). **SA** reviews each PR and the integrated output. No production 3D geometry generation in Codex, no application/event code in AI Visual.
- Camera continuously cycles CLOSE → COMMUNITY → AERIAL → UNDER_TREE when no gift is queued; a valid gift from known giver triggers focus on that giver's actual actor/seat, shows name + FX, queues multiple gifters FIFO, and returns smoothly to cinematic after draining. See [09](09_GIFT_CAMERA_DIRECTOR.md) and [13](13_3D_EVENT_INTEGRATION_CONTRACT.md).
- Start with a **vertical slice**: R16 Sakura + one lotus-pad seat + one seated original chibi + real 3D water/lighting + continuously moving cinematic + one simulated gift/focus; scale only after this works. Target a 720×1280 9:16 clean-capture test, not the TikTok phone UI.
- First real GPU target is ECO on RTX 3050 Ti 4GB, then QUALITY on RTX 3060 8GB, with LIVE Studio running. 30 FPS is a **target to measure**, not a current result.

## 2. Sakura R16 frozen art baseline (NOT release signoff)

Owner has confirmed R16 artistic appearance is good enough to stop the R04–R16 art iteration loop; SA independently reviewed original R16 owner Blender Cycles evidence and raw GLB in PR #1 review [#6004995640](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004995640).

| Profile | Source-of-truth revision | Verified raw GLB SHA-256 | Reported size | Geometry |
|---|---|---|---:|---:|
| QUALITY | Sakura Hero R16 | `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c` | 5,055,232 bytes | 191,288 triangles |
| ECO | R16 unchanged ECO carry-forward | `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` | 1,393,492 bytes | 44,412 triangles |

- Canonical owner-upload targets, on **existing Draft asset PR #1 branch only**, not `main`: `Assets3D/Review/sakura_hero/r16/sakura_hero.glb`, `Assets3D/Review/sakura_hero/r16/sakura_hero_eco.glb`. They remain marked `pending_owner_upload` until remote bytes/hash are verified. Owner-uploaded temporary filename `sakura_hero(4).glb` is **not** the canonical repo path.
- Source Blender `sakura_hero_r16_quality.blend` and `sakura_hero_r16_eco.blend` may remain owner-controlled by reported SHA; no need to add multi-megabyte Blender sources to normal Git history without storage policy.
- **Art freeze ≠ production approval.** Known debt: 68 independent secondary branch components, some contact/crossing proxy risk, reduced gold ribbon coverage; these are tracked integration visual risks, not automatic triggers for an R17. Native Three.js GLTFLoader/PBR parity and both real GPU+LIVE Studio benchmarks are not yet run.
- Codex may use a temporary debug asset for early contracts, clearly flagged **NOT FINAL**. The renderer may not claim R16 runtime integration until it loads and SHA-verifies the actual R16 GLB; do not replace a missing runtime GLB with a screenshot.

## 3. Versioned cross-team contracts — baseline v0.1.0

This is the **approved implementation baseline** for Design/11 and Design/13; values explicitly labeled provisional below are NOT frozen production settings.

- Right-handed world, **+Y up**, proposed `1 unit = 1 m`, water plane `Y=0`. Local actor **+Z forward**, actor origin at seat-contact center. AI Visual measures pad top/actor head/nameplate/gift anchors from actual exported GLB and supplies them as named nodes or local-space offsets in manifest. Any model exceptions must be declared, not corrected by arbitrary hardcoded per-object rotations in Codex.
- Stable IDs: `sakura_hero`, `lotus_pad_01`, `meditator_base`; `seatId`, `actorId` and room-scoped `userKey` are logical identities distinct from mesh/node names.
- Shared typed interface from Design/13: `AvatarPresentation`, `FocusIntent`, `CameraPresentation`; deterministic `actorId → seatId → world transform + manifest anchor` mapping; room/session-aware idempotency and typed snapshot/revision. Camera never guesses gift giver from a nickname or a 3D coordinate.
- Engine renderer spike: **Three.js GLTFLoader as the first implementation candidate**, not a final engine lock. Selection of primary stack waits for native PBR and owner-hardware measurements; no reimplementation of V1 PixiJS world.
- DEMO fixture defaults for development only: spawn on chat enabled, spawn on member disabled, spawn on confirmed/observed gift ensures actor (or truthful overlay fallback); TTL, max concurrent actors, avatar variant frequencies, exact camera hold/transition times and gift FX mapping remain configurable and require integration/performance/owner validation.

## 4. Parallel tasks and mandatory boundaries

| Order | Owner | Assigned doc | Dependency / deliverable |
|---|---|---|---|
| A | Owner + SA | [Task/00](../Task/00_P0_EXECUTION_ORDER.md) | Canonical R16 GLB handoff + SHA, v0.1.0 contract |
| B1 | AI Visual | [Task/AI_VISUAL_01](../Task/AI_VISUAL_01_LOTUS_PAD_CHIBI.md) | One pad + seated chibi GLBs, animation, anchor manifest, multi-view Blender proof |
| B2 | Codex | [Task/CODEX_01](../Task/CODEX_01_RENDERER_CAMERA_SPIKE.md) | Native R16 GLB renderer, real 3D camera paths, 9:16 preview, native PBR check |
| B3 | Codex | [Task/CODEX_02](../Task/CODEX_02_DEMO_EVENT_ENGINE.md) | Deterministic mock registry + gift FIFO independent of renderer |
| C | SA coordinates | [Task/INTEGRATION_01](../Task/INTEGRATION_01_VERTICAL_SLICE.md) | One actor/pad, cinematic ≥45 s, fake A/B/C focus, evidence |
| D | AI Visual / Codex / owner | future separately gated tasks | Scene scale-up, six golden shots, real GPUs+LIVE Studio, LIVE bridge |

- AI Visual works on `assets/...` and Codex on separate `feature/...` V2 branches, each with its **own PR** and no concurrent edits to the same files. **Never merge PR #1 solely because tree art is owner-accepted.** SA reviews code/assets against exact SHA and the contracts before integration.
- Do not create or run production TikTok credentials/tokens for initial tests. Reuse the V1 provider/mapper selectively only after separate DEMO and event-queue tests pass.

## 5. Explicit open decisions and release gates

**Not silently approved:** production default spawn trigger, avatar TTL, crowd cap, gift hold timings, final engine selection, portrait safe area, shader quality, exact FX mapping. They must be tested and proposed back to owner without blocking the first mock vertical slice.

**Not yet satisfied:** production asset delivery on GitHub, native Three.js glTF/PBR, six video-golden shots, mock gift FIFO integration, 10/30/100 crowd performance, measured RTX 3050 Ti/RTX 3060 FPS/VRAM with LIVE Studio. P0 approval here authorizes task creation and development; **it is not authorization to merge or livestream V2**.
