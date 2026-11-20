# 08 — Acceptance tests, open decisions and next steps

## Video-fidelity visual acceptance

Score each 1–5; P0 categories should all reach >=4 by owner approval after side-by-side 6 reference shots (3s, 9s, 15s, 20s, 33s, 42s). This is a proposed review rubric, not existing test result.

| Criterion | Target |
|---|---|
| World geometry & depth | 3D camera changes real perspective, not 2D backgrounds |
| Sakura landmark | Huge pink canopy with dark trunk and same visual emphasis |
| Water + lily pads | Blue-violet reflective lake, rich green floating leaves in arcs |
| Character silhouette | Small round-head chibi in cross-legged seated pose, multiple variants |
| Crowd | Close 1–3, medium 10–30, aerial many tiny avatars/pads |
| Camera | Smooth transitions through close, community, aerial, under-tree |
| Lighting/fog | Deep blue-to-pink mood, distant mountains/smoke, petal ambience |
| UI/readability | Nameplate/bubble on selected avatars; no TikTok phone chrome baked into scene |

## Functional acceptance

- Mock 1/10/30/100 viewers, stable seat mapping, Unicode Vietnamese names, rejoin/dedup.
- Fake gift streak progress -> final confirmation exactly once. Gift visual cannot stall connection.
- **Camera (owner-approved):** zero gifts for 45+ seconds = continuously moving cinematic; A sends during AERIAL -> close A/name/FX; B and C queue -> focus B then C; after queue empty -> cinematic resumes without teleport.
- Same giver multiple gifts/progress packets: coalesce bounded focus, no starvation of another queued giver; gift giver absent from scene still shown correctly.
- Simultaneous/rapid gifts test with queue overflow, disconnect and room changes; verify dedup, TTL and honest fallback.
- 500 likes/event burst with bounded scene FX; viewer total not used for spawn.
- Reconnect same room and switch room, no stale events.
- Capture 720×1280 and/or 1080×1920, proper safe area (video phone record is 720×1556, separate resolution).
- Run reproducible `DEMO` locally, profile both **RTX 3050 Ti 4GB (ECO baseline)** and **RTX 3060 8GB (QUALITY)** together with LIVE Studio; report measured GPU/FPS/VRAM and acceptable degradation when crowd > maximum. Targets are provisional, not guaranteed.
- V1 code and production settings unmodified.

## Owner decisions (only genuinely unknown from clip)

1. **Spawn rule:** comment only? member/join? gift? follow after additional connector support? Suggested starting point: chat + gift, optionally member toggle; V1 uses chat by default and member OFF. The clip alone does not prove rule.
2. **Avatar lifetime:** remain until stream end or TTL (e.g. idle 8–20 min)? Suggested TTL+restore for disconnect.
3. **Visual density:** maximum active avatars visible simultaneously; suggested P0 100 with distant LOD while many static lily pads can exist, benchmark before commit number.
4. **Gift-camera behavior — CONFIRMED 2026-11-20:** gift -> close-up correct giver/name/effect -> next gifter FIFO -> return cinematic when empty. Still open only detailed FX mapping per gift type, exact hold/transition times. See 09.
5. **Visual engine & budget:** owner hardware CONFIRMED RTX 3050 Ti 4GB and RTX 3060 8GB. Remaining: measured CPU/RAM, simultaneous TikTok LIVE Studio frame-rate and renderer spike; Two presets in 10.
6. **Content:** comments/bubble moderation; ambient background music rights; whether V2 needs fortune/incense/lantern (not visible in reference video, recommended OFF for first version).

## Confirmed specialization and P0 priority (2026-11-20)

- Owner requests **two independent ChatGPT AI roles**, SA reviews both: AI 3D creates REAL production 3D meshes/source/GLB (with Blender/3D generation), Codex writes ONLY code. Details 11–13.
- **P0 focus:** V2 Event Engine and 3D Scene + Camera. LIVE adapter is necessary reused infrastructure, not license to rebuild V1. All noncritical features P1/P2 are deferred.
- AI 3D acceptance includes GLB mesh validation and multi-angle real asset renders; Codex acceptance includes deterministic event/queue tests, continuous cinematic and real gift camera focus.

## Work ordering after owner approves design

- Stage 0: final owner decisions & approve visual direction.
- Stage 1: SA locks AI 3D manifest and Event Engine integration schema (13); AI 3D separately produces meshes, Blender source and GLB assets + 6 real scene shot previews. Codex may develop engine against mock asset IDs concurrently.
- Stage 2: Codex builds V2 Event Engine and 3D scene/camera technical spike in isolated V2 code branch using only approved GLB assets (or clearly temporary test placeholders).
- Stage 3: Integrate validated AvatarRegistry and gift focus FIFO scheduler with scene anchors/nameplates, cinematic camera and production tree/chibi/pad meshes; SA independently reviews art and code.
- Stage 4: Reuse V1 TikTok connector via small V2 adapter, DEMO and fixture verification; keep V1 live deployment intact.
- Stage 5: Validate gift-focus A/B/C, 6 golden shot visual fidelity, ECO/QUALITY GPU profiling (10), optimize only after confirming bottleneck.
- Stage 6: Electron/OBS capture, regression test, optimization and staged LIVE rollout.

**Only after design sign-off** does SA create `Task/*.md` file-by-file with input references and verification commands for AI Code.
