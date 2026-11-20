# 11 — 3D asset production pipeline: AI 3D + Blender + GLB

**Owner decision: CONFIRMED on 2026-11-20.** Codex is only responsible for CODE; a separate ChatGPT AI 3D specialist creates production 3D art/assets. SA reviews both. Video reference `chuav2.mp4` remains primary visual reference. The result must be REAL editable 3D files, not just moodboard images.

## 1. Authoring and rendering split

- **AI 3D ChatGPT**: inspect reference frames, refine concept art, create or supervise production meshes, textures, rig/animation, optimize geometry, export assets, screenshots and asset manifests. Can use a connected 3D-asset generation service such as fal *where its enabled capabilities actually support exportable 3D meshes*, or specialized text/image-to-3D tools. Do not assert the output is `.glb` unless its file content and mesh import are verified.
- **Blender**: canonical review/edit environment. Mesh edit, topology, UV, PBR texture, rig, animation, scale/pivot, LOD, export glTF/GLB. Source files `.blend` are ideal when available. **Text-to-image is for concept only**, never substitutes for mesh files.
- **Codex**: implementation-only: V2 Event Engine, Three.js (proposed) GLTFLoader, scene graph, lighting, shader water/fog, particle animation, GPU instancing/LOD, gift effects, camera and benchmark. Codex MUST NOT generate images, prompt 3D generators, craft every vertex manually, or burn tokens authoring art objects. Simple runtime procedural geometry (water plane/ripples, debug primitives) is allowed.
- **SA**: owns architecture, IDs/naming, acceptance, integration, design-change control, independent review of AI 3D output and Codex PR, integration sign-off.
- **Owner**: approves reference fidelity and can run local GPU/tool tests.

## 2. Recommended asset production workflow

1. **References**: AI 3D reads 01_VIDEO_BREAKDOWN.md, 03_VISUAL_WORLD.md and reference frames at 3,9,15,20,33,42s. Propose top-down world map, 6 camera compositions, material palette.
2. **Minimum slice**: create and validate ONE original seated chibi, ONE giant sakura tree (canopy and trunk must work from top and underneath), ONE leaf pad, ONE flower, ONE island/mountain layer.
3. **3D generation**: optional AI service generates actual mesh; refine in Blender: mesh topology, disconnected pieces, normals, UV, material, scale, number of triangles and materials, rig. Any source images must be licensed for this use. Do not simply extract or copy branded game assets.
4. **Optimize**: produce near/far versions for sakura and seated actors, share materials/textures, minimize unique draw calls and skinning costs.
5. **Export**: GLB binary 2.0 per asset with consistent transforms, source Blender files and a JSON asset manifest; deliver previews (six golden stills and close top/side/front asset previews).
6. **SA art review**: compare visual fidelity to original video, inspect geometry, poses, naming conventions, import and GPU budget; request fixes from AI 3D if necessary.
7. **Codex integration**: Codex imports approved GLBs only; scene config maps asset IDs to seats/locations and camera focuses; Codex does not change visual asset geometry to compensate for poor source quality.
8. **SA integration review**: compare rendered shots, confirm camera clearance and event focus, benchmark RTX 3050 Ti 4 GB first and RTX 3060 8 GB second.

## 3. Production asset inventory

| Asset ID | Source | Runtime | Key review |
|---|---|---|---|
| `sakura_hero` | `sakura_hero.blend` | `sakura_hero.glb` + LOD variants | Huge pink flower canopy and dark trunk; aerial and under-tree views |
| `meditator_base` | `meditator_base.blend` | `meditator_base.glb` + idle animation clips | Cute large-head low-poly seated crossed-leg form; consistent colors |
| `lotus_pad_01..03` | `.blend` | one/multiple `.glb` | Reusable pad variants, top normal correct, occupant ground anchor |
| `lotus_flower_01..02` | `.blend` | `.glb` | Pink petals, shape readable both close/distant |
| `island_rock` | `.blend` | `.glb` | Tree support structure |
| `mountain_layer` | `.blend` or documented mesh recipe | `.glb` optional | Simple distant silhouettes |
| `petal_texture` | PNG/WebP source | WebP/KTX2 or PNG | Source used for runtime particles by Codex |

