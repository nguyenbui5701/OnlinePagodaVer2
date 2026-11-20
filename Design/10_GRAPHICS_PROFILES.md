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
