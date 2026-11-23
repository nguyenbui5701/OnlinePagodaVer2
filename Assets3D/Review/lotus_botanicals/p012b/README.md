# P0.12-B — Original lotus blossom + closed bud (draft, no merge)

**Source:** PR #2 HEAD `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`, frozen P02 pad 2.083084 m across / SHA256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.
**Viewer context only:** PR #9 HEAD `0a5d060d0ec4eeda19d62cfcd4a58a29f58c38bf`. No runtime edits.

Two original props only: open ivory/blush lotus and upright closed tapered bud with muted green sepals. Each has ECO and QUALITY **real GLB2** variants, no image textures, no camera/light in exported GLBs. +Y-up, 1 unit = 1 m, root at waterline (0,0,0). Source is `build_p012b_assets.mjs` and is deterministic without dependencies. Run `node build_p012b_assets.mjs` from this folder on an owner machine. Compare the SHA-256 hashes in `asset_manifest.json`. P02 geometry is never bundled into the new GLBs.

**Review status:** GLB2 geometry and SHA computed during authoring; Blender and genuine Cycles review **NOT RUN** in the assistant runtime because Blender is absent. Native `.blend`, sixteen matched Cycles views and context renders remain `pending_owner_blender_run`; do **not** treat a structural prototype as SA Art PASS. Owner can run `blender --background --python blender_cycles_p012b.py -- --assets . --p02 <absolute-path-to-P02-GLB>` after checking the four binaries. Blender script saves editable source and Cycles evidence.

**STOP:** `P012B_SA_ART_REVIEW_REQUIRED` → SA verifies actual exported GLBs, exact SHA and Blender Cycles → Owner Botanical Art GO. No merge, no Codex integration, no changes to PR #2/#9, old characters, R16 Sakura or lake shaders.
