# R18 — focused repair following actual Phase 1 audit

AI Visual17 / Design32 / Rules07/14. Same draft PR #27, exact baseline PR18 `07f57cb35ba3ec68184abbd2c173e29a3fcc4788`; PR26 read-only aecc8e5399cb869fe3de95d5a7b3f15972397216. Owner supplied native audit JSON, two logs, ZIP and red-circled screenshot. [Pre-SA evidence receipt](PRE_SA_AUDIT_REVIEW.json) pins uploaded bytes and review findings. **Audit PASS; corrected Build/preview pending native run; Final HOLD.** No repeat of baseline audit or six original diagnostic renders. Original chuav2.mp4 still unavailable, no reference-video fidelity claim.

## Finding → repair
| Finding | Correction |
|---|---|
| QUALITY 5/5 and ECO 10/10 draped stems without rooted BVH contact; gaps 2.736–4.951 / 1.296–6.011 m | Relocate whole source-verified stem+flower groups to nearby real rooted branch surfaces; no long artificial connecting rods. Choose distinct anchors and >=1.8m center spacing. |
| 40 QUALITY /60 ECO flowers; prior nearest-surface grouping mixed 9/8/8/8/7 QUALITY | Center-to-low-end envelope regrouped offline from actual audit: 8/6 per stem, 4+4/3+3 pink/blush. Native code asserts exact source counts, bounds and attribution. |
| 13 QUALITY /2 ECO isolated 40-triangle wood relief candidates | R16 bark_knots() signature 5 rings x4 sides with centered caps yields 40 triangles, total 31/12. Validate source count and preserve relief, exclude from structural graph; if other unrooted structural components remain, stop. |
| ECO old per-flower supports 36 triangles each | 3-sided/2-ring capped indexed support, 8 triangles ECO; 4-sided/2-ring, 12 QUALITY; only if direct contact absent. Max 600 additional tris each, unchanged 250k/60k caps and +5% byte guard. |
| QUALITY side image nearly black (mean RGB ~0.08) | Preserve old evidence, new exterior matched side camera framing both moved and original groups; inspect actual new images. |

No changes to original R17B files. R18 copy patches only POSITION records for selected moved components and updates matching accessor min/max; preserves all other original binary bytes, indices, normals and node/mesh structure; alias/coverage guard and actual Blender reimport contact verification required. Original gold material name retained; restrained emission and tiny gold accents follow short supports; existing planned material tuning retained. No global exposure or runtime change. Reimport must show relocated components and actual contact at both ends; not a manifold weld or complete art PASS. Source-only correction; native Blender unavailable here, no claimed Python/native compile or GLB output.

## Run next in existing r18-polish worktree

```powershell
git status --short
git pull --ff-only origin assets/sakura-hero-r18-polish
& .\run_r18.ps1 -Phase Build
```

Keep the existing exact `attachment_audit.json` (SHA pinned above) and `R18_Attachment_Audit/` untouched. Build opens approved editable, verifies focused component identities and group assignment, relocates selected components, builds both real GLBs and reimports, validates budget and BVH proxy. If a guard fails, **STOP**, send `attachment_diagnostics.json` and `R18_build_stdout.log` / `R18_build_stderr.log`; do not widen limits or run final.

Only after actual Build PASS:

```powershell
& .\run_r18.ps1 -Phase Preview
```

6 new native 720x1280/32-sample frames (2 R18 under-tree +4 matched side) and 2 SHA-pinned historical R17B under-tree frames, 8 ledger rows. Inspect all images and report rounded/clipping/occlusion, group shape, gold warmth and bark detail; frame projection is not art acceptance. **Final is disabled in PowerShell and Python CLI**, awaiting explicit SA preview decision; Audit is frozen. No new .blend or full final evidence in this step. Send/upload existing audit and new GLBs, reports, logs and preview folder on this same branch. See BINARY_HANDOFF. No paid tools. **STOP P10B8_ART_SA_REVIEW_REQUIRED.** No runtime, merge, Codex, B9/C0.
