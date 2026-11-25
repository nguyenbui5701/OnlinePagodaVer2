# OnlinePagodaVer2 — Design index

**Status:** **P0 BASELINE APPROVED FOR IMPLEMENTATION — owner 2026-11-21**. This authorizes versioned `Task/**` and isolated implementation PRs; it is **not** final release/production sign-off. Unresolved defaults and GPU/Three.js tests remain open in [16](16_P0_APPROVAL_AND_HANDOFF.md). **Gift-camera behavior confirmed by owner 2026-11-20**. **Nguồn chuẩn hình ảnh:** `chuav2.mp4` do owner cung cấp, 46.87 s, 720×1556, 30 fps. **Ưu tiên:** làm giống video nhất có thể về thế giới 3D, bố cục, ánh sáng, camera, avatar và tương tác, không sao chép UI TikTok.

## Quy tắc quan trọng
1. **VIDEO FIRST:** video là visual ground truth; V1 không quyết định kiến trúc đồ họa của V2.
2. **REUSE SELECTIVELY:** V1 chỉ dùng các phần đã xác minh hợp lý: TikTok connector, normalization, demo/connection, các hợp đồng live và kiểm thử liên quan. Không bê nguyên scene/camera/ritual V1.
3. **DESIGN BEFORE TASK:** owner đã duyệt baseline P0 vào 2026-11-21. `Task/**` cho P0 và code/asset PRs **nay được phép triển khai theo Design/16**, với SA review, nhưng chưa phải lệnh merge hay LIVE production.
4. **NO ASSUMPTIONS:** phân biệt điểm **quan sát từ video** và **đề xuất thiết kế**; event `member` không đồng nghĩa mọi người đang xem, mapping gift và giới tính chưa suy diễn.
5. **NO CHANGES TO V1:** V1 đang livestream tiếp tục hoạt động độc lập; V2 phải có demo fixture và không cần token/cookie.

## Tài liệu thiết kế
- [01 — Phân tích từng cảnh](01_VIDEO_BREAKDOWN.md)
- [02 — Requirements & mức độ fidelity](02_REQUIREMENTS.md)
- [03 — Scene 3D, asset & art direction](03_VISUAL_WORLD.md)
- [04 — Camera choreography](04_CAMERA.md)
- [05 — TikTok, event & viewer mapping](05_LIVE_INTERACTION.md)
- [06 — Architecture và V1 reuse audit](06_ARCHITECTURE_AND_V1_AUDIT.md)
- [07 — Quy tắc AI Visual / AI Code / Review PR](07_WORK_RULES.md)
- [08 — Acceptance, benchmark, unanswered decisions](08_ACCEPTANCE_AND_DECISIONS.md)
- [09 — Gift-aware camera director (owner-approved)](09_GIFT_CAMERA_DIRECTOR.md)
- [10 — Performance profiles for RTX 3050 Ti 4GB / RTX 3060 8GB](10_GRAPHICS_PROFILES.md)
- [11 — Real 3D asset production: AI 3D + Blender + GLB](11_3D_ASSET_PRODUCTION_PIPELINE.md)
- [12 — P0 priorities and roles for AI 3D / Codex / SA](12_CORE_PRIORITIES_AND_AI_ROLES.md)
- [13 — Cross-AI asset and event integration contract](13_3D_EVENT_INTEGRATION_CONTRACT.md)
- [14 — Zero-cost 3D production and lightweight PR handoff](14_ZERO_COST_AND_ASSET_PR_POLICY.md)
- [15 — Next AI Visual prompt: Sakura R04 zero-cost review fixes](15_AI_VISUAL_SAKURA_NEXT_PROMPT.md)
- [16 — Owner-approved P0 baseline, frozen Sakura R16 and implementation handoff](16_P0_APPROVAL_AND_HANDOFF.md)

## Triển khai P0 đã được phê duyệt

- **Baseline:** [Design/16](16_P0_APPROVAL_AND_HANDOFF.md) — art-frozen Sakura R16, contract v0.1.0, remaining production gates.
- **Tasks đã giao:** [Thứ tự triển khai](../Task/00_P0_EXECUTION_ORDER.md), [AI Visual — lá sen và chibi](../Task/AI_VISUAL_01_LOTUS_PAD_CHIBI.md), [Codex — renderer/camera](../Task/CODEX_01_RENDERER_CAMERA_SPIKE.md), [Codex — DEMO Event Engine](../Task/CODEX_02_DEMO_EVENT_ENGINE.md), [Tích hợp DEMO](../Task/INTEGRATION_01_VERTICAL_SLICE.md).
- **PR #1 Sakura** vẫn Draft và không merge; không sửa V1. Không dùng dịch vụ 3D trả phí. Không tuyên bố native Three.js hay FPS/LIVE Studio PASS khi chưa đo thật.

