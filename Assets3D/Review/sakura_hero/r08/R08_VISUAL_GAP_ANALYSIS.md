# Sakura Hero R08 — SA R07 review response and remaining visual gaps

Source: SA Review R07 @ `fc9b69d666175231355e2e17ebacf75d0eae0e00`, PR #1, 2026-11-20, plus inline comments. The SA decision is geometry prototype ACCEPTED, production visual/renderer review **NOT APPROVED**.

| SA item | R08 action | Evidence / honest status |
|---|---|---|
| ECO small center-left aerial void | Two **small world-space** R08 bridge clusters at `(-4.25,19.35,1.30)` and `(-2.55,19.48,-0.18)`, not global density increase; preserved R07 ECO 0.57× lobe-core recess | `r07_r08_eco_top_pbr.jpg`. In fixed pixel ROI `[134:197]×[203:275]`, very-dark pixels fell **578 → 42** using documented RGB heuristic: **improved at this FOV**, not mathematical proof every view is gap-free. |
| QUALITY round scalloped lobes / visible triangular petals | Non-circular canopy perimeter deformation, anisotropic petal lobe axes, varied tier heights, reduced peaked petal silhouette and excess center fold; adjusted inner core 0.69 → 0.585 | `r07_r08_quality_top_pbr.jpg`; still visible low-poly petal details and some scalloped outer contours: **PARTIAL** |
| Trunk bark/root/gold wires | Stronger S-axis leader, irregular braided root taper, low-cost circumferential bark ridges, shorter/thinner golden fissures embedded near trunk/ridges instead of floating | `r07_r08_trunk_33s_pbr.jpg`; dark bark sculpt still stylized and has hard facets: **PARTIAL** |
| PBR truth | Re-imported both exported GLBs with native VTK PBR props, unchanged R07 IBL + 3 lights/cameras, no Phong override | `render_pbr_truth.py` and new R08 photos: **CONDITIONAL VTK PASS**, Blender/Three.js OPEN |
| Geometry budgets | QUALITY **159,009** triangles vs R07 **158,701** (+0.194%); ECO **43,794** vs **43,014** (+1.813%); single sheet + glTF doubleSided preserved | `R08_VALIDATION.json`; no FPS claim or VRAM prediction |
| Delivery | R08-only source, manifest, review and SHA handoff committed to same branch; original binary SHA and bytes recorded | `BINARY_HANDOFF.md`; GLB/OBJ/preview still `pending_owner_upload` |

## Reference integrity
- 15s/33s comparisons use actual owner video frame crops for evaluation, no screenshot texture baked into tree geometry. Video has TikTok UI overlays; those are not art assets.
- Video-to-render pairing has approximate FOV, NOT camera-matched calibration, fog, particles or scene props. R07 vs R08 comparisons DO share the exact camera/lighting via inherited VTK script.

## Still-open SA blockers
1. Close-up flowers still look low-poly; no physically simulated petal subsurface scattering, no texture-driven microdetail.
2. Trunk still resembles procedural polygon mesh instead of sculpted photorealistic ancient bark; gold highlights significantly less cable-like but surface needs richer real bark relief.
3. Local ECO dark void largely patched at one aerial pose, not guaranteed gone from all future camera positions.
4. Only VTK + IBL PBR checked, no independent free Blender/Three.js parity; owner device FPS and LIVE Studio memory remain unmeasured.
5. No `.blend`; original GLB and screenshot binaries not on PR branch until owner uploads and SHA is independently checked.
