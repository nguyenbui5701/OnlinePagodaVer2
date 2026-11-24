# Sakura R17 — SA follow-up / PR #18

Authoritative [SA review #6032823643](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6032823643) at `36c9e327c37441a7c5406068f9aecd291e52d437`; task AI Visual 16 §7. Frozen PR #1 base `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9`; read-only PR #17 `1201369e019f6ba04f7437c7dac347e56894ba2a`. Same artist branch only, cost 0 VND.

**R17_NATIVE_BUILD_EVIDENCE_PASS / R17_ART_PARTIAL / R17_BINARY_SA_VERIFICATION_PENDING / MERGE_HOLD.** Owner final R17 Art GO PENDING. Git tree contains both GLBs, editable Blender and 24 native Cycles PNGs. Sizes match the owner build/PNG ledger; the SHA-256 values below are owner-reported, not independently decoded by SA. Metadata-only reconciliation and read-only evidence scripts; no geometry, renderer or original evidence changes.

## Current visual assessment

SA directly viewed ECO full-tree and trunk/fork pairs at reviewed HEAD. Darker rose florets added; whole crown silhouette remains very similar to R16, with pale clustered/polygonal appearance. No claim on unseen QUALITY frames. Need all six paired views per profile via compact sheets before deciding whether a stronger silhouette/depth iteration is justified. Render-only water does not represent native Viewer reflection. No further mesh iteration ordered at this gate.

## Resource assessment

| Profile | R16 triangles | R17 triangles | Added flowers | R17 meshes/materials | File size ratio |
|---|---:|---:|---:|---:|---:|
| QUALITY | 191288 | 220088 | 1200 | 12/15 | 3.53x |
| ECO | 44412 | 49452 | 420 | 11/14 | 2.77x |

Quality +12,795,832 bytes; ECO +2,460,584 bytes. Actual exported buffer/attribute distribution unknown. The new audit separates physical BIN/JSON bytes from logical accessor bytes and counts vertex records across primitives. Test split normals/material duplication and index width hypotheses with measured results; any future compact export must be reversible and preserve protected geometry/materials, true output bounds and appearance. No optimization applied in this commit.

Historical Phase A evidence is retained at a646e07. Original R16 source audit and contact proxy 45/68 are unchanged. Full independent binary/Blender opening remains pending.
