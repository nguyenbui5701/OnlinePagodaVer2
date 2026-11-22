# P06A Phase 1 — grounded male design versus approved female

## Baselines actually read, checksummed and parsed
- Female cross P0.5f: 574608 B, SHA256 `3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4`, 17752 triangles / 9084 vertices / 10 meshes / 21 materials.
- Female kneel P0.5c: 439244 B, SHA256 `a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac`, 17792 triangles / 9 meshes / 21 materials.
- Original female long-hair mesh: 1287 vertices, 2452 triangles, y[-.32m? NO: actual min 0.320m, max 1.152m], rear hair extends below neck. New male cap reaches approx y0.83..1.158m, short nape; same new geometry cross/kneel.
- Head skin original y[.436,1.142]m, x ±.336m; shoulders top extents ±.331m. Gentle 70 vertex cheek-jaw adjustment and 118 shoulder top vertices. Existing eyes, face blush, hands, fingers/cuffs, leggings, shoes, foot instep, waist and P05f contact unchanged outside localized facial/shoulder changes. A distinct male with neat hair, not just a shaved female.
- Named anchor nodes unchanged, 2 clips each, 2sec/17 keys, variants named exactly pastel_lilac/blush_rose/sage_green/sky_blue/warm_cream/terracotta; joint arms static under UpperBodyBreath breath ≤16mm.
- Original female cross P0.5f contact established by exact source inherited, with sampled underside support min 2.784mm left, 1.637mm right (P05f report), not an exact continuous collision guarantee. Frozen lotus SHA256 80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9. Male cross lower body buffer views are copied byte-identically; male kneel also preserves lower-body from owner-approved kneel reference.

## SA issue → sculpt → proof gate
| Issue | Applied real source geometry solution | Verified / still pending |
|---|---|---|
| Different male, same stylized family | Replace primitive 6 entirely with smoothly ribbed, compact neat side-part; add two gentle brows into hair material, slight jaw/shoulders | GLB parse counts, real hair buffer and 3D outward-normal audit PASS; **Cycles front/left/right/back ART_PEND** |
| Hands naturally joined | Preserve original female approved prayer palm/wrist accessor bytes | Original two GLBs same hands; actual male palm surface contact EXPLICIT PROXY_ONLY pending Blender |
| Cross foot and seated lotus weight | Copy P0.5f lower garment, foot mesh, original 2 underside support shapes, waist underlayer | Source binary preserved in references; male exact triangle contact and 5 idle ray-contact **NOT_RUN** |
| Kneel support and ankle tuck | Preserve approved P0.5c kneel pose pants and sandals, no global Y offset | SA owner-approved female art baseline; male native lotus contact **PROXY_ONLY** |
| 6 colors without 6 meshes | Preserve exact KHR_materials_variants shirt+trouser mapping, all 21 glTF material slots | GLB semantic parser PASS; actual six-color Cycles **NOT_RUN** |
| Real 3D and affordability | Two GLB2, fewer triangles than each female; short hair 1105v/2120 triangles | SHA exact, bytes counted; GPU FPS **NOT_RUN** |

Original matching camera `pair_side` (eye (2.75,0.62,0.43), lookAt(0,0.45,0), FOV42) must be used with identical light/AgX/exposure for both genders. Add separately-labeled hair front/left/right/back/3q/top without hiding defects. PBR standalone images were **NOT** generated locally; any concept thumbnails are NOT Cycles. Blender not available in this environment.

**Go/no-go:** `P06A_MALE_TWO_POSE_OWNER_REVIEW_REQUIRED` — the two male poses are true GLB preview candidates; SA review and explicit owner visual approval still outstanding. No merge or implementation.
