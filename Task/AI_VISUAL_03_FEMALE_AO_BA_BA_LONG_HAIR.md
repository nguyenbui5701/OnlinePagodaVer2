# AI VISUAL 03 — P0.4 Female Chibi: Vietnamese Áo Bà Ba, Multi-Color Variants & Long Loose Hair

> **P0.5 successor task — 2026-11-22:** This P0.4 assignment is now the **historical baseline**: owner accepts its overall áo bà ba/long-hair female appearance, but **does not grant final female pose acceptance**. Follow [AI_VISUAL_04](AI_VISUAL_04_FEMALE_PRAYER_POSES.md) for improved cross-legged knees and praying hands plus a new kneeling prayer pose. Preserve P0.4 source and six colors. No male, Codex or merge.


**Issued by:** SA · **Owner decision:** 2026-11-21 · **Status:** ASSIGNED — FEMALE VISUAL ONLY / OWNER GATE OPEN.

**REQUIRED PROCESS:** Follow [Design/07 — Rules](../Design/07_WORK_RULES.md) and the exact evidence-driven **Sakura task style** in [Design/15](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md). This is an independent, executable GitHub task, not a concept-art suggestion. Sequence: **SA task → AI Visual actual source + GLB + Cycles → SA review on PR → owner views images and explicitly approves → only then next stage**.

## 1. Role, scope, objective & STOP

You are **AI Visual / 3D artist**, responsible for **real, editable, zero-cost 3D production**. The owner accepts the overall P0.3 lotus pad + seated chibi direction, but requests a focused female character refinement:

**P0 requirements (must all read convincingly in actual 3D):**
- Replace the current generic chibi outfit with a recognizable **Vietnamese áo bà ba** worn by a seated female chibi.
- Enable **multiple tasteful áo bà ba colors** for future many-viewer avatars with one master female model and re-usable material slots/variants.
- Make the female character's hair **long, loose and flowing down the back to approximately the lower back/waist**, as far as visually and technically feasible without clipping or excessive geometry.
- Keep the gentle seated meditating chibi style, facial expression, proportions, crossed legs, hands, pad contact and existing idle animation.

**STOP/GATE:** Only female work now. **DO NOT build a male model or generate male-specific variants**; this requires a separate task **after owner explicitly says "OK female"**. **Codex PR #3/#4, runtime integration, benchmark and all merges remain PAUSED**, even if Blender tests pass. Do not change Sakura R16, lotus pad geometry, V1 or video/camera/event code.

