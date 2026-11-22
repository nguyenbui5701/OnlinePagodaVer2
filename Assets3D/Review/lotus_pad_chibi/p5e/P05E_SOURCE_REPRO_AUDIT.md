# P05e exact canonical source and clean-checkout reproduction

Files committed to the **existing PR #2** on the new p5e/ revision only:

- `P05E_CANONICAL_SOURCE.zlib.b64`: 6,181 bytes, SHA256 `500ab925c8234fb470de03cd599857a674ba034c9e753fdad46dd9344ac65211`; contains the exact 11,340-byte original readable Python generator in zlib/base64.
- `restore_p05e_source.py`: 2,095 bytes, SHA256 `1877322c7a5cb493cb0f45a1ad3596549325d27de09625ee4de4403407b8e929`; writes the SHA-pinned editable `procedural_female_cross_foot_waist_p05e.py` (SHA256 `18879f2a0bcc4e59d5299d6b196a3ce11c89d15dff3decb618bb35edba9b3ba1`). Refuses to overwrite a different existing source.
- `p05d_original_reference.py`: exact original P05d helper, Git blob `9cd65fbb4bc1a6e8b4978086d4789ac79103f6ea`, uses only original P05d GLB pinned SHA `0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44`. No P04/P05/P05b source dependency.

From a checkout of branch `assets/lotus-pad-chibi-p0` with original p5d GLB:

```powershell
cd Assets3D/Review/lotus_pad_chibi/p5e
py -m pip install numpy scipy trimesh
py .\restore_p05e_source.py --build
Get-FileHash -Algorithm SHA256 .\meditator_female_cross_prayer_p05e.glb
```

**Independent scratch-tree clean-checkout simulation:** three exact source artifacts and pinned P05d GLB, no P05e GLB input, restored source SHA matched `18879...`, newly generated GLB **574048 bytes / SHA `0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367`**, byte-exact same as full owner GLB handoff ZIP. SA has not yet run own checkout validation. Original plain source is also available in the user SOURCE_REPORTS ZIP.

**Not implied by source PASS:** Blender/Cycles P05e NOT RUN, 2 new editable .blend NOT CREATED, true lotus collision/visual final gate PENDING. New GLB binary and original PNG previews still pending owner upload; PR Draft.