## P0 focus and AI ownership (confirmed 2026-11-20)

**P0-A = V2 Event Engine (Codex)**: TikTok event adapter, validated identities, session/seat registry, gift FIFO/confirmation, typed state and tests. **P0-B = 3D Scene + Camera (AI 3D + Codex)**: AI 3D delivers source 3D meshes/GLBs/animations, Codex only writes renderer/shader/LOD/camera code to consume approved assets. **SA** reviews both, owns design changes and cross-AI contract. Postpone noncritical admin panels, rituals, fortune and other V1 features until P0 runs like video. See 11,12,13.

**No Codex 3D/art generation** and no pretend-3D screenshots. An optional AI 3D generation service (e.g. connected fal if compatible) must be verified to output real mesh; Blender handles cleanup and GLB export.

## Camera behavior đã chốt với owner

**Bình thường:** camera chạy cinematic liên tục qua close/community/aerial/under-tree. **Khi phát hiện quà hợp lệ:** chuyển cận đúng nhân vật của người tặng, hiển thị tên/avatar và hiệu ứng; giữ shot đủ lâu; tiếp tục lần lượt tới những người tặng khác trong hàng chờ. **Không còn quà chờ:** blend mượt trở lại cinematic. Quy tắc chuẩn ở [09_GIFT_CAMERA_DIRECTOR.md](09_GIFT_CAMERA_DIRECTOR.md); không giữ camera đứng yên khi chờ quà.

**Máy đích:** RTX 3050 Ti 4GB (ECO) và RTX 3060 8GB (QUALITY); bắt buộc thiết kế cho máy 4GB hoạt động được sau benchmark, không chỉ máy 8GB. Xem [10_GRAPHICS_PROFILES.md](10_GRAPHICS_PROFILES.md).

## Cảnh bắt buộc
- Cận 1 avatar ngồi xếp bằng trên lá sen nổi ở hồ nước xanh đậm.
- Góc trung đông nhân vật, núi đen xa và sương hồng.
- Camera bay lên cao: cây anh đào hồng khổng lồ nổi bật trên hàng trăm lá sen/nhân vật.
- Góc thấp phía gốc cây: thân cây đen viền sáng, hậu cảnh tròn hồng sáng, sương dày, nhóm người ngồi.
- Cận lại avatar trong khi quà hoa hồng / chat bubble / ripple xảy ra; sau đó trở lại cảnh cộng đồng.

## Nguyên tắc kỹ thuật
Ưu tiên 3D thực (WebGL/Three.js hoặc Babylon.js được đánh giá ở thiết kế) vì video có thay đổi góc nhìn, chiều sâu và quỹ đạo camera thực. V1 hiện dùng PixiJS 2D; tái sử dụng PixiJS scene cũ không đáp ứng fidelity. Chỉ chọn rendering stack chính thức sau spike kỹ thuật và benchmark trên máy livestream.

## V1 source đã kiểm tra
`nguyenbui5701/OnlinePagoda` (nhánh `main`): `apps/server/src/tiktok/{provider,mapper,transport,worker}.ts`, `apps/server/src/sources.ts`, `packages/shared/src/live.ts`, `packages/shared/src/client.ts`, `apps/server/src/engine.ts`, `apps/overlay/src/main.ts`; xem chi tiết trong 06. Đây là source đọc qua GitHub; không khẳng định đã chạy test.

**Review rule:** Sau khi có PR code, SA review ở `ReviewPR/` worktree riêng, comment PR, chỉ xóa checkout và task khi không có blocker và owner cho phép workflow đó; giữ khi cần sửa.

## P1.0-B5 — LIVE operational dashboard

