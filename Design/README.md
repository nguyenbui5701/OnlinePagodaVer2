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
