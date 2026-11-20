# 03 — World, art direction, assets (AI Visual)

**Aesthetic:** soft Roblox-adjacent stylized 3D with original meshes/textures, dreamy pink-purple dusk, dark reflective lotus lake, pink cherry blossom canopy. Video > generic concept art.

## 3D coordinate / layout proposal

- `Y` up; `XZ` horizontal lake; scene scale configurable in world units.
- Central elevated small island/rock mound with **very large sakura tree** as landmark.
- Lily pads spread into sweeping arcs/rows around tree, not a perfect rigid chessboard. Visible close pads big enough to support seated chibi; distant pad density increases.
- Lake apparently extends far into mist; mountains layered dark purple/blue silhouettes around horizon. Sky pastel peach/purple/blue gradient.
- Uneven tree roots/trunk silhouette: trunk nearly black-purple under pink glow, thick canopy pink with layers of blossom clusters; pink light and mist around base.
- Tall pink lotus buds/flowers interspersed but **don't fill scene** so avatars remain legible.
- Floating petals, sparkles and subtle water ripples follow time; ambient wind/sway subtle.

## Key asset list

| Group | Must-have | Technical notes |
|---|---|---|
| Environment | lake plane, low-poly ground/island, mountain rings, sky/fog | scene geometry, atmospheric depth |
| Tree | dark trunk and branches, volumetric-looking pink blossom canopy | instanced blossom clusters / LOD / wind |
| Lily pads | 3–5 shape variants with green vein/notch | instanceable meshes; non-overlap seats |
| Lotus | pink buds, opened bloom, leaf stem | 2–4 growth stages, no texture atlas watermark |
| Character | original round-head chibi mesh, dark/pastel hair, white/pastel outfits, cross-legged pose | one common skeleton, variants/texture palette, breathing animation |
| Nameplate | readable white/light text with subtle shadow | camera-facing but never cover face; distance fade |
| FX | falling pink petals, sparkle, ripples, gift burst, bloom pulse | GPU budget, pooled particles, no strobe |

## Character proportions

Reference: large head, compact torso, rounded hands/feet, sit cross-legged in zen pose. Keep seated avatar facing a broadly consistent direction in mid-shots yet allow near-camera facing via orientation/lod. Mix hair colors, face, outfits; **do not clone screenshot avatars exactly**. Character should look like simplified 3D, not flat 2D cutout.

## Lighting & fog

- Primary: sunset skylight pink-lavender, soft long fill from sky, warm rim highlights.
- Pink emissive-looking tree canopy; **do not overexpose** to solid white blob.
- Water: navy / desaturated violet with soft horizontal reflection and tiny ripple normals; degrade reflection if GPU constrained.
- Distance fog pink-violet to integrate mountains and avatars, preserving foreground contrast.
- Avoid photorealistic textures; video is stylized.

## Pipeline & technology

Three.js / Babylon.js WebGL renderer candidates; need first 3D spike, camera test, GPU benchmark. Existing V1 PixiJS renderer is 2D, not primary implementation for this scene. Use `glTF/GLB` with original models + compressed textures; suitable instancing and LOD. Avoid drawing one AI-generated image as a fake 3D scene. AI image output is **concept**, not rigged/optimized production model.

## AI Visual prompts

**World:** "Original stylized three-dimensional magical meditation lotus lake at pink-lavender sunset, enormous glowing pale-pink cherry blossom tree on a tiny dark island, near-black twisting trunk, hundreds of bright green floating lily pads arranged in broad arcing rows, many cute small seated chibi meditators, deep navy reflective water, misty indigo mountain silhouettes, delicate drifting petals, soft glowing particles, low-poly but polished real-time game style, cinematic perspective, vertical 9:16 composition, no text, no logo, no app UI, original game-ready environment."

**Character:** "Original low-poly chibi zen meditator for glTF character sheet, oversized rounded head, friendly calm face, simple dark short hair and alternate hair variations, neutral off-white robes with pastel accents, cross-legged seated pose with hands resting on knees, front/back/side views, clean rig-friendly geometry, no words, no game brand."

**Tree:** "Game-ready original stylized giant sakura tree, thick dark purple-black curving trunk and visible branching silhouette, enormous soft clustered pink blossoms, subtle airy gaps within canopy, luminous rim lighting, separate trunk, blossom cluster and petal pieces, low-poly modular 3D asset reference, no UI."

**Camera contact sheet:** "Six frames showing the exact same original 3D lotus meditation garden and characters: close water-level view of seated chibi, medium group across floating pads, dramatically high aerial view above huge pink cherry blossom tree and patterned lily pads, low view under the black trunk toward pink mist, intimate avatar gift closeup, warm group portrait; vertical 9:16 game camera framing, consistent asset appearance and lighting, no text or interface."

## Visual deliverables

World layout sketch (top-down), 6 shot boards, tree/characters/props turnaround, reusable material palette, asset inventory (license/owner, tris/texture estimates), GLB files and animations if supported. Define fidelity risk if only concept PNG available. Asset names stable and separate from LIVE events.

## Fidelity review procedure

Render 6 shots with a fixed camera seed and same aspect as clean LIVE output. Compare to frames at 3, 9, 15, 20, 33, 42 s, rating each of: composition/landmark, color, number/scale of avatars, camera angle, depth, lights/fog, text/FX. Reject if water, tree, or camera is merely 2D wallpaper.
