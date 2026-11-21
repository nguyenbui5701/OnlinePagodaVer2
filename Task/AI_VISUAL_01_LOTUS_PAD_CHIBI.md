# AI Visual P0-01 — Real lotus-pad seat and original seated chibi

**Assignee:** independent AI Visual / 3D. **Status:** ASSIGNED. **Branch:** `assets/lotus-pad-chibi-p0` (new branch/PR; do not edit Sakura PR #1). **Zero-cost tools only.**

## Read before acting

`Design/16_P0_APPROVAL_AND_HANDOFF.md`, `Design/01_VIDEO_BREAKDOWN.md`, `Design/03_VISUAL_WORLD.md`, `Design/07_WORK_RULES.md`, `Design/10_GRAPHICS_PROFILES.md`, `Design/11_3D_ASSET_PRODUCTION_PIPELINE.md`, `Design/13_3D_EVENT_INTEGRATION_CONTRACT.md`, `Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md`; inspect owner clip `chuav2.mp4` at ~3s/9s/42s for pad + chibi scale. Don't invent exact pixels/features not visible in reference.

## Scope and order

1. Build **one original floating `lotus_pad_01`** with up-facing geometry, stem/notch/vein silhouette that reads from both water-level close and aerial; **real GLB + editable Blender source**, no billboard-only prop. Declare visual top surface height and a stable seating anchor at center.
2. Build **one original `meditator_base`**: large rounded head, compact body, seated cross-legged, hands resting, calm face, original hair/outfit design resembling the VIDEO style but not an extracted branded model. Include a stable skeleton/rig or equivalent editable animation setup, `sit_idle` gentle breathing, optional `react_gift` clip if feasible without blocking first delivery.
3. Provide **named nodes** `SeatRoot`, `HeadAnchor`, `NameplateAnchor`, `FXAnchor` (or exact numeric local offsets if nodes cannot be exported). Actor seated contact origin is `[0,0,0]`, local forward `+Z`, `+Y` up; pad local origin at center, positive `+Y` leaf upper face. World `Y=0` is water-surface convention for runtime *proposal*; actual leaf seat offset must be measured in manifest.
4. Provide optional near/far avatar LOD and pad variants only AFTER first pair looks right. Lightweight prototype budgets are targets to **measure**, not fabricated quotas. Favor instancing, shared materials/textures and real PBR, without overbright emissive in the Sakura scene.

## Deliverables (all individually reviewable)

- `Assets3D/Review/lotus_pad_chibi/p0/` README, `asset_manifest.json`, `LICENSE_AND_PROVENANCE.md`, Blender/Python source as appropriate, exact SHA-256/bytes and `BINARY_HANDOFF.md` marking any large files `pending_owner_upload`; expected real GLB names `lotus_pad_01.glb`, `meditator_base.glb`, source `.blend`.
- Manifest per Design/13 v0.1.0: `assetId`, origin, bounds in meters, `+Y` up, forward/pivot/seat/head/nameplate/fx offsets or exported anchor node names, triangle/mesh/material/texture counts, skeleton/animation clip names, suggested ECO/QUALITY LOD, license/provenance. No guessed offsets; compute from model.
- Blender screenshots from front, side, back, top, close chibi-on-pad and 9:16 seated view, plus true GLB import report and short clip/stills of `sit_idle`. Show a debug head/nameplate/fx anchor gizmo and a seat contact test with no penetration/floating.
- Keep tree unchanged. Composition approval is for these assets, not a whole scene or user-specific TikTok faces.

## Acceptance checklist

- [ ] Both binary models really import as glTF 2.0 and have measured, plausible bounds, scales, pivots/materials.
- [ ] Actor's crossed legs and seated pose read from front and three-quarter; hands/head are intact through idle frames; no material popping.
- [ ] Pad has stable seat top/anchor; chibi sits without penetrating leaf; watermark/license provenance documented and zero paid calls.
- [ ] Head/nameplate/FX anchors can be resolved by renderer and safely frame one giver + name.
- [ ] Both GLBs have exact SHA-256 checksums, editable sources, named animation clips or a documented temporary animation limitation, and E/QUALITY cost comparison if two LODs exist.
- [ ] SA reviews real Blender/Cycles or equivalent actual GLB multi-camera images; original files and manifest available, not just prompts.

**Out of scope:** gift queue, TikTok API, shaders/animated water, runtime camera spline, user avatars scraped from LIVE, mass scene population. Submit a new asset PR for SA review, **do not merge yourself**.
