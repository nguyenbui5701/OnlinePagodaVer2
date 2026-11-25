# R18a — final evidence uploaded / AI Visual pre-SA review complete

Owner upload `24cf39cf4df5e7a05be7cf126a422439a7cd4d60`; reviewed R18 `631273440469b789bf7f1688bff30a35309de601`; [SA R1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/27#pullrequestreview-6058176405); AI Visual17 §10. Art First soft references ECO120k/QUALITY500k/HIGH QUALITY1M. No mandatory third GLB; full detail QUALITY editable + ECO collection. No rerun of unchanged baseline tests. 0 VND.

| LOD | Triangles | Gold delta | Vertex records | Primitives | Bytes | SHA256 |
|---|---:|---:|---:|---:|---:|---|
| QUALITY | 242954 | +5521 | 303136 | 26 | 7152368 | `ff14eece4e43eba996a28bfdc8e7353693b4d0ab75911af2f0a61dbae57f35ab` |
| ECO | 60931 | +2149 | 101192 | 25 | 2229632 | `1ed0f0bb658a045fba09267020feebab99824ee06423bb92577a8cd2d2e7c847` |

QUALITY +5521 tris (+2.33%), +157036 bytes (+2.24%); ECO +2149 tris (+3.66%), +64412 bytes (+2.97%) vs R18. Primitive count is asset inventory, not measured runtime draw calls. 15/14 materials, no textures. Native surface-distance maxima ~0.012m (<0.025m tolerance), bounds unchanged. No GPU performance assertion.

Independent review of attached ZIP: CRC, SHA256/Git blob match all three binaries; both GLBs parsed, finite accessor/index and degenerate checks PASS. Reverted only appended gold data and gold material in memory to reconstruct exact previous R18 SHA256/Git blob/length both profiles. [Receipt](PRE_SA_FINAL_REVIEW.json). All accepted structural bytes preserved. Editable `sakura_hero_r18a_editable.blend` 22877219 bytes, SHA256 `07c5859ca2a6a9dec33c7999cabd7d2a45873285e09d04e0ea3771577a83266c`, Git blob `5239e9b4c0b2cb075d73c7e6636269fd6eafdfde`; Owner native reopen and visibility switch PASS; no independent Blender execution here.

Native Build/Final exit 0, empty stderr; 24 matched frames (16 new +8 reused R17B), four reused R18 gold controls and two new warm-fill images. Nine sheets directly viewed (36 panels); 41 inventory files + manifest and 12 reused frames match 54 SHA ledger entries. Git metadata checked; remote render bytes not independently rehashed. See [native manifest](native_manifest.json), [SHA ledger](owner_sha256.txt), [final result](final_result.json).

Art improvement clear: long legible branching gold, intact mature pink crown and repaired blossoms. QUALITY sometimes broad flat ribbons, 3 qualifying major branch components vs ECO 9; ECO fine gold on more limbs. Warm-fill helps bark/flower readability offline only. Reference video unavailable in artist session, previous SA finding used. Seat/gift camera-only; no runtime seats, lighting, reflection, FPS/VRAM/LIVE proof. Recommend SA final review, no additional art or render iteration now. Owner Art GO pending. No merge/runtime/Codex/B9/C0. STOP P10B8_ART_SA_REVIEW_REQUIRED.
