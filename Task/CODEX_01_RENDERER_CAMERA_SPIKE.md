# Codex P0-01 — Native 3D renderer + continuously moving cinematic camera spike

**Assignee:** Codex / runtime software. **Status:** ASSIGNED. **Suggested branch:** `feature/v2-renderer-camera-p0`. **Separate PR** from AI Visual and Sakura PR #1; do not modify V1.

## Required reading

`Design/16_P0_APPROVAL_AND_HANDOFF.md`, `Design/02_REQUIREMENTS.md`, `Design/03_VISUAL_WORLD.md`, `Design/04_CAMERA.md`, `Design/07_WORK_RULES.md`, `Design/09_GIFT_CAMERA_DIRECTOR.md`, `Design/10_GRAPHICS_PROFILES.md`, `Design/11_3D_ASSET_PRODUCTION_PIPELINE.md`, `Design/12_CORE_PRIORITIES_AND_AI_ROLES.md`, `Design/13_3D_EVENT_INTEGRATION_CONTRACT.md`; video `chuav2.mp4` reference.

## Scope — renderer spike, not full product

- Examine current V2 repo layout first. If no runnable V2 app exists, add a **small isolated TypeScript/Node/WebGL DEMO scaffold** without assuming package scripts already exist. Document exact install/dev/test/build commands actually created. Keep production V1 untouched.
- Evaluate **Three.js + GLTFLoader as FIRST spike candidate**, not irrevocable final runtime choice. Real GLB import/material/axis check must use owner-approved R16 QUALITY SHA `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`, ECO SHA `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` (verify exact bytes/hashes from approved Design/16 manifest). Keep source asset immutable; load by manifest rather than buried hardcoded URLs. A first scaffold can use a conspicuously named debug primitive ONLY until the actual GLB is available; no claim of asset-native PBR PASS from a primitive.
- Set up camera with **CLOSE, COMMUNITY, AERIAL, UNDER_TREE** modes, deterministic spline/orbit timeline, eased transitions and true 3D parallax; **no gift** for ≥45s must show continuous movement and repeat without a frozen camera. Portrait canvas **720×1280**, camera FOV & safe area explicit. Water plane/fog/lighting may be minimal **runtime shader primitives** authored by Codex (not pretending to be finished art).
- Implement GPU resources, loading states and responsive fallback, scene graph groups, stable camera anchors/seat transforms as defined by Design/13. Renderer consumes `AvatarPresentation`/`FocusIntent` typed **mock** adapters but should not implement independent event business rules in this PR; keep client API small.
- Compare PBR materials of the genuine R16 GLB to fixed Cycles reference under documented matched lighting as closely as native Three.js allows, with side-by-side screenshots and disclosure of unavoidable differences. Validate glTF orientation (+Y), shadow/mat colors, petal double-sided and culling. A GLB that is absent or hash-mismatched is a **hard blocker** to claiming native R16 validation.
- Set up render/diagnostic instrumentation (FPS/frame times, draw calls, triangles, texture count, 9:16 viewport, shader/context errors). **Do not claim 3050Ti/3060 or LIVE Studio PASS** without owner-run hardware measurements.

## Exact first acceptance

- [ ] Same actual Sakura R16 GLB is visible in at least top, under-tree, three-quarter and 9:16 camera screenshot, not a 2D image/AI picture. Log asset ID + real SHA and repo revision.
- [ ] No-gift cinematic replay over 45s (CLOSE→COMMUNITY→AERIAL→UNDER_TREE→return) has true 3D camera movement, no teleport, no freeze, repeatable seed/time.
- [ ] Asset contract fields and seat-target transform are consumable without modifying mesh; no hidden V1 dependencies, package scripts and clean build/test documented.
- [ ] Native GLTFLoader PBR comparison/screenshots produced for at least full-tree, top/under and 9:16; list discrepancies, particularly pink canopy material and dark bark.
- [ ] Report FPS only measured in actual test environment, with device/window resolution and whether LIVE Studio was open. If not, explicitly mark pending.
- [ ] PR references immutable Design/16 and R16 manifest SHA, contains reproducible DEMO commands, tests and screenshots for SA review.

**Not in this task:** production avatars/pads modeling, actual TikTok login/connector, nonessential rituals/admin UI, claiming GPU target pass from desktop development. Defer gift-camera queue logic to CODEX_02; connect intents in integration Task.
