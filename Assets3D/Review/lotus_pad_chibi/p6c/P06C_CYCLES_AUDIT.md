# P06c Blender evidence state — no fabricated Cycles, .blend, ZIP

**Old P06b** (on original PR HEAD `9ff521549af8b8f1449579a4c7fd7ab6021c7e94`): 4/4 genuine owner Blender 4.5.16 LTS CPU Cycles cases reported with `[P06B_CYCLES_COMPLETED]`, stderr 0 bytes, four editable .blend files, 720×1280 pair shots, PNG and ZIP on GitHub. SA independently visually saw the old FAIL hole. `P06B_ZIP_CRC_stdout.log` reports PASS (87 files, SHA256 `7bedfe25e26bb766f0aa60a93912235df11f0d6bd58a21b4b2e70bff371ad3d4`), but CRC and all old .blend SHA were **not independently rehashed** in SA review, so retain `REPORTED_ONLY` label.

**NEW P06c:** This AI environment has NO Blender binary. **Genuine new P06c Cycles = NOT_RUN, editable .blend = NOT_CREATED, PNG/ZIP/logs = NOT_CREATED, ZIP CRC = NOT_RUN.** Two genuine GLB2 exports have been SHA-checked and pushed, and geometric sample ray test PASS. Do not call this a visual PASS.

Actual owner runner `run_p06c_blender.ps1` uses `blender_p06c_cycles.py`, pinned SHA for old/new both poses plus original P02 pad, 8 matched old/new actor/pair cases, CPU 32 samples AgX EV0, original exact P06b cameras, real 720x1280 medium+close, five imported idle timestamps t=0/.5/1/1.5/2 on P06c cases. It generates normal images, optional clearly labeled diagnostic skin-magenta original pixels, two actor/two pair editable P06c .blend, case_report JSON/SHA, stdout/stderr, filename SHA list, ZIP and then independently runs actual ZIP CRC validator. Only owner execution can change NOT_RUN statuses.

**No native Three.js, GPU, TikTok LIVE Studio or crowd benchmarks**. Scope is solely male hair/scalp/GLB. **SA review then explicit owner approval BOTH male poses** before Codex or merge.
