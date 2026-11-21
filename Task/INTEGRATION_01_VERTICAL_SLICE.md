# Integration P0-01 — Real Sakura + one pad + one chibi + mock gift focus

> **OWNER HOLD — 2026-11-21:** Integration is **ON HOLD** until owner explicitly accepts the visual appearance of **lotus_pad_01 + meditator_base**. Technical Blender/Cycles PASS alone does not satisfy owner art approval. Current active work: [AI_VISUAL_02](AI_VISUAL_02_ART_REFINEMENT_AND_OWNER_GATE.md) on asset PR #2. **Do not begin new Codex integration PR, do not merge PRs, do not start GPU or LIVE Studio validation** yet. Previous SA integration guidance below is retained as the *future* gated plan, not a current instruction.


**Owner:** SA coordination; AI Visual supplies real GLBs/anchors; Codex integrates runtime. **Status:** GATED / START AFTER INITIAL ART + CODE INTERFACE REVIEWS. This is a review milestone, not permission to merge Sakura PR #1 or publish LIVE.

## Prerequisites

1. Design/16 baseline v0.1.0 acknowledged by both specialists.
2. Exact original R16 GLB QUALITY SHA `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c` verified at canonical runtime import or documented approved copy. ECO available with SHA from Design/16. R16 tree remains art-frozen.
3. `lotus_pad_01` and `meditator_base` real GLB approved by SA with correct seat, head, nameplate and FX anchors; animation `sit_idle` or explicitly documented accepted prototype fallback.
4. Renderer can load GLB in real 3D with true parallax; DEMO Event Engine tests for fake gift progress/final and A/B/C passed.

## First working scenario

- One Sakura R16, one floating pad, one seated chibi, dark pink-violet pond plane with simple reflective/ripple shader, basic dusk lighting/fog. Draw using actual GLBs **not AI-generated screenshots**. 9:16 clean-capture, minimum target 720×1280.
- Cinematic camera continuously moves for **≥45 seconds** without gifts across CLOSE → COMMUNITY → AERIAL → UNDER_TREE and back, no teleports or stalled orbit. At under-tree the dark bark remains visible and not blacked out/overblown.
- DEMO gift A event: if A not spawned, actor A appears on an available pad; transition to correct A actor and anchored readable nameplate/gift FX, hold bounded, return smoothly to cinematic. If A seat fails, honest fallback without wrong identity.
- Then fixtures A/B/C with B and C arriving during A focus: focus **A→B→C** and return; no duplicate streak count, no freezing on progress. For A/B/C multiple seats may be instantiated from the same approved pad/chibi GLB, **not newly modeled unique assets**.

## Verification evidence

| Test | Minimum evidence |
|---|---|
| Native 3D | Deterministic camera walkthrough video or frame sequence showing actual GLB and parallax |
| Visual 9:16 | Clean-capture screenshot with full Sakura, a pad/chibi and correct color/depth; compare owner video reference ~3s/~15s/~33s as initial qualitative checkpoint |
| No gift | Timed ≥45s log/video showing nonstatic camera and all four modes |
| A gift | Trace actorId↔seatId↔focus target, nameplate/FX screenshots, one smooth return |
| A/B/C | Fixed trace of queue order, hold/transition and dedup event counts |
| Performance baseline | Actual renderer FPS/frame-time logs, test hardware/resolution stated; **not a substitute for final 4GB/8GB LIVE Studio test** |
| Integrity | Asset SHA, versioned event schema, renderer commit SHA and separate art PR refs |
| Safety | V1 unaffected, no real TikTok credentials or private user data in fixtures |

## Go / no-go

**GO to scene scale-up** only when the vertical slice passes all mock visual/functional basics and SA signs off review. Otherwise block this milestone with specific visual/code PR comments. **NO production deployment** until six golden-shot comparisons, 10/30/100 actors, target GPU+LIVE Studio profiling, room reconnect tests and a separately approved LIVE adapter.


## 2026-11-21 — SA independent PR reviews and integration readiness

**SA review refs (exact reviewed heads, not automatic merge approval):**