> **CURRENT — OWNER P10B5 DASHBOARD/OVERLAY GO (2026-11-24):** Owner approved V1-style independent Dashboard and clean Overlay. **OWNER_P10B5_DESIGN_GO / CODEX21_ACTIVE.** [Design29](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/0318e9cff102d62b899ad0e3dbd0c06eadb9aa39/Design/29_P10B5_LIVE_DASHBOARD_OVERLAY_SETTINGS.md) and [CODEX21](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/6914f197b5d24a902a70872b50b40963b3151e8b/Task/CODEX_21_P10B5_LIVE_DASHBOARD_OVERLAY_SETTINGS.md) control this new task. Exact [PR23 SA R3](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/23#pullrequestreview-6039980250) base `f8773cd35476924e0f68204b0d0e82b7e0e87d26`, new isolated branch feature/v2-p10b5-dashboard-overlay targeting feature/v2-p10b2-real-event-gateway. Dashboard owns settings/commands only; Overlay sole receiver/ACK; closing Dashboard must not interrupt LIVE. Persistent settings, safe offline apply, clean 9:16, no token, trusted localhost. Preserve PR23 ACK/lease/uncertainty, Engine/camera/assets and PR22 DEMO audio. LIVE audio remains muted pending separate task. No additional preflight, provider research, or art work; actual Owner room/Studio acceptance follows integration. This overrides earlier active-task/expanded-dashboard deferral for this scope only. Retain CODEX18/20 for outstanding acceptance/dependency; no merge. STOP P10B5_DASHBOARD_OVERLAY_SA_REVIEW_REQUIRED.

## P1.0-B6 — LIVE audio

> **CURRENT — OWNER P10B6 LIVE AUDIO GO (2026-11-24):** Owner approved immediate integration of audio into Dashboard/Overlay. **OWNER_P10B6_AUDIO_GO / CODEX22_ACTIVE.** [Design30](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/2ca43fdeeeabb467f04a06d2ee42b31a77dedbfe/Design/30_P10B6_LIVE_AUDIO_DASHBOARD_INTEGRATION.md) and [CODEX22](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/42e87ee65997ab130d9e647a6db4926e368e3c4d/Task/CODEX_22_P10B6_LIVE_AUDIO_DASHBOARD_INTEGRATION.md) control. Exact [PR24 SA R2](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/24#pullrequestreview-6040700877) base `574e6b45b9d0db275305b0466b7761cff939b268`, new isolated branch feature/v2-p10b6-live-audio targeting feature/v2-p10b5-dashboard-overlay. Reuse AudioManager/Director/Mixer, Overlay sole output, Dashboard hot settings and independent audio revision, default OFF/real gesture, no LIVE token, preserve Engine/ACK/readiness/visual settings/DEMO. Generic thanks and local idle speech subject to actual clip availability and permitted use; no real-name external TTS, no new provider/preflight phase. Actual Owner LIVE/Studio/listening remain pending; retain CODEX18/20/21 until dependencies and acceptance cleared. No merge. STOP P10B6_LIVE_AUDIO_SA_REVIEW_REQUIRED.

## P1.0-B7 — Viewer seating

> **CURRENT — OWNER P10B7 SEATING GO (2026-11-24):** **OWNER_P10B7_SEATING_GO / CODEX23_ACTIVE.** [Design31](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/19989591d0e0e2a60dda4de5630029730393aaa0/Design/31_P10B7_LIVE_VIEWER_SEATING.md), [CODEX23](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/f74001821a6c6f4d5703ff0858fa79c8dc0db454/Task/CODEX_23_P10B7_LIVE_VIEWER_SEATING.md) control. Exact PR25 R2 accepted base `7125814ddb5f7ff27caf423b9b322dafb26dfaa3`; new branch feature/v2-p10b7-live-seating targeting feature/v2-p10b6-live-audio. Member and text chat admission default ON, configurable expiry ON/OFF and duration, hot controls, stable identity, bounded waiting and safe donor priority. Keep 3 authoritative seats/9 decor; no new art, camera or provider redesign. Scope permits minimal Engine admission/expiry/registry changes only, preserves gift counting/FIFO/ACK and gTTS binding. No offline audio preview in this task. Prior acceptances and real-room/Studio/listening pending unchanged. Focused named-seat screenshot instead of historical six-shot art rerun; no merge. STOP P10B7_LIVE_SEATING_SA_REVIEW_REQUIRED.

## Proposed visual upgrade roadmap — B8 / B9 / C0 (2026-11-24)

**DESIGN_PROPOSED / OWNER_SCOPE_GO_PENDING / IMPLEMENTATION_HOLD.** Owner requested Design documents first for three consolidated visual workstreams. Engineering reference PR26 SA R2 exact `aecc8e5399cb869fe3de95d5a7b3f15972397216`. [Design 32](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/ba81f4214b6bd14869be5dc731258b3d446469b2/Design/32_P10B8_TREE_AND_LOTUS_WORLD_DENSITY.md), [Design 33](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/a48177b46c6dcaeb14eb662b48a77c32477182d7/Design/33_P10B9_ENVIRONMENT_RICHNESS_AND_FX.md), [Design 34](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/d387b2b83fb9930cdbd5ce914ddd625e349a6ac8/Design/34_P10C0_CINEMATIC_CAMERA_ROTATION.md). Sequence: B8 tree R18 + near/mid lotus density, B9 koi/distant environment/atmosphere, C0 actual automatic camera rotation and integrated benchmark. Separate art and code PRs; each predecessor SA+Owner gate before next activation, future base SHA pinned then. Three real seats retained; increased decorative density not capacity expansion. R17B and prior versions immutable. Proposed counts subject to actual GPU measurements. No runtime, Task or Rules mutation, no approval inferred, no merge. PR26 Owner LIVE pilot and outstanding acceptance remain unchanged.

## Owner visual roadmap GO — R18 art first

> **CURRENT — OWNER VISUAL ROADMAP GO / AI VISUAL17 ACTIVE (2026-11-24):** Owner replied “tiếp tục theo đề xuất và rules” to Design32–34 and recommendation to activate B8 art first. **OWNER_P10B8_SCOPE_GO / AI_VISUAL17_ACTIVE / P10B8_CODE_INTEGRATION_HOLD / P10B9_DEPENDENCY_HOLD / P10C0_DEPENDENCY_HOLD / MERGE_HOLD.** [Design32 Owner decision](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/24bf785484a94391d827f59ae622bcc136439999/Design/32_P10B8_TREE_AND_LOTUS_WORLD_DENSITY.md), [AI Visual17](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/9999135b53c1eba6366d70e18eb3fe05ef23a84f/Task/AI_VISUAL_17_P10B8_R18_TREE_POLISH.md). Only R18 tree art: exact accepted [PR18 SA R5](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6033463655) HEAD `07f57cb35ba3ec68184abbd2c173e29a3fcc4788`, new isolated asset branch assets/sakura-hero-r18-polish targeting assets/sakura-hero-r17-lush. R17B editable/GLBs immutable inputs, correct genuine branch/cluster attachment defects and gold material, preserve pink canopy, ECO/QUALITY, actual Blender/GLB and matched Cycles evidence, zero cost. STOP P10B8_ART_SA_REVIEW_REQUIRED then SA art/binary PASS and explicit Owner art GO; only then SA pins a separate Codex integration task for R18/lotus density/runtime lighting. Engineering reference PR26 R2 `aecc8e5399cb869fe3de95d5a7b3f15972397216` unchanged, existing Owner real LIVE/Studio/listening and hardware acceptance pending, no runtime edits or new seat capacity, no camera/fish/FX work now, no merge. B9/C0 designs approved in scope but not activated; predecessor acceptance and exact input pin required. Supersedes earlier design-proposed wording and obsolete art scheduling holds for this specific authorized art task only; all other Rules remain normative.

> **CURRENT — OWNER HIGH QUALITY / ART FIRST GO (2026-11-25):** [Design10](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/e3155f1dada6110fedddec00ba7d94073aab6188/Design/10_GRAPHICS_PROFILES.md), Design11/32/33/34 and [AI Visual17 §10](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/a360f519a966ace13bacc83316929e578b9fb4f2/Task/AI_VISUAL_17_P10B8_R18_TREE_POLISH.md) record project-wide high-quality editable master, ECO/QUALITY derivation and future opt-in HIGH QUALITY. Soft tree planning references 120k/500k/1M, not universal per-object caps or quotas; whole-scene measured performance and asset validity govern. Current R18a gold-only finalization on PR27 reviewed HEAD 631273440469b789bf7f1688bff30a35309de601 may exceed old +300/60k/250k/+5% numeric gates; preserve frozen R18 and non-gold structure, no unrelated art. No mandatory third export/gallery now. AI Visual17 stays active, B8 integration/B9/C0 HOLD, final SA and Owner art approval unchanged. Future runtime profile not implemented or enabled, hardware support pending. No merge.

## R18a Owner Art GO — CODEX24 active

> **CURRENT — OWNER R18a FINAL ART GO / CODEX24 ACTIVE (2026-11-25):** Owner explicitly approved R18a and SA-disclosed limitations, and authorized Codex integration, lighting and lotus density per Design32. **OWNER_R18A_FINAL_ART_GO / AI_VISUAL17_COMPLETE / CODEX24_ACTIVE / P10B8_RUNTIME_VISUAL_PENDING / P10B9_DEPENDENCY_HOLD / P10C0_DEPENDENCY_HOLD / MERGE_HOLD.** [SA Final PR27](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/27#pullrequestreview-6058734192) exact art HEAD `84f3a621d83fa7af5a4995b007446fec49287bf9`, [CODEX24](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/4abf0f51a4ecba007ce344211bb28da70014a4b2/Task/CODEX_24_P10B8_R18A_LIGHTING_LOTUS_DENSITY.md) from exact PR26 SA R2 `aecc8e5399cb869fe3de95d5a7b3f15972397216` on new feature/v2-p10b8-r18a-world-density targeting feature/v2-p10b7-live-seating. Only verified R18a ECO/QUALITY runtime integration, warm gold lighting and illustrative water reflection, lush deterministic lotus layout with approved assets, no new art. Preserve R17B/R16 fallback and default, three real seats/nine existing anonymous figures, all Engine/gift/ACK/gTTS/presence behavior, safe offline apply and Art First performance measurements. Future HIGH QUALITY runtime not activated. Prior GPU/LIVE evidence pending remains; no merge, public broadcast or B9/C0. STOP P10B8_WORLD_SA_REVIEW_REQUIRED then Owner world visual GO.

