# P0.5 binary + editable source handoff — all hashes are LOCAL and verified

**PR #2 Draft**, branch `assets/lotus-pad-chibi-p0`. New files target `Assets3D/Review/lotus_pad_chibi/p5/` only. Unless verified individually on the remote, **`pending_owner_upload`** applies, even if included in ChatGPT ZIPs.

| Target | Bytes | Original SHA256 | GitHub upload |
|---|---:|---|---|
| `p5/meditator_female_cross_prayer_p05.glb` | 338176 | `981ecf0b83378ce3fca7cd49db9473baac43238af3b5ee2fa857024ff66b57fd` | pending_owner_upload |
| `p5/meditator_female_kneel_prayer_p05.glb` | 352636 | `04a1d0e03e5186085118dd06d158dbba43e7180843895ed1661a03529040785e` | pending_owner_upload |
| `p5/procedural_female_prayer_p05.py` | 10597 | `e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9` | pending_owner_upload |
| `p5/p04_source_frozen.py` | 16549 | `b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2` | pending_owner_upload |
| `p5/blender_p05_cycles.py` | 10299 | `32f05a1c85821cfa5a4e9f6db5fc0a2b71b0a46f24c9005e99dacd655f0c7f66` | pending_owner_upload |
| `p5/run_p05_blender.ps1` | 5008 | `6b5328ce69b01dd4563ef13cb88b66ebf42f3f3206993d680efe1d561dcca2e4` | pending_owner_upload |
| `p5/render_p05_pbr.py` | see source ZIP | `dd9b5287624bf0d246d4d47b63b9ac335935c02d452738377cc00c1d3e98f168` | pending_owner_upload |
| `p5/validate_p05.py` | 9060 | `f56b502aba8a9329e7538c7369364a8c72859e1680a75db0296b2be46da1be1b` | pending_owner_upload |
| `p5/contact_proxy_p05.py` | see source ZIP | `998084cbb369025fd7f5182bff4a63a9a200060bcaa52c2ab1fde19df0702316` | pending_owner_upload |
| `p5/compose_p05_cycles_sheets.py` | 2971 | `dee6547dc1304ba3a49df5f46804b2ff3b070bc9b4f994c3dbe23a3f9287a86b` | pending_owner_upload |

**Selected actually executed native GLB VTK PBR contact sheets (NOT Cycles):**

- `p5/PBR_Review/P05_P04_CROSS_KNEEL_FRONT_SIDE_QTR.jpg` — 117033 B, SHA256 `e75e21ee5c66d3f7a0e75cee35a9b4683a10d1a0500f1ed732ac7b23a58c57a5` — pending_owner_upload
- `p5/PBR_Review/P05_HANDS_FRONT_SIDE_AB.jpg` — 112393 B, SHA256 `88ce004f5643f5500509e1580c56db81ee0a23b0a94d8f4998f560a39bdd0c9f` — pending_owner_upload
- `p5/PBR_Review/P05_KNEES_FRONT_SIDE_AB.jpg` — 86619 B, SHA256 `a070c4508104db0b0d8f7aa3bf79921494130b35103b506038dfe819ff70e689` — pending_owner_upload
- `p5/PBR_Review/P05_9x16_FULL_MED_CLOSE.jpg` — 152751 B, SHA256 `9db0b22ddaa32dbdab3c5e3135482c2bca1c6738e0590c8e9076d3f2250a9e6f` — pending_owner_upload
- `p5/PBR_Review/P05_cross_prayer_SIX_COLORS.jpg` — 73328 B, SHA256 `d77b25a57c7426f5ac5ec4925ef9f1125ea97d7691f915ea36e62116e7e38714` — pending_owner_upload
- `p5/PBR_Review/P05_kneel_prayer_SIX_COLORS.jpg` — 72656 B, SHA256 `36fbc1bbd7d461d3f19ce82e39ad2484d5343b9473c5aaf8a095168171350832` — pending_owner_upload

Other PBR PNG/JPEG originals and exact source files are inside `P05_FEMALE_PRAYER_PBR_AB.zip` and `P05_FEMALE_PRAYER_SOURCE_REPORTS.zip`. All ZIPs were checked for CRC in AI container. The complete generator and Blender script are real and attached in the user downloads, but **their GitHub uploads remain pending until the owner puts their exact files under p5/**; do not substitute links or mark them committed.

**Existing artifacts NEVER overwritten:** P0.4 actor `p4/meditator_female_ao_ba_ba_p04.glb` SHA `586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09`; original P0.2 leaf at `p3/lotus_pad_01.glb` SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

**NOT CREATED YET:** `P05_Cycles_Evidence/`, four new original `.blend` actor/pair files, true Blender Cycles PNGs and their log/JSON/ZIP SHA. These are `pending_owner_Blender_execution`; no bytes or hashes can honestly be provided. Owner Windows runner produces original evidence and hashes after successful execution. SA must recheck remote uploads. **STOP: no male/Codex/merge.**