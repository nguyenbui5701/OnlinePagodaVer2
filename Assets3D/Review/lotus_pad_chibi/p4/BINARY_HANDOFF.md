# P0.4 exact binary/source upload handoff
PR #2; branch `assets/lotus-pad-chibi-p0`, p4-only revision. All listed assets below are local owner downloads; **not GitHub uploaded**.

| Target relative path | Bytes | SHA256 | GitHub state |
|---|---:|---|---|
| p4/meditator_female_ao_ba_ba_p04.glb | 244348 | 586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09 | pending_owner_upload |
| p4/procedural_female_p04.py | 16549 | b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2 | pending_owner_upload |
| p4/blender_p04_cycles.py | 8663 | f164c89bddc42c849ece5d4ad70e06dc7f0e80e610c5e3f5650feabedf3af1d5 | pending_owner_upload |
| p4/render_pbr_p04.py | 5927 | 96b9fd54693d59f6f920c9ab3257bf66b74da3633e93c32a083bf731c701e902 | pending_owner_upload |
| p4/validate_p04.py | 5700 | d2875d879d6a6ec343958be4ece2db392015fac52798224918be3d72731795b9 | pending_owner_upload |
| p4/run_p04_blender.ps1 | 3927 | 0a5cd90d0920783a57b875b28e2830aa6b664fc92ad04d52a3e07136c8bbd98b | pending_owner_upload |
| p4/PBR_Review/P04_SIX_COLORS_SAME_GEOMETRY.jpg | 92688 | d0d9d350cb1cdb5614daa5f31bed2dfa5ff62108ed559e67cb6f45b17d9095d4 | pending_owner_upload |
| p4/PBR_Review/P04_FRONT_SIDE_THREEQUARTER_BACK.jpg | 38692 | 0fb8cb3c743eb937b1ccea31af7ee706c835fd4234a8716b16b76b9048cf955e | pending_owner_upload |
| p4/PBR_Review/P04_PLACKET_HAIR_PORTRAIT.jpg | 54278 | e900b86ef29512e1cafb09d98105007f5ec20125fb2e7a94822a8d6d91aa54d2 | pending_owner_upload |
| p4/PBR_Review/P04_HAIR_IDLE_BACK_5FRAMES.jpg | 29010 | b99b24be1330b0d8f943ac644036f8c3f30b563ae6789f82ce5680344bc6250d | pending_owner_upload |
| p4/PBR_Review/P04_IDLE_FRONT_5FRAMES.jpg | 41864 | 8d1acf0461ae948641b737796ad74bdc49c403ac19771f2f616dec74e4ca1d72 | pending_owner_upload |

Other native PBR PNGs are inside the owner `P04_FEMALE_PBR_EVIDENCE.zip` and remain pending, with exact hashes available using SHA256 after extraction. **New P0.4 Blender .blend, Cycles PNG, logs/ZIP do not exist** before owner runs Blender. Their state is `pending_owner_Blender_execution`; no bytes/SHA invented.

Existing P0.3 actor and P0.2 lotus are frozen under p3 and are NOT re-exported to p4. After pushing owner binary, have SA independently check remote SHA rather than assuming file presence proves integrity. NO male/Codex/merge.