## 2. GitHub / exact frozen baseline (verify HEAD again before editing)

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Existing AI Visual PR #2:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- **Head branch:** `assets/lotus-pad-chibi-p0`
- **SA-discovered HEAD when issuing this task:** `dff58dde2d71467cb17916f6b4016e71b2ef4158`. This is a **source snapshot, NOT a claim that SA already audited every P0.3 Cycles PNG/Blend hash**. If HEAD moved, report old/new before modifying files; never reset or force-push the owner's work.
- **P0.3 baseline location (actual folder on PR):** `Assets3D/Review/lotus_pad_chibi/p3/` (do not blindly use the manifest's legacy `p0.3/` description).
- **Baseline actor:** `p3/meditator_base.glb`, **212,040 bytes**, SHA-256 `646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0`, **8,724 triangles / 11 meshes** (as reported in the P0.3 manifest/Cycles reports).
- **Baseline leaf:** `p3/lotus_pad_01.glb` is a P0.2 byte-identical reuse, **262,108 bytes**, SHA-256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`, **10,648 triangles**. **Do not re-export or alter leaf** in P0.4. Carry it forward by stable reference/hash rather than duplicate binaries unless a standalone review bundle requires a copy.
- Actual P0.3 Cycles evidence is present under `p3/P03_Cycles_Evidence/` (notably `p03_actor` and `p03_pair` JSON/PNGs/Blend). Reports label Blender 4.5.16 LTS, Cycles CPU, 32 samples, AgX, 0 EV, World 0.65. **Validate the original bytes and audit stale `P03_BLENDER_CYCLES: NOT_RUN` before updating claims; don't call it SA-PASS from report text alone.**
- Latest previous SA visual review: https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6005994936 (P0.2; P0.3 is a subsequent revision).

**New work output:** `Assets3D/Review/lotus_pad_chibi/p4/` (P0.4), with its own README, source scripts, `meditator_base.glb`, source Blender, manifest, validation and evidence. Never overwrite p0.1/p2/p3 artifacts or their hashes. Keep branch and PR #2 unless SA approves a scope change.

## 3. Required reading and evidence precedence

Read in this order:
1. [Design/07](../Design/07_WORK_RULES.md), [Design/15 Sakura format](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md).
2. [Design/03 Visual World](../Design/03_VISUAL_WORLD.md), [Design/11 Asset Pipeline](../Design/11_3D_ASSET_PRODUCTION_PIPELINE.md), [Design/13 Integration Contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/14 Zero Cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 current owner gate](../Design/16_P0_APPROVAL_AND_HANDOFF.md).
3. [Task/AI_VISUAL_01](AI_VISUAL_01_LOTUS_PAD_CHIBI.md), [Task/AI_VISUAL_02](AI_VISUAL_02_ART_REFINEMENT_AND_OWNER_GATE.md), latest PR #2 SA comments.
4. PR #2 `p3/asset_manifest.json`, `p3/P03_CAMERA_AUDIT.json`, `p3/P03_Cycles_Evidence/`, current P0.3 real GLB/Blender source. Review `chuav2.mp4` only if the true owner-supplied clip is accessible; don't invent exact visual features when unavailable.
5. For authentic garment details, use owner-approved reference or reputable freely available áo bà ba clothing references; record provenance/license. Do not copy a specific person's face or an unlicensed 3D model.

Evidence ranking: **original GLB / Blender project / actual Cycles PNG + logs > generator report / manifest statements > concept imagery**. Make unknowns explicit.

## 4. SA findings and owner-requested art direction

**PASS / PRESERVE:** P0.2 lotus leaf appearance as carried into P0.3; established character meditating pose and calm face; proposed scale and seat/head/nameplate/FX anchors; existing `sit_idle`; current PR's zero-cost source structure. **OWNER ACCEPTS OVERALL DIRECTION**, not yet this new female clothing/hair.

**P0 — Vietnamese áo bà ba silhouette and recognizability:** Traditionally inspired **collarless round/open neck**, clear **center-front button/placket closure**, relaxed long-sleeved or appropriate chibi-simplified sleeve fit, **slight side slits and hip-length top**, paired with simple loose-fitting trousers (not a robe, áo dài, high Mandarin collar or generic tunic). Respect seated cross-legged form so front placket and two side panels remain readable, especially front/3⁄4 and 9:16. Simplicity first; use minimal geometry/seams, avoid tiny busy patterns.

**P0 — female back-length hair:** Build a coherent part/fringe and continuous hair mass with **two or more soft tapered flowing sections over the back**, ending around the waist/lower back if possible. Back, profile and 3⁄4 must unmistakably read as **loose long hair**, not a bun, rigid helmet, narrow ribbon, pointed flat planes or cloak. Keep face/hands/nameplate visible and prevent hair from passing through shoulder, torso, elbows, leaf, and legs at `sit_idle` frames. Hair may be stylized and lightly layered; **do not promise physical hair simulation**. If waist length collides in seated pose, document the longest safe result and show the back and idle trade-off to SA/owner rather than silently shortening it.

**P1 — efficient garment color variation:** One female geometry baseline. Provide **at least six visually distinct, harmonious solid-color palettes** (suggestion: pastel lilac, blush rose, sage green, sky blue, warm beige/cream, muted terracotta/brown). These are proposed choices **for owner approval**, not final production colors. Declare material slot(s) for `ao_ba_ba_top`, `ao_ba_ba_pants`, optionally trim/buttons; expose color values as manifest palette entries (sRGB hex and PBR baseColorFactor conventions). **Prefer material reuse/variant metadata**, no six separate duplicate geometry sets. If using `KHR_materials_variants`, test actual glTF import support; otherwise document a renderer-agnostic slot/palette contract without implementing runtime. Avoid modifying shared material globally per user in future multi-avatar scene.

**P1 — low footprint for a crowd:** Avoid wasteful tessellation. Include measured per-asset and per-material costs and a proposed LOD strategy for 10/30/100 seated avatars; do not fabricate RTX/VRAM/FPS numbers.

## 5. Required execution phases

### Phase 1 — Verify P0.3 and plan a surgical change

- Pull exact PR #2 HEAD; inspect current P0.3 `meditator_base.glb`, actual Blender source, glTF material hierarchy, `UpperBodyBreath`, `sit_idle`, named nodes and pad contact. Report measured bounds and all existing source SHA.
- Produce an **SA finding → planned action → expected evidence** table for clothing, long hair, animations/anchors, colors and costs. Mark preserve/change per mesh and note any p3 report-vs-actual inconsistency.
- Do not change the pad and do not rerun already verified P0.3 evidence if the baseline files remain unchanged.

### Phase 2 — Build P0.4 female A/B

- Create one full **female áo bà ba + waist-length loose-hair** P0.4 candidate with source-editable modular garment and hair parts. Keep old P0.3 as an immutable A/B control.
- Build six material palette choices with one base body/mesh and render swatches; outfit color must be independent of hair/skin and not require new topology per color.
- Keep original face/pose/idle anchors unless a measured technical reason forces adjustment. If an anchor or bone hierarchy changes, document old/new world and local transforms and an explicit compatibility/migration note; don't silently break Design/13.
- Check cross-legged seated garment folds, sleeves, hand visibility, back hair/shoulder join and idle collision throughout 2 s at sample t=0, 0.5, 1.0, 1.5, 2.0; ensure no pad/leg/hair mesh intersections are visible at close view.

### Phase 3 — Independent real-3D tests and matched Blender Cycles evidence

Use **actual exported GLB**, not merely rendered Blender construction meshes; re-import the exported files into Blender and compare **P0.3 vs P0.4 with identical camera, light, FOV, AgX 0EV and sampling**:

- Actor **front, side, three-quarter, back**; focused **front-placket detail**, **back hair close-up**, and silhouette on a neutral background.
- Seated pair **front, side/three-quarter, medium 9:16, close 9:16** showing entire outfit, hair and recognizable lotus context. Avoid claiming "full leaf" for intentionally clipped portrait shots.
- **Six-color side-by-side swatch contact sheet** with same actor mesh/lighting and labels; record whether the variants were rendered by switching material factors or exporting separate preview sources.
- **5 idle phases** from both front/three-quarter and back/side if hair deformation or intersection risk requires it; inspect frame-to-frame discontinuity and self-intersection.
- **Machine-readable report**: glTF2 import, bytes/SHA256 for GLB and BLEND, triangles/vertices/meshes/materials/texture count, true asset bounds, animation clip name/duration/keyframes, anchor transforms, seat contact/collision, provenance and performance-cost delta vs exact P0.3 baseline. Provide stdout/stderr and a SHA list; Blender/Cycles is PASS only after the actual owner/local run succeeds.
- Acceptance focus: Vietnamese áo bà ba visual authenticity, flowing-long-hair back silhouette, safe seated animation, 9:16 readability and efficient palette system. **No fake performance benchmarks**.

### Phase 4 — Versioned GitHub handoff and STOP

- Push small source Python/Blender scripts, `README.md`, `asset_manifest.json`, `P04_VALIDATION.json`, `COLOR_VARIANTS.md`, `LICENSE_AND_PROVENANCE.md`, `BINARY_HANDOFF.md`, evidence audit and relevant preview/contact sheets to **PR #2 feature branch**, with a new commit. Do NOT commit task or source changes to `main` from the AI Visual session.
- Big **GLB/BLEND/PNG/ZIP** can be uploaded by owner later; list exact expected relative paths, original byte counts, SHA-256, and `pending_owner_upload` status until verified on remote branch. Preserve actual provenance; a file on the owner's machine is not automatically on GitHub. Once owner pushes, recheck hashes rather than trusting filenames.
- Document only true outcomes: `P04_CYCLES_OWNER_RUN_PASS` after evidence exists; otherwise `P04_CYCLES_PENDING_OWNER_RUN`. `P04_FEMALE_ART_OWNER_PENDING` **until owner views and explicitly approves**, even if mesh and Cycles PASS.
- Post exact new HEAD, PR #2 URL, summary of changed/unchanged files, cost deltas, A/B original Cycles images, color sheet, what owner must upload and open risks. **STOP here**. No male build, Codex, integration, PR merge or LIVE work.

## 6. Acceptance gate / completion checklist

- [ ] Female avatar wearing recognizable Vietnamese **áo bà ba**: collarless/center front/placket/side silhouette/loose trousers, not áo dài.
- [ ] Hair **long and loose to the waist/back** and reads from profile/back, without floating plate or stiff cap; evidence at idle t=0 and t=2.
- [ ] 6 garment color previews from **one reusable female geometry** with validated material slots, no duplicate mesh per shade; skin/hair colors unaffected.
- [ ] Facial expression, crossed legs/hands, leaf seat, scale, anchors and 2 s `sit_idle` survive unchanged or with documented validated migration.
- [ ] Real GLB, editable Blender source, SHA-256+bytes+triangles+material count, matched P0.3/P0.4 Cycles, 9:16 and collision check available to SA.
- [ ] All outputs are zero-cost and published or truthfully pending upload to PR #2. No misleading `PASS` claims for unexecuted Blender/Three.js/GPU.
- [ ] SA posts review on PR #2; **owner personally says "OK female"** before a **NEW SEPARATE male task** can be created. Male similarity (áo bà ba variant, pose/scale, face/hair variation) is a *future specification*, not in the scope of P0.4.
- [ ] Codex PR #3 and PR #4, Event Engine, renderer integration and PR merges remain **ON HOLD** until a separate owner instruction.

## 7. Required return format (Sakura-style)

1. `SA finding → change → objective evidence` table, with P0/P1 statuses.
2. Exact tools used, license/provenance, **total external paid cost = 0 VND**.
3. Versioned source path(s), actual file names, SHA-256/bytes/triangles/materials, color-variant implementation and exact actor/pad anchor status.
4. Before/after **real Blender Cycles** front/side/back/close/medium 9:16 A/B contact sheets and six-color sheet.
5. Exact PR URL, feature branch, **new HEAD**, all commits and file-upload statuses; Windows PowerShell commands for any owner-run export/Cycles/hash validation.
6. Explicit issues or blocked claims and **`P04_FEMALE_OWNER_VISUAL_REVIEW_REQUIRED`**. Ask owner only for **female visual acceptance**; **do not start male character until owner gives that approval**.

**SA stop:** Appearance decision for female first; technical review by SA, explicit acceptance by owner, male is next separate stage, Codex remains paused.
