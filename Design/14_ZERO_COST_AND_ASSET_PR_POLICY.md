# 14 — ZERO-COST 3D PRODUCTION & PR HANDOFF POLICY

**Owner confirmed 2026-11-20:** V2 3D art and initial development must use **zero-cost tools and assets** until owner explicitly approves a paid service. **No auto-paid model generations, no subscription, no paid marketplace assets.** This policy is normative for AI 3D and SA review and supplements Design/11, /12, /13.

## 1. Allowed default toolchain (0 VND software/license cost)

- **Blender**: canonical authoring/editable source; modify topology, materials, normals, UV, animation, LOD, export GLB.
- **Blender Python**: permitted for the independent AI 3D to author real procedural 3D meshes. This is **asset production**, distinct from runtime code assigned to Codex.
- **Blockbench**: optional low-poly modeling for simplified characters/props; validate GLB conversion in Blender.
- **Quaternius, Kenney, Poly Haven**: optional reference, textures, and assets **only when the specific downloaded item and actual license allow commercial livestream use**. Verify and record the provenance/license; do not assume every item on any site is the same license.
- **Mixamo**: optional rig/animation only after verifying account/service terms applicable to the intended use and confirming chibi deformation quality.
- **Local Python/trimesh** is an acceptable procedural production fallback when Blender is unavailable, but it is **not a waiver of actual Blender/Three.js import and look-development checks before final asset approval**.
- **No paid fal/Meshy/Tripo calls by default**. A service having trial/credits does NOT prove that GLB export and commercial rights are free. If a service is proposed, name the exact model, output format, terms, price and account impact; obtain explicit owner approval before any paid operation.

A concept PNG is concept art, **never claim it is a usable 3D mesh**. Do not scrape/reuse copyrighted game geometry, branded Roblox avatars or TikTok app visuals from the reference footage.

## 2. Source of truth and asset fidelity

Owner video `chuav2.mp4` is source-of-truth for scene resemblance. For sakura tree, must verify BOTH (a) **aerial warm pink canopy** around 15s and (b) **dark thick trunk / golden glints / misty under-canopy** around 33s. Reference frames are screenshots of a streaming app; don't bake TikTok phone UI into assets.

Video-fidelity review must use renders of **the same GLB** from several real camera poses, not separately AI-generated pictures. Compare geometry silhouette, luminosity/petal color, trunk/root/branch shape, performance-related density and near-camera appearance. Source trees need actual 3D geometry (or documented separate LOD), not just a flat background.

## 3. AI Visual / Codex / SA division

- **AI 3D**: creates real models, procedural Blender source, material/mesh/animation data, manifest, optimization, preview images and asset provenance. AI 3D must not implement TikTok server or Event Engine.
- **Codex**: exclusively runtime/application code, renderer, shader water/fog, particles, camera and Event Engine; can use minimal temporary primitives to test APIs, not generate production art.
- **SA**: reviews AI 3D geometry and PR, protects cross-team contract, checks owner video fidelity, leaves blocker/acceptance comments. No Codex production GLB integration until SA explicitly accepts a named binary checksum/revision.

## 4. Required GitHub workflow for AI 3D

**Each independently reviewable asset iteration gets its own topic branch and PR**, e.g. `assets/sakura-hero-r05`. For PR #1 R04, revisions addressing SA comments may be committed to the existing head branch instead of making a duplicate PR. Do not write directly to `main`.

**Push small textual files before opening PR**, using linked GitHub connector or `git` where accessible:
- `Assets3D/Review/<asset>/<revision>/README.md` with purpose, known limits and validation checklist;
- `PHASE_A_VISUAL_ANALYSIS.md` or asset-specific visual comparison notes;
- `asset_manifest.json` including SHA-256 for each binary, exact relative path, file bytes, dimensions, triangle/material/texture stats, pending-upload status, license/provenance, rendering & benchmark truth;
- repeatable `procedural_*.py` or Blender Python source where needed and editable source files only when small/practical;
- `MEDIA_PENDING.md` or `BINARY_HANDOFF.md` enumerating assets that OWNER will upload later, exact canonical filenames and checksum checks;
- compressed preview/thumbnail images if small and license-safe; optional if GitHub connector cannot upload media.

**Missing large/binary assets must NOT block creating the initial PR**, provided the manifest unambiguously marks them `pending_owner_upload`; but such a PR is **documentation/recipe review only**, not acceptance of runtime models. DO NOT check an absent file as delivered.

## 5. Owner uploads large binaries later

Large GLB, BLEND, OBJ, texture atlases, reference video, full-resolution PNG/video are uploaded by owner into **the same asset branch and exact manifest paths**, not into `main` accidentally. Owner may use local git or Git LFS (depending on file size and repo policy). A SHA-256 verified binary is stronger than just a matching filename. After upload:
- AI 3D updates manifest statuses `uploaded` only after verifying GitHub branch contains the file(s).
- SA fetches/imports exact revision or checksums, compares video and returns formal art decision.
- Codex only uses the asset after SA approval. A text-only PR or non-matching checksum is **not production ready**.

For GitHub assets larger than 100 MB (or many iterations of large binaries), prefer Git LFS/external versioned release storage with a lightweight manifest in Git. Do not store paid/proprietary third-party content without authorization. Do not push unlicensed media, session tokens or TikTok user data.

## 6. PR title/body and SA review contract

PR title example: `[AI Visual][SA REVIEW] Sakura Hero R05 — zero-cost geometry + manifest`.

Required body fields:
1. Video reference checkpoints and what changed since previous iteration.
2. Tools used and **explicit zero-cost declaration**.
3. List of actual files on GitHub vs pending user-upload files, with checksums.
4. Repeatable build and local import/render instructions.
5. Technical stats, GLB format, scale, origin, materials, petals double-sided, known visual gaps.
6. Target GPUs: 3050 Ti 4GB ECO and 3060 8GB QUALITY; no unmeasured FPS claims.
7. Requested SA decision (prototype review vs final acceptance).

AI 3D checks PR comments/threads, responds to every blocker, commits fixes to same topic branch, and notifies owner/SA. SA posts formal `COMMENT` or `REQUEST_CHANGES` review. Do not self-approve/merge production asset PR by merely completing the textual package.

## 7. Acceptance levels

- **LEVEL 0 / Concept:** idea, images, prompts — no mesh verification.
- **LEVEL 1 / Geometry prototype:** GLB exists locally and is structurally importable, basic material and scale metadata present.
- **LEVEL 2 / Reviewable PR:** source code + manifest + comparison evidence pushed, actual binaries available to SA or owner; visual and technical gaps documented.
- **LEVEL 3 / Approved runtime asset:** approved GLB branch/revision/checksum, Blender/Three.js verification, satisfactory video-fidelity, owner hardware profiling or planned renderer acceptance for final integration.

PR #1 Sakura R04 may qualify for Level 1/2 after independent verification of owner-provided GLBs, but it cannot be treated as Level 3 until blockers are resolved.
