> **OWNER_QUALITY_ONLY_GO / ECO_FUTURE_WORK_DEFERRED — 2026-11-28.** Owner explicitly directs that all future development and operation focus on existing `QUALITY` only; no more ECO work. This policy supersedes every older ECO or dual-profile development, asset export, visual parity, profile-specific test, soak, benchmark and acceptance requirement prospectively. All new AI Visual/Codex tasks, review evidence, runbooks and Owner capture settings must target QUALITY. Do not develop, optimize, generate new ECO variants, run dedicated ECO evidence or require ECO parity/PASS. Keep accepted ECO source/assets and historical receipts intact for compatibility/rollback; no deletion, forced migration or broad rewrite is authorized. Continue shared functional/security/identity/gift/ACK/audio/settings regression and builds, including existing tests that happen to exercise legacy ECO where needed for shared code safety; no dedicated ECO campaign. QUALITY means the current QUALITY preset, not future HIGH QUALITY. Select QUALITY explicitly in Dashboard/fixtures/runbooks; no automatic runtime default change in frozen PRs. Physical performance still must be measured on hardware used for QUALITY, including RTX3050Ti 4GB if Owner uses it; no inferred FPS or automatic ECO fallback. Existing no-merge, provider/OBS/Studio/listening, art, security, zero-cost and STOP gates remain. Reintroducing ECO as an active target requires explicit Owner approval. The dual-profile tables, ECO defaults and ECO hardware targets below are historical technical reference only. Active development and deployment target QUALITY, 720x1280 and ~30 FPS subject to actual measurement with OBS/Studio on the machines Owner will use; 1080x1920 still requires measured approval. Do not assume RTX3050Ti can achieve this in QUALITY. If performance is insufficient, report bottleneck and optimize QUALITY within approved art constraints, not ECO. Existing runtime default may remain legacy until separately authorized change.

# 10 — GPU/VRAM deployment profiles (owner hardware)

**Confirmed user hardware:** Windows PC #1 NVIDIA GeForce RTX 3050 Ti with 4GB VRAM; PC #2 NVIDIA GeForce RTX 3060 with 8GB VRAM. Both machines may run TikTok LIVE Studio / capture concurrently. This document uses the user's stated memory capacities, does not assume CPU/RAM, and gives **initial quality presets**, not measured FPS.

## Goals

- **Compatibility target (baseline):** 3050 Ti 4GB should deliver playable responsive 3D scene with stable ~30 FPS at a target **720×1280 clean capture** while LIVE Studio runs, after real-machine profiling.
- **Preferred quality target:** 3060 8GB should support richer scene, shadows, reflections, more visible agents at 720×1280; attempt 1080×1920 only if actual profiling passes without streaming stalls.
- Do not assume all advertised VRAM available to our app: OS, Electron, TikTok LIVE Studio, video encode, and desktop consume GPU/VRAM. No hard promise of 100 moving high-detail avatars; use scalable LOD/instancing.
- Design scene assets once; use 2 preset configs, shared logic, no bifurcated codebase.

## Initial knobs (proposals to test)

| Feature | ECO — 3050 Ti 4 GB | QUALITY — 3060 8 GB |
|---|---|---|
| Captured canvas | 720×1280, internal renderScale 0.75–1.0 | 720×1280 (first), optional 1080×1920 at renderScale 0.75–1.0 |
| Target frame rate | 30 FPS target | 30 FPS target, more stable quality prioritized over 60 FPS |
| Sakura canopy | low/medium cluster mesh + GPU instances + LOD | denser instances, more canopy layers |
| Lily pads | batched instancing, 2–3 variants | instanced 3–5 variants |
| Avatar near-camera | 6–12 high detail slots | 12–24 high detail slots |
| Avatar distant crowd | very lightweight low-poly meshes/impostors; capacity based on test | more real low-poly, distance LOD, capacity based on test |
| Shadow | one inexpensive sun/main shadow OR fake blob contact shadows | quality-tuned 1 shadow-casting primary light |
| Water | simple animated shader with fake highlights/ripples | higher shader quality; limited dynamic reflections only if profiled |
| Particle | low petals/sparkles, effect pooling | medium petals and sparkles, pool caps |
| Post-processing | minimal/no bloom, avoid SSAO high-res | small bloom if budget allows, avoid multiple full-screen passes |
| Texture | compressed and shared, prefer 512–1024 px | compressed and shared, selected 1024–2048 px assets |
| Nameplate | near/focus only; distant cull | near/medium, distance cull |
| Priority | interactive gift focus stable, smooth camera > particles | same, extra visual layers if no stalls |

Ranges are **design suggestions**, not camera/video measurement or guaranteed GPU limits. Total crowd density is driven by spawn/seat logic and dynamic LOD; visible distant avatars are not necessarily all rigged/skinned objects.

## Performance control and fallback