Water, ripple, fog, sky gradient, bloom, gift trails and camera are **CODE-side runtime FX**, not textures of a single static background scene.

## 4. Contract: coordinate, bounds, naming

- Right-handed 3D world, `+Y` up, scene floor/water surface `Y=0` (proposed). Use `1 unit = 1 meter` for consistent scale; refine through visual calibration with videos.
- Preferred actor: local `+Z` forward; local origin at the contact center between seated body and lotus leaf. Pad: origin center, positive `+Y` top. Document if source differs instead of applying arbitrary per-object rotations in Codex.
- Export object transforms applied, no unintended negative scales or giant invisible mesh bounds. Distinguishable PBR materials with no hidden external dependencies.
- Avatar mesh must have named anchor(s): `SeatRoot`, `HeadAnchor`, `NameplateAnchor`, `FXAnchor`; if named nodes are not exported, manifest MUST give local-space 3D offsets. Every animator must follow identical clip names e.g. `sit_idle`, optional `look_up`, `react_gift` and documented durations.
- `asset_manifest.json` per version contains `assetId`, `revision`, `path`, `sourceBlend`, `license/provenance`, `boundsMeters`, `pivot`, `forwardAxis`, `scale`, `triangleCount`, `meshCount`, `materialCount`, `texturesAndResolutions`, `animations`, `lods`, `screenshotRefs`. No requirement for proprietary rig name.
- Texture sizes and mesh budgets must be defined by measured use. Suggested initial trial, **not a hard cap**: ECO 512–1024px shared textures, QUALITY selected 1024–2048px; target instanced pads rather than unique individual GLBs.

## 5. Acceptance for AI 3D review

SA rejects an asset handoff when: only PNG/JPEG is provided but described as 3D; GLB can't load; model scale or pose breaks; tree is single flat crossed billboard; top aerial view has no blossom detail; gift camera close sees broken topology; materials are missing; textures are unlawfully scraped; the `asset_manifest.json` is missing; or significant memory/performance risk is undocumented.

The 6 golden shot comparisons need the *same reusable assets* rendered from multiple real camera positions (not six separately generated pictures). AI 3D may produce conceptual frames first but they are explicitly labeled `concept only` until 3D renders match.

## 6. Asset repository boundary

- Keep AI 3D source/work-in-progress in a distinct `Assets3D/Source` or out-of-repo asset workspace (owner chooses); approved runtime-ready GLB/texture under `Assets3D/Runtime` once implementation starts. Proposed structure is **not** a mandate to create code folders during design stage.
- Large binary files: use Git LFS or a versioned release/storage pipeline if practical; never add huge generated mesh files through GitHub text contents API. Persist immutable manifest/revisions and provenance.
- SA reviews asset revision and then communicates **exact manifest version and paths** to Codex. Codex cannot silently replace or modify art assets; mismatches trigger an integration comment or AI 3D revision.

## 7. Starter handoff to the independent ChatGPT AI 3D

Read this document and Design/01, /03, /04, /10 and owner video. Your job is ONLY production 3D art for the pond/giant cherry blossom tree/meditator/lily pads, not app code. First propose a 3D-asset plan, output proper mesh files `.glb` or Blender project `.blend` when genuinely available, run asset validation, include asset_manifest.json, renders from multiple camera angles, polygon/texture estimates, licensing, and report blockers. Send results to SA for review. Do not claim an illustration is game-ready geometry.

## 8. What the connected fal tool does and does not settle

Owner has connected fal in ChatGPT. AI 3D can investigate its available generation modalities and, **if a specific model produces a downloadable editable 3D mesh**, use it for prototype models. Availability/model/pricing/output format must be verified on the connected tool before choosing. The app connection by itself does not establish that a rigged low-poly GLB production model can be generated or that it satisfies our rig/LOD requirements.
