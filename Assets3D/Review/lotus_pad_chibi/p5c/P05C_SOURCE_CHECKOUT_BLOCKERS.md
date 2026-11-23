# P05C GitHub checkout-only source blockers — exact evidence

Original P05b full source was recovered locally from owner SOURCE_REPORTS ZIP; clean-room P05b rebuild produced byte-identical source GLBs. This proves LOCAL reconstruction, not a GitHub-only reproducible checkout.

Pending owner source uploads to branch assets/lotus-pad-chibi-p0 / folder Assets3D/Review/lotus_pad_chibi/p5c/:

- p04_source_frozen.py.zlib.b64 — original decompressed p04_source_frozen.py SHA256 b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2, 16549 bytes.
- p05_source_frozen.py.zlib.b64 — original decompressed p05_source_frozen.py SHA256 e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9, 10597 bytes.

Both compressed payloads and readable originals are in the ChatGPT P05C_FEMALE_PALMS_SOURCE_REPORTS.zip; owner must upload exact bytes or original .py source to the new p5c folder, not alter p5b. Original P05b builder is already copied byte-exact on PR, and both baseline GLBs already exist in sibling p5b.

After upload, run: py restore_frozen_sources.py; py procedural_female_palms_p05c.py; py validate_p05c_independent.py (the full validator is also in the owner ZIP and should be committed before checkout-only PASS). A smaller verify_exported_glbs.py is already in PR, but requires both new GLBs uploaded first.

Until these sources are present, GitHub checkout-only source reconstruction = BLOCKED. New GLBs remain pending_owner_upload. P05C Blender Cycles, new .blend, owner aesthetic gate remain NOT RUN / NOT APPROVED. No male/Codex/integration/merge.
