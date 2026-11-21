# P0-02 Phase A — actual owner reference and controlled A/B art review

## Video inspection and boundaries

Directly reviewed owner-provided `chuav2.mp4` 720×1556 at ~3,9,42s. At 3s, the pad under a seated dark-haired figure has a broad organic rounded notch, darker near-black green lip against dark navy water and a low side silhouette. At 9s, many little pads/avatars recede into mist under warm peach/purple sky; center actors are small due perspective. At 42s, a large face/robe and crossed legs appear in a low community shot with warm pink/peach atmosphere and lit water reflections. TikTok UI and live/user labels in those frames are not intrinsic 3D geometry. This is a qualitative reference, not exact camera calibration or branded avatar duplication.

## p0.1 vs p0.2 selected differences

- Pad top: 15 almost straight equal spokes in p0.1; p0.2 uses 9 curved primary veins and 7 short, lighter secondary veins. p0.2 more subdued: close-up leaf read improves but high aerial visibility may decrease.
- Pad waterline/side: thick disc profile p0.1 becomes a thin tapered-edge, irregular outward curled upper surface. One failed trial revealed an exposed separate jade underside disc; the candidate was corrected before delivery and the inner cushion shrunk to fit inside the shell.
- Chibi 3/4/side/back: p0.1 smooth hemisphere hair cap and isolated bun; p0.2 has smaller swept bang strands and connected bun root. Serene face and sitting pose unchanged. Hair still deliberately stylized and may need owner feedback in close view.
- Lighting: p0.1 and p0.2 PBR re-rendered with the **SAME** warmer sunset 3 lights+IBL for fair comparison; no falsely favorable case-specific rig. Standalone mock water is review only, not a shipping GLB.
- Frame: vertical medium has more readable seated character and pad, vertical close intentionally crops pad for face/robe. Fixed shared camera/no per-version autozoom. Neither duplicates phone screenshots or TikTok overlays.

## Technical gates

GLB 2.0 loader PASS, skin is unchanged, actor hierarchical idle 2s/17 keyframes, 4+1 contract anchors, zero missing textures, lower-body vertices sampled from actual imported GLB against actual leaf triangle height, min contact gap 14.818 mm, 0 penetration >5 mm. Note this is vertex-only, not collision physics. No production LOD/instancing benchmark or native Three.js verification.

## Next decision

Only owner can select visual outcome: **OK p0.2**, **KEEP p0.1**, or **REVISE** with view-specific targets. Do NOT start Codex/integration or merge PR #2 until an explicit OK. New Blender Cycles A/B evidence still pending owner run; VTK PBR images are not Cycles. Current state **ART_OWNER_PENDING**.
