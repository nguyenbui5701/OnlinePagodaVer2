# P0-01 review: visual decisions and gaps

Grounding: Design/01 actual observed timeline describes at ~3s large headed chibi with dark hair and light shirt sitting cross-legged on green leaves with white name text overhead; ~9s higher camera with visible pad rows, ~42s close community. Direct owner video bytes unavailable to this session, so do not assert pixel-level similarity or nameplate fonts.

**Original pad:** broad deep-green asymmetrically notched round-ish 3D leaf, center stem, 15 directional veins, curved upper surface with 3D thickness; readable from aerial and at grazing water angle. Screen-space notch visible in `pad_top.png`, darker underside + stem in `pad_side.png`.

**Original chibi:** round skin-toned head/closed eyes, small happy mouth, offwhite robe with lilac fold, dark short asymmetrical cap + single side bun and gold clasp, cross-leg seated pose with hands on knees. `chibi_front/side/back/three_quarter.png` real PBR GLB proof. Not a copyrighted Roblox/other game character extraction.

**Actor + seat contact:** padSeatY=0.195m in pad-local glTF; actor seat origin=0; actor min body vertex 0.009m above local origin. Vertex clearance test against leaf top 14.77mm min; 0 vertices >5mm below pad. Check foot/robe contact close in actual Blender Cycles. FX/nameplate/head anchor debug overlay is a reviewer-only gizmo, not baked text into model.

**Animation:** `sit_idle` 2.0 s gently moves UpperBodyBreath up to 16mm. Its GLB native animation is read by vtkGLTFImporter and rendered at 0/.5/1/1.5/2s, 17 authored keyframes. `sit_idle_native_gltf.gif` is a loop of true rendered frames. This is a simple hierarchical (not full bone skinned) animation; posture/individual arm gesturing not present yet.

**Known gaps:** actual Blender .blend/Cycles execution pending, original video shots not directly opened, no near/far avatar variants, no react_gift clip, no Three.js playback verified, no native GPU/LIVE Studio benchmark, dynamic font nameplate is Codex-owned (only anchor position is delivered). Leaf large in paired close crop by design; no in-scene instancing/scaling validated.

**Acceptance request:** SA verify true 3D geometry, stable anchors, 2s loop, multi-camera visual likeness to user clip, reject/require iteration if leaf silhouette or crossed-leg pose are not close enough.