1. Measure GPU memory, FPS/frame time (50/95/99 percentiles), JS heap, scene actor count, draw calls, vertices, textures, network/IPC drop counts. Collect while LIVE Studio is open and capturing.
2. Progressive degradation order under load: reduce renderScale/resolution -> petals & water detail -> shadows/post-processing -> distant actor LOD/nameplate density; **preserve** clear close-up avatar/gift effect and stable cinematic shot transitions.
3. Resource lifecycle: cached GLB/texture variants, GPU instancing, disposed meshes/materials when scene resets; never load a fresh avatar GLB per gift event.
4. Test at 0/10/30/100 active avatars (or bounded cap achievable on machine) and hundreds of background pads. Run sustained 30+ min demo; inspect spikes after bursts and after scene restart.
5. Water/sky/tree should remain present in ECO; don't replace with static screenshot just to meet perf. Ensure no WebGL context loss during repeated camera transitions and gift storms.
6. Default **ECO on unknown hardware**; detect GPU hints only to suggest, not silently hardcode model IDs. Operator override and dynamic frame-rate protection available.

## Acceptance evidence

AI Code/owner attaches:
- Exact CPU/RAM/GPU model / driver, browser/Electron, TikTok LIVE Studio capture resolution.
- For each preset: stable scene screenshots of golden frames 3s, 15s, 20s, 33s; 10/30/100 crowd FPS profile and 10 simultaneous gifters latency/queue report.
- Worst-case memory/performance stats + event throughput over demo.
- For 3050 Ti: demonstrate 30 FPS target or log bottleneck and adjust preset transparently, not mark PASS by assertion.
- For 3060: compare against ECO and document whether 1080×1920 capture works.

**Implementation implication:** Renderer choice Three.js/Babylon.js is not locked until this comparative spike, measured on the 3050 Ti 4GB first to guard against a design that only runs on 8GB.

## Owner decision — Art First / Performance Driven Optimization (2026-11-25)

**OWNER_HIGH_QUALITY_ART_FIRST_GO.** Owner requests HIGH QUALITY for the future so AI Visual has more freedom across the entire 3D world, not only the blessing tree. This is a project-wide forward-looking asset authoring and graphics policy; it supersedes earlier rigid artistic triangle/byte ceilings, not actual resource safety, acceptance, licensing or task sequencing. Historical accepted binaries, manifests, SHA pins and evidence remain immutable.

- Author a high-quality editable MASTER first, with sufficient topology, textures, materials and animation for the intended visual result. Keep reusable source/LOD recipe, then derive ECO and QUALITY exports appropriate to visual importance, projected size, animation, instances and measured cost. HIGH QUALITY (HIGH_QUALITY) is a future opt-in runtime profile and may also be supplied as a separately validated GLB candidate now when useful. It is NOT required as a third runtime export for every small prop or a third full evidence gallery in the current R18a task. Preserve existing ECO/QUALITY export contracts and compatibility.
- For the single hero tree, initial planning references: ECO 120,000 triangles, QUALITY 500,000 triangles, HIGH QUALITY 1,000,000 triangles. These are soft estimates, neither quotas nor absolute ceilings, and do not apply per flower/fish/actor or to the whole world as a fixed total. Report actual counts, bytes, draw calls/materials, textures, skinning and instance-weighted scene cost. Exceeding a reference needs a short visual-benefit/resource explanation in the normal handoff, not an extra preapproval or automatic rejection. No arbitrary forced subdivision; use selective detail, shared meshes, LOD, instancing and material optimization. Keep finite valid geometry, topology/contact/anchor checks, truthful manifests, bounded runtime pools, and versioned asset integrity.
- ECO remains compatibility/default on unknown hardware; QUALITY remains the richer current deployment target. HIGH QUALITY is designed across tree, lotus/pads/buds, koi, terrain, actors, textures, lighting, shadows, water, atmospheric FX and camera framing. No separate codebase or duplicate logic. Do not silently enable it on current machines; actual support/hardware requirements unknown. At future integration, select only via explicit Dashboard profile with existing safe apply/rollback and truthful applied profile, after actual benchmark; no new runtime option in this documentation-only change.
- Runtime acceptance is driven by actual whole-scene frame time/FPS (target stable ~30 FPS at 720x1280 with LIVE Studio on existing two GPUs; 33.3ms frame interval reference, report p50/p95/p99 rather than asserting all frames meet it), GPU/VRAM, heap, draw calls, rendered triangles across passes, shader/overdraw, CPU/encode load, loading/stalls and stable event/voice/camera continuity. HIGH QUALITY resolution/FPS/hardware to be selected after profiling, no guarantee on RTX3050Ti/3060. Art acceptance does not imply production GPU PASS. No software-renderer hardware claim. If heavy, profile first, optimize bottleneck selectively or derive lighter LOD rather than sacrificing the high-quality master. Optional higher-quality assets not loaded unnecessarily in ECO/QUALITY. 
- Current R18a remains one focused gold-only finalization, same PR27 and input hashes from latest SA R1, preserve repaired non-gold structure and accepted R18 candidate. Remove +300 gold triangles, 60k/250k total and +5% byte constraints as rejection gates for new R18a; allow the gold geometry needed for visibly good surface-following veins; don't reopen unrelated structural work. Keep independent binary/Blender/visual evidence, zero cost, Owner art GO and integration HOLD. No rerun of unchanged R18 audit/build/preview. Only B8 art remains active; B8 integration/B9/C0 dependencies unchanged, no merge or runtime change.
