# P0.3 original asset / image handoff with exact hashes

**Existing GitHub P0.2 pad stays unchanged:** `p0.2/lotus_pad_01.glb`, 262,108 bytes, SHA-256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`. No copy is needed in Git history.

**New P0.3 actor GLB to upload if the owner chooses:** `Assets3D/Review/lotus_pad_chibi/p0.3/meditator_base.glb`, **212,040 bytes**, SHA-256 `646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0`. **GitHub state: pending_owner_upload**, not falsely described as already committed.

GLB and JPEG PBR evidence is provided separately to owner in `P03_HAIR_PORTRAIT_GLB.zip` and `P03_HAIR_PORTRAIT_PBR_AB.zip`. Images `CHIBI_FRONT_SIDE_BACK_AB.jpg`, `PAIR_MEDIUM_CLOSE_AB.jpg`, `OWNER_HAIR_CAMERA_GATE_9x16.jpg`, `PAIR_CONTACT_AB.jpg`, `SIT_IDLE_5_PHASES_AB.jpg` are **VTK native GLB PBR**, not owner Blender Cycles, and **pending_owner_upload** on GitHub.

**New P0.3 editable Blender source and Cycles ZIP:** `NOT_CREATED_UNTIL_OWNER_RUN`. The P0.2 original owner `.blend` blobs and Cycles evidence already on PR are NOT overwritten or rereviewed. Upload original P0.3 binary only after `Get-FileHash -Algorithm SHA256` matches manifest and SA/owner gate.

No runtime/Sakura/Codex edits. PR #2 Draft; owner art pending.
