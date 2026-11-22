# Design 17 — Chuav2 video-fidelity analysis and staged V2 scene roadmap

> **SA DRAFT / OWNER DESIGN GO REQUIRED — 2026-11-23.** This is a **design and prioritization proposal**, **not** an assigned Codex/AI Visual Task, technical PR sign-off, merge, or permission to modify code. This design supplements, but does not rewrite, the immutable history in [Design/16](16_P0_APPROVAL_AND_HANDOFF.md). It is prompted by the Owner's request to rewatch the **now-available reference video** carefully and plan current and future work. The video itself and its third-party screen UI **have not been committed or redistributed**.

## 1. Sources, exact audited revisions, bounds

1. **Video received from Owner:** `chuav2(1).mp4`, decoded locally and inspected across the full 46.87 s, H.264 720×1556 at 30 fps; frames at 0, 2, … 46 s and expanded full-resolution stills around 1, 7.5, 12.5, 16, 20.5, 22.5, 26.5, 30.5, 34.5, 40.5, 44.5 s. Only this uploaded file supports the statements below about the reference.
2. **Real current implementation:** [P0.10 PR #7](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7), HEAD `323955bed04e88f37cc251f8ae902e5ef7550eb5`, stacked on approved P0.9 [PR #6](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/6) at `675675cdf4d1a6868f370e6417ac689a15c1054b`, itself stacked on P0.8 [PR #5](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/5) at `844361b5edd8ca1c2498ee1e708c66b634312069`. All three PRs were open/unmerged at review.
3. **P0.10 SA code review:** [PR #7 review #6013428819](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7#pullrequestreview-6013428819): `P010_SA_TECH_PASS`, 24/24 submitted tests, P0.9 camera/actor and Event Engine protected, original GLBs SHA pinned; **P0.10 Owner visual GO still pending**. That earlier review occurred before this newly uploaded video was inspected, and stated the video was unavailable **at that time**. This design is a **new reference visual-fidelity assessment**, not a silent reversal of technical regression PASS.
4. **Direct code evidence inspected:** `apps/v2-viewer/src/{seat-scene,lighting,water,ambient-fx,gift-fx,main,camera}.ts`, `apps/v2-viewer/P010.md`, `apps/v2-viewer/evidence/p010/` real native browser before/after frames, `browser-report.json`, `checks.txt`, plus `Design/{07,09,10,12,13,14,16}` and `Task/CODEX_04_P010_...`.
5. **Source distinctions:** User's video is a **livestream screen recording**, including top/bottom TikTok icons and audience/chat/gift overlays. We should compare the **underlying 3D scene, camera and visual effect choreography**, **not reproduce TikTok UI, gifts commerce, profile pictures, proprietary graphics, copyrighted thumbnails or comments**. Captions that appear spatially integrated with the scene can inspire **new original, moderated scene text**, not copying exact scripts.

**SA authority:** As required by [Design/07](07_WORK_RULES.md), SA may design/version `Design/**` and describe precise later tasks; **no Task/*.md should be issued for these newly proposed phases until Owner approves this plan**. No changes to V1, source, GLB binaries, package scripts, renderer or PR heads in this design step. No Blender/LIVE run.

## 2. Video timeline: observed source, not speculation

| Approx. video time | What is visible in underlying scene | Critical quality |
|---|---|---|
| 00:00–00:05 | Low close/three-quarter chibi sitting on a large lily pad; other pads, dark blue pond; occasional drifting pink petals and a flower bud | Readable actor foreground and layered dark water |
| 00:06–00:10 | Dense community of meditating chibis across multiple depth rows, varied clothes/hair, pads/lotus buds and a pale lotus flower in foreground; silhouetted far hills and mauve dusk haze | **Community depth is core**, not just three hero seats |
| 00:11–00:19 | Overhead/orbiting giant Sakura with richly pink backlit canopy, sparkling points at several depths, many small pads scattered around the tree, bright round glow/rim near roots | Tree as dominant luminous hero; dense layered FX without neon noise |
| 00:20–00:25 | Gift-focus portrait/semi-top shot of **specific** meditating actor, warm glow at seat/body, several floating rose-in-ring symbols grouped around actor, short Vietnamese blessing text | A timed *sequence* of feedback, not just one water ring + generic dots |
| 00:26–00:29 | Crowd shot near water level: dark/warm reflective water with broad peach-gold streaks, distant mountain silhouettes, lotus foliage, chibi rows extending into fog | High-impact water/lighting contrast and scale |
| 00:30–00:32 | Camera returns to sparse actors/pads, visible local surface structure and concentric water movement | Non-stalled transition and water legibility |
| 00:33–00:36 | Under-tree side shot: very dark thick Sakura trunk with **prominent golden lines** across branches, warm round backlight, drifting light points and low fog, many seated spectators | Highest-priority close lighting/fog/color mismatch against P0.10 |
| 00:40–00:43 | Community, far mountain range/haze, glowing pink-gold water reflections, lotus blossoms/buds, several actor clothing color variations | Cohesive atmosphere in wide/close alternation |
| 00:44–00:46 | Return toward tree with backlit warm pink canopy, trunk silhouette and small animated motes, far lake/people | Consistent tree presence and camera storytelling |

**Cautions:** The apparent warm disk near the canopy/behind the trunk is **a visible circular backlight**, but the screen recording alone does not establish whether the original scene contains a physically modeled moon, light card or volumetric effect. Therefore reproduce the **visual result**, not falsely assert the asset type. Gift rose symbols in the reference are identifiable visual elements, but we must use **original assets/UI design** and typed in-app gift data. Original clip's specific user names, screen recording overlays, branded objects and chat text are **not content requirements**.

## 3. Current baseline versus reference — evidence and honest status

| Category | P0.10 currently does | Gaps revealed by viewing the *actual* reference | SA decision |
|---|---|---|---|
| Sakura GLB structure | Approved R16 original ECO/QUALITY geometry, verified SHA, preserves scale, silhouette, roots | Canopy appears pale under current daytime-like lavender ambient; dark bark's gold fissures much less luminous than 33–36s video | **Preserve geometry; first improve renderer mood/light.** Escalate to a new, isolated AI Visual *variant* only if original materials cannot achieve desired look |
| Lighting/sky/fog | `lighting.ts` lavender solid background, three directionals, uniform `FogExp2` | Video alternates dark blue-purple dusk and warm magical backlit tree, misty mountain silhouettes, strong near/far spatial separation, golden under-tree beams | **Largest immediately actionable look-dev gap**, P0 next |
| Water | Y=0 single-pass shader, soft crossing ripple, stylized projected canopy/trunk glow, ring for confirmed gift; two profile knobs | Current near-water/aerial browser frames are predominantly flat/matte mauve; reference at 26–29s and 40–43s has recognizable bold, elongated peach/gold reflection over dark lake. Current code is technically correct but weaker visually | **Rework visual grading/cue in context of new lighting**, without inventing real SSR or replacing plane blindly |
| Ambient | P0.10 48/36/7 ECO motes/petals/leaves; QUALITY 94/74/15, one shader Points draw | Soft particles exist, but reference's overhead tree has richer sparkle depth/halo and strongly visible under-tree golden flecks; alone, increasing count will not fix mood | **Tune distribution, response to lighting, depth and visibility** only after atmosphere baseline |
| Scene population | `seat-scene.ts` has three fixed pads, preview seat1; actual demo registry max 3 | Video shows many rows of *occupied* pads in community plus many small distant pads in aerial; there are flowering lotus objects, buds, horizon hills | **Major completeness gap**; distinct later scalable scene/occupancy phase, cannot fake identities |
| Character/variants | P07b1 3 same actor source with material variant options in GLB; tree-facing and 2s idle P0.9 approved | Reference community visibly mixes clothing/hair/color and poses; density is more important than retouching the accepted male hairstyle | **Freeze current approved hero GLB**. Reuse existing approved variants/assets first; only commission missing low-poly instances/assets as required |
| Gift effect | Typed room+request+actor+seat, confirmed once, observed cue, halo+sparks, ripples, no-seat truth; A→B→C | Reference 20–25s displays several glowing rose-bubble icons around giver, warm seat aura, staged ascent/acknowledgement, scene blessing caption | **Richer controlled gift choreography** later, not an Event Engine rewrite |
| Camera | P0.9 four seed-selected continuous cinematic routes, actor target and FIFO return, owner visual GO | Video uses close portraits, crowded water-level sweep, aerial Sakura, gift portrait, warm under-tree composition. Approved route correctness is necessary but currently frames **empty space** due to missing crowd and atmosphere | **Preserve camera algorithm; revalidate shot targets after world population and lighting** |
| Performance | Submitted P0.10 SwiftShader matched ECO 8.12→7.43 FPS, QUALITY 2.22→2.09, extra one ambient draw | Dense reference scene may require many pad/character instances and stylized reflections. No measurements on Owner RTX or LIVE Studio yet | **Prepare budgets per phase and gate scaling**, no unverified 30 FPS claims |

**No evidence of P0.10 business regression:** P0.10's scoped **TECH PASS** remains. But **full-video VISUAL FIDELITY = PARTIAL**; it would be incorrect to call the entire 3D reference look finished. Existing P0.10 **OWNER VISUAL GO = PENDING** until Owner evaluates on their browser.

## 4. Prioritized roadmap (small, independent gates)

### Step 0 — Freeze reviewed base, obtain Owner design approval (now)

- Preserve PR #7 at `323955b`, PR #6 `675675c`, PR #5 `844361b`; no automatic merges or editing accepted GLBs, P0.9 actor directions/camera route, typed Event Engine, V1 or LIVE.
- Keep P0.10 `SA TECH PASS`; treat reference-visual gaps as **new design scope**, not retroactively failed unit tests. Owner should decide whether current P0.10 appearance gets an iteration-specific visual GO or defer it until P0.11 look-dev.
- This file is proposed for Owner review **before** any new `Task/CODEX_05_...` assignment.

### Step 1 — Proposed P0.11: Atmosphere, tree lighting and reflective pond (highest visual priority)

**Lead: Codex AI Code** for renderer lighting, atmospheric material integration, water shader, environment color and profiling. **SA** owns A/B camera/lighting lock. **AI Visual only if a new original art asset is demonstrably necessary**, and then in a *separate* asset branch/task.

- Three coherent *art-directed lighting looks* based on one shared scene, not random day/night changes: `DUSK_COMMUNITY` (00:06–00:10, 26–29), `PINK_AERIAL_BLESSING` (11–19), `GOLDEN_UNDER_TREE` (33–36). These are shot-aware exposure/color profiles, not abrupt reconfigurations on every frame. Crossfade exposure, local accent illumination and fog density during current camera blends. Stay within physically tolerable color and existing material constraints.
- Darker near-water violet/navy foundation with **visible stylized peach/gold reflective streaks** moving slowly under lights, existing y=0 ripples and correct lotus contact; no full-resolution SSR/planar mirror by default.
- Enhance warm golden line legibility on existing trunk using **SA-approved lighting/material integration** (e.g. local accent glow linked to already present gold PBR material, with safety clamp). Preserve exact GLB hashes and no forced change to original bark/hair textures. If a shader-only method cannot reproduce gold veining, define a separate *new* R17 art variation gate, not a silent R16 overwrite.
- Soft backlit canopy and a few volumetric-*style* rays/dust without expensive global ray marching; strong near/far separation, optional original sky glow disk and gentle banked fog. Background silhouette/hills **asset stage** must be isolated if new geometry is needed.
- Keep real sampled preview at 720×1280; A/B (same timestamp/camera/exposure/seed) at approx 7.5, 12.5, 26.5, 34.5, 44.5s reference-inspired poses; do not require matching TikTok UI/camera pixels exactly.
- **PASS:** tree keeps silhouette and original 4 GLB checksums, foreground actor still legible, golden veins convincingly visible under-tree, warm water highlights visibly move in low/wide shots, no unnatural strobe/abrupt shot seam, tests and web GL compile PASS, ECO/QUALITY frame-cost measured same-host. No new source scope by itself.

### Step 2 — Proposed P0.12: Lotus ecosystem, world depth and scalable community

**Separate roles:** **AI Visual** owns missing real original assets (flowering lotus, buds, distant hills/rock only where truly missing, with editable source/GLB + manifest and true Cycles proof); **Codex** owns occupancy layout, instancing, renderer/LOD, nameplates and event mapping after SA locks asset contracts. They work in separate PRs with no simultaneous same-file edits.

- Build deterministic seeded **ring/arc bands of lily pads around the Sakura** and across foreground/lake, distinct near/mid/far scale. Keep a clear water corridor to tree roots and camera safe passages; do not simply copy exact positions from video.
- **Real viewer identity is not a decorative avatar.** Scene should distinguish `real occupied seat`, `anonymous decorative seated figure` (if approved), `empty lily pad` and `flower/bud`. No fake username or claimed TikTok viewer from decorative actors. A gift focus always resolves an actual Event Engine actor; exhausted capacity must remain truthful.
- Prioritize existing P02 lotus and approved GLB/material color variants; re-use the accepted female/other approved assets if manifests and animation integrity support their integration. Build crowd diversity without commissioning unnecessary hairstyle rework.
- Candidate progressive stage budgets **for validation, not performance promises**: 3→12→24 visible seat/actor combinations in DEMO; only consider higher dense far-LOD targets (e.g. 40–60) if tests on Owner GPUs justify. Favor batching, instanced props, low-bone distant actors, view-dependent animation, pool caps and explicit memory limits.
- Add a **small number of real flowering lotus/bud assets** interspersed among lily pads, not a new giant environment scope. Distant mountains can be layered silhouettes with verified simple original materials/mesh from AI Visual; fog ensures horizon depth.
- **PASS:** at least one low-angle/community and one aerial screenshot visibly read as populated lake rather than three isolated seats; flower and bud readable, 3D parallax real; actor identity, A/B/C focus, animated contact and no-seat fallback preserved; no fake viewers; measured draw/geometry/VRAM evidence for each density step.

### Step 3 — Proposed P0.13: Gift blessing choreography / cinematic storytelling

**Codex renderer owns timed FX sequencing**, consuming existing typed gift lifecycle only. **AI Visual** supplies original flower/rose icon/sprite assets only if an original 2D/3D visual is approved; no TikTok-branded UI graphics.

- Preserve P0.10 observed→confirmed dedup and actor+seat+room+request binding.
- For *confirmed* gift, staged light **(a)** brief warm glow below lotus, **(b)** 3–5 floating stylized icon/petal halos orbit/rise *near the correct actor*, **(c)** some sparks drift toward the hero tree with a soft response near trunk/canopy, **(d)** fade and camera returns. Durations and icon counts are **proposals to visually tune**; don't equate number of displayed icons to gift payment count without correct semantics.
- Retain clean face/name/gift label, safe 9:16 margins, no over-bright white flash and no third-party copyrighted rose badge; optional short original blessing copy is template-driven/moderated and must not mirror arbitrary raw user comments.
- No-seat and stale/expired events remain truthful, and B/C cannot emit effects on A. Pools stay bounded; no rerun from repeated confirmation/reconnect; no camera random override.
- **PASS:** true native video shows clear, recognizably different observed vs confirmed scene reaction and exact A→B→C, no offscreen/nameplate collision and clean cinematic fade after queue drains.

### Step 4 — Proposed P0.14: Full reference shot-parity and QA lock

**Codex** targets camera composition/scene profile interactions only *after* environment and population exist; preserve P0.9's validated seeded route continuity and API.

- Validate **seven golden reference moments** (1, 7.5, 12.5, 22.5, 26.5, 34.5, 44.5s) against **our own 720×1280 clean-capture camera views**: close human, community low-angle, aerial hero, gift focus, lake reflection, gold under-tree, return tree/community. Compare crop, silhouette, relative screen occupancy, fog, reflected color and presence of pads/lotus.
- Match *intent and composition*, not literal individual users, time synchronization to the recorded livestream, platform overlays, copyrighted gift symbols or unproven exact parameters.
- Test 85 s idle/no gifts and 66 s A/B/C DEMO in at least 3 camera seeds, two full route cycles, camera/tree/water clearance, gift interruption/return, snapshots, memory and context restore; fix only demonstrated regressions.

### Step 5 — Proposed P1.0: Owner GPU and LIVE Studio gates (after visual completeness)

**First hardware-only test:** Windows Owner GPU RTX 3050 Ti 4GB **ECO** at 720×1280, and RTX 3060 8GB **QUALITY** at 720×1280; actual fps, p50/p95/p99, driver/device, VRAM, JS heap, draw calls and 15–30min stability; scale from 3→12→24 actors and the actual video-equivalent requested density. Tune until hardware results justify profile caps. **Only after Owner explicitly authorizes**, run concurrent LIVE Studio capture and TikTok adapter integration tests in a separately reviewable scope.

**Stop/hold:** No implied automatic merge from PR #7, #6 or #5, no LIVE Studio use during new art/code visual phase, no fabricated hardware FPS. No paid service without Owner permission.

## 5. Who owns what, and what NOT to do now

| Work | Responsible | Prohibited shortcut |
|---|---|---|
| Video shot map, look profiles, acceptance and branch dependencies | SA | Claim pixel/video parity from GIF, generated image or old P0.10 tests |
| Water shader, scene fog, lighting, particle and gift effect controllers, crowd renderer, identity mapping | Codex | Generate production meshes/textures and pretend reference clip was not reviewed |
| New flowers/buds, far mountain/rocks, bespoke art variation if missing | AI Visual (in new approved asset task) | Edit original R16/P02/P07b1 binary in place or rerun all historical Blender evidence |
| Camera/graphics preference signoff, hardware capture, future merges | Owner | Automatically infer GO from source tests |
| TikTok comments, gift economy, V1 live transport | Deferred separate phase | Copy platform UI, names or media from video |

**Control:** Any new Task must state reviewed SHA/base/new branch/PR, exact shot times, deliverables, immutable GLB hashes, objective 720×1280 comparisons, performance truth and `SA_REVIEW_REQUIRED`. No single broad task asking Codex to simultaneously do water, mountain models, avatars, gifts, LIVE and performance. Keep this design draft until Owner explicitly approves sequencing.

## 6. Open Owner decisions for design sign-off

1. Confirm the overall **dark rose-gold twilight / mystic lake** reference look as the priority, rather than retaining the existing brighter lilac palette. This is the most consequential artistic choice.
2. Confirm whether the first next phase should be the recommended **P0.11 atmospheric water/lighting** (without crowd) or start with **P0.12 scalable community**. SA recommends lighting/water first because it governs all later A/B footage.
3. Confirm that crowd/lotus variation should be **inspired by**, not a literal commercial clone of, the reference; preserve original approved avatar designs and only make missing assets.
4. Current P0.10 `TECH PASS` remains; **Owner Visual GO still pending**. Owner may accept the standalone FX as baseline for P0.11 while noting full-reference fidelity partial.

**SA proposal:** Owner approves Design 17 → SA issues a narrow `CODEX_05_P011...` task for atmosphere/reflective pond and, later, distinct AI Visual/Code tasks for flower, crowd and gift choreography. Until design GO, this file alone grants **no runtime code/asset changes**.
