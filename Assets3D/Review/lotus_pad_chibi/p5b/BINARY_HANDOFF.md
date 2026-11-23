# P05b owner binary/source upload list — exact hash

Repository **PR #2 DRAFT**, branch `assets/lotus-pad-chibi-p0`; all new files target `Assets3D/Review/lotus_pad_chibi/p5b/`. Original `p5/` and original `p3/lotus_pad_01.glb` are immutable.

| Target inside p5b | Bytes | SHA-256 | GitHub status |
|---|---:|---|---|
| `meditator_female_cross_prayer_p05b.glb` | 424628 | `81e8548cf6e46d9f5ff60c7bdf342ac1857015140e7d06d67dbd9284054137fd` | pending_owner_upload |
| `meditator_female_kneel_prayer_p05b.glb` | 439088 | `533b84cba69332107ea25c57ed952b76c8276d4971a558496e4caf7aea400e9f` | pending_owner_upload |
| `procedural_female_hands_p05b.py` | 8293 | Git blob SHA-1 `08ed3cec27d9989356804c0369fbdf53c693fc50` | **uploaded and verified Git blob exact** |
| `p05_source_frozen.py` | 10597 | `e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9` | recovered in owner source ZIP; pending_owner_upload |
| `p04_source_frozen.py` | 16549 | `b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2` | recovered in owner source ZIP; pending_owner_upload |
| `blender_p05b_cycles.py` | 10839 | `6e08af09de3daf5327c192d7cad0d616ed470b3f4f1086f05f958f1c9af9a202` | owner ZIP, pending_owner_upload |
| `run_p05b_blender.ps1` | 5451 | `0a8cb44f1c1ac6212fba8c127524935198369f7eb4cac726844cde37eb7330f0` | owner ZIP, pending_owner_upload |
| `validate_p05b.py` | 8479 | `9784e51e0301c4b40c58e24aef04b535448c5181ec2fc65eb51babfdf5f758fb` | owner ZIP, pending_owner_upload |

**Other preview JPEG/PNG files:** in `P05B_FEMALE_HANDS_PBR_AB_EVIDENCE.zip` and source manifest `asset_manifest.json` with full per-file SHA-256 and bytes; pending_owner_upload. **New four .blend / new Cycles PNG/ZIP do NOT exist yet**; can't fabricate hash or bytes. Frozen leaf is reused (SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b6be09`), not regenerated.

Owner uploads exact binary/source files to PR #2 branch, then SA confirms actual remote SHA. Windows: `Get-FileHash -Algorithm SHA256 .\meditator_female_cross_prayer_p05b.glb`. No manual alteration to p5/p4 or main, no merge.
