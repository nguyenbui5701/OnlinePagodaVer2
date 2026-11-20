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
- 500 likes/event burst with bounded scene FX; viewer total not used for spawn.
- Reconnect same room and switch room, no stale events.
- Capture 720×1280 and/or 1080×1920, proper safe area (video phone record is 720×1556, separate resolution).
- Run reproducible `DEMO` locally, report GPU/FPS/VRAM on stream computer, acceptable degradation when crowd > maximum.
- V1 code and production settings unmodified.

## Owner decisions (only genuinely unknown from clip)

1. **Spawn rule:** comment only? member/join? gift? follow after additional connector support? Suggested starting point: chat + gift, optionally member toggle; V1 uses chat by default and member OFF. The clip alone does not prove rule.
2. **Avatar lifetime:** remain until stream end or TTL (e.g. idle 8–20 min)? Suggested TTL+restore for disconnect.
3. **Visual density:** maximum active avatars visible simultaneously; suggested P0 100 with distant LOD while many static lily pads can exist, benchmark before commit number.
4. **Gift reactions:** rose shows subtle petals/ripple/focus? other expensive gifts large event? Need explicit mapping and no implicit economic claims.
5. **Visual engine & budget:** PC GPU/VRAM, concurrent TikTok LIVE Studio, target FPS. Spike picks Three.js vs Babylon.
6. **Content:** comments/bubble moderation; ambient background music rights; whether V2 needs fortune/incense/lantern (not visible in reference video, recommended OFF for first version).

## Work ordering after owner approves design

- Stage 0: final owner decisions & approve visual direction.
- Stage 1: AI Visual produces moodboard/meshes + validation of 6 target shots.
- Stage 2: 3D scene/camera performance spike in isolated V2 branch.
- Stage 3: Avatar registry, seating, nameplates, scalable crowd.
- Stage 4: V1 connector reuse via small V2 adapter, DEMO and fixture verification.
- Stage 5: chat/gifts/FX, camera director integration.
- Stage 6: Electron/OBS capture, regression test, optimization and staged LIVE rollout.

**Only after design sign-off** does SA create `Task/*.md` file-by-file with input references and verification commands for AI Code.