| Workstream | PR | Reviewed head | SA decision |
|---|---|---|---|
| AI Visual pad + chibi | [#2](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6005380374) | `e8eb34c5d405e308e616c89cd385eb5d1d342b2f` | Real GLB geometry prototype ACCEPTED FOR VERTICAL SLICE; owner-run Blender/Cycles PASS, integrated/runtime appearance pending |
| Codex DEMO events | [#3](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/3#pullrequestreview-6005382959) | `308f8a3ba88a8ebd18c511ddf8cbd161061e8e14` | Mock logical source/trace reviewed; real renderer focus pending |
| Codex renderer | [#4](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/4#pullrequestreview-6005387557) | `9a75a82df7be8de7906a416fcc5925ae572ff5f0` | Actual SHA-verified GLTFLoader and 46s cinematic proof; Three.js/Cycles PBR mismatch, gift/chibi integration pending |

**Owner-provided AI Visual evidence checked:** ZIP `P0_LOTUS_CHIBI_Blender_Evidence_Cycles.zip`, SHA-256 `e3a02ea4069d614331c81316d33da2a7b1861fc4b5777ec2860392b8825d5e36`; CRC PASS; 30/30 archive payloads match hash list; 18/18 case images match reports; 3/3 Blender reports/logs successful, stderr empty. Three original Blender files independently hash-verified. AI Visual must update stale `PENDING_OWNER_BLENDER_RUN` fields on PR #2 — accepted Blender evidence does not mean the source .blend binaries are already committed to Git.

### Implementation-specific integration requirements — versioned v0.1.0

1. **New integration PR/branch, not automatic merge:** integrate the reviewed code under `apps/v2-viewer/**` and `packages/v2-events/**` in a separate `integration/v2-p0-vertical-slice` (or equivalent) branch. Preserve the independent PR histories; no changes to V1, no merge of #1–#4 into `main` until SA validates integration. Codex must not create or replace original art.
2. **One runtime contract source:** do not indefinitely keep forked `AvatarPresentation/FocusIntent/CameraPresentation` declarations between `src/presentation.ts` in #4 and `src/protocol.ts` in #3. Link via a version-pinned shared module/adapter with compatibility test, room/session revision guard, and a **real** event-to-camera-state observer.
3. **Real asset anchors:** `lotus_pad_01.glb` SHA `0c80e5d4b2590716fdf9a985340fe2446af7ecc056727a03b82a3997db52bba5`; `meditator_base.glb` SHA `f4e184b57046ad442183931bf9fd2f6d7953000ea07270458e291f627f787d2b`. Place actor `SeatRoot` on pad's **measured** `PadSeatAnchor=[0,0.195,0]` in *pad local space*, using parent/world transforms rather than fixed scene Y guesses. Verify `HeadAnchor`, `NameplateAnchor`, `FXAnchor` world matrices while `UpperBodyBreath` runs; play 2.0-second `sit_idle` in Three.js `AnimationMixer` and show a no-penetration seating close-up. Asset-pair review .blend is NOT runtime model.
4. **Gift lifecycle:** at first A/B/C request consume `GIFT_TRANSITION` and `requestId` before `focusStarted`, interpolate to correct *animated* actor, hold/ack/return without teleport, show correct sanitized name and gift FX, and send `focusSkipped`/overlay fallback if seat unavailable. Verify progress/final dedup and queue fairness in a real video/telemetry trace. No real TikTok credentials.
5. **Visual/palette:** compare R16 Cycles vs actual Three.js under fixed top, under, three-quarter, full 9:16. Three.js evidence at #4 is noticeably **paler canopy / harsher bark shadows**; adjust renderer lighting/tonemapping/environment without modifying **owner-frozen R16 GLB**. The close 33s camera shows pronounced polygonal petals; review camera path and target framing for owner reference, not arbitrary geometry edits.
6. **Binary supply:** PR #1 still lacks canonical remote R16 QUALITY/ECO GLBs; owner must push both to intended immutable SHA paths, or SA records an equivalent immutable approved release source. No hidden dependency on `D:/path/to/...` allowed in deliverable. PR #2 has real uploaded pad/chibi GLBs, verified remote blob hashes.
7. **Build and performance:** both V2 code packages specify **Node >=24**; install in separate V2 environment (V1 may use older Node), document exact local version. PR #3 claims 8 tests; PR #4 claims 2 tests/build. No CI checks are presently reported for these PR HEADs; rerun and archive test/build output. Browser #4 used SwiftShader and measured ~2.91 FPS at 720×1280 **with LIVE Studio closed**. This is not RTX 3050Ti/3060 profiling. Benchmark on owner GPU **after** vertical-slice functionality works.
8. **Go/no-go:** Only after video frames, deterministic `A→B→C` focus trace, actual pad/chibi named-anchor animation and 45s camera replay are reviewed can SA accept the first integrated vertical slice. Production release still requires longer scene scale/GPU/LIVE Studio and video-golden-frame gates.

**Current state:** Review gates #2 art/Cycles evidence, #3 domain mock trace and #4 GLTFLoader/cinematic spike are independently reviewed; integrated vertical slice **NOT YET BUILT**. Proceed with isolated integration work; do not merge #1–#4 into `main` on this note alone.
