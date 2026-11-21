> **Verified update, 2026-11-21 (supersedes pre-owner-run checkpoints):** Blender 4.5.16 LTS Cycles CPU R12 completed: four cases, 20 PNGs, 34/34 ZIP hashes, original two .blend structures and SHA independently SA reviewed. **Technical Blender PASS; visual ART PARTIAL; production NOT APPROVED.** R12 original binary GitHub upload still `pending_owner_upload`. See [R12_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md](R12_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md). Native Three.js and GPU/LIVE Studio NOT RUN.\n\n# Sakura Hero R12 — SA review response

**SA source review:** [R11 final Cycles evidence review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004001670). R11 owner Cycles 9/9 A/B and 22/22 PNG independently reviewed; two original .blend SHA valid.

## Evidence-based selection
- Under **actual R11 Cycles**, the original `r10_palette_only.glb` has rose color very close to `r11_final`, but R11 has conspicuous paper-sheet floral tiles and 49.13% larger GLB from petal NORMAL. Therefore R12 keeps the R11 baseColor/emissive improvement and omits all explicit petal NORMAL attributes.
- R12 QUALITY uses 4 triangles per cupped petal, less repetitive width/lean, layered bloom centers, reduced dangling flowers. No density increase. QUALITY **182,674 triangles, 226,267 vertices, 4,916,248 bytes**, reductions **3.235% triangles and 35.312% bytes vs R11**. ECO exactly unchanged SHA.
- Ancient trunk is materially sculpted with a more swept offset centerline, wider base and real radial bark flutes, changed branch tangent and root geometry, plus the same gold inset geometry (not emissive wires). Separate mesh intersections still exist; not a watertight Boolean union.

## Visual proof and limitation
- **Executed:** VTK importer, genuine R10 palette-only / R11 / R12 GLB models, synthetic dusk gradient IBL with three lights, exact same perspective positions/FOV 50 top / 44 under and 3/4 / 56 trunk, no Phong override. Match sheets in owner review ZIP.
- **Executed previously:** owner and SA R11 Blender Cycles A/B `r10_palette_only` vs `r11_final` under AgX, 0 EV, World 0.65 and three Sun lights; these old Cycles images are included as a clearly labeled reference, **not new R12 Cycles proof**.
- **Not executed:** R12 Blender Cycles (owner Windows package supplied), native Three.js GLTFLoader, GPU FPS and VRAM with LIVE Studio.
- Visual judgement from VTK: R12 retains warmer rose palette; smaller nonuniform petals are less plate-like than R11 and trunk differs visibly, but low-poly facets and some gaps remain. **ART PARTIAL.** Camera is approximate to owner video 15s/33s; no scene fog, particle match or calibrated HDR. No production acceptance / merge.

All payment-cost services 0 VND. Original R10 and R11 GLBs/OBJ untouched.
