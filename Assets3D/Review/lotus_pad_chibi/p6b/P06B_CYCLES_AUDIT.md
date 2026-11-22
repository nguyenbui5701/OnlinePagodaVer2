# P06B Cycles evidence status — truthful

**P06a old reference:** SA verified genuine Blender 4.5.16 LTS Cycles CPU 32 samples, real source .blend, PNG, 6/6 male stdout cases and 0 stderr in [SA review #6011115553](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011115553). Their historical P06a old root files predate owner upload; don't rewrite them.

**P06b new:** No Blender binary installed in this AI runtime. `blender_p06b_cycles.py` and `run_p06b_blender.ps1` are reproducible source only. New Cycles PNG, .blend, logs, ZIP and CRC **NOT RUN / NOT CREATED**, not a PASS. Two GLBs and all non-hair binary validation **PASS**.

**Owner Windows full run** should produce four new cases (`p06b_cross_actor`, `p06b_cross_pair`, `p06b_kneel_actor`, `p06b_kneel_pair`): old-exact hair FRONT/LEFT/RIGHT/BACK/TOP/3Q, extra new left/right3Q/low back, both 9:16 lotus pair medium+close, five native idle frames 0/.5/1/1.5/2. Same Cycles CPU 32/AgX EV0/World .65/3 suns; exact original SHA pins. PowerShell records original stdout/stderr, PNG and .blend SHA+bytes, per-case JSON, FILE_HASHES_SHA256.txt, evidence ZIP. Archive CRC must be independently tested on actually produced archive before claiming PASS. No unnecessary p6a body/hand/seat retesting or GPU/LIVE.

**Status:** `P06B_MALE_HAIR_OWNER_REVIEW_REQUIRED`, both male poses explicit owner acceptance pending after SA checks real Cycles. Full eye/hair/ear exact triangle collision and scalp geometry penetration NOT_RUN (finite GLB mesh proxy only). STOP no Codex/integration/merge.
