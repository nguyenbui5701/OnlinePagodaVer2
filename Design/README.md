# OnlinePagodaVer2 — Design index

**Status:** DRAFT — chờ owner duyệt. **Nguồn chuẩn hình ảnh:** `chuav2.mp4` do owner cung cấp, 46.87 s, 720×1556, 30 fps. **Ưu tiên:** làm giống video nhất có thể về thế giới 3D, bố cục, ánh sáng, camera, avatar và tương tác, không sao chép UI TikTok.

## Quy tắc quan trọng
1. **VIDEO FIRST:** video là visual ground truth; V1 không quyết định kiến trúc đồ họa của V2.
2. **REUSE SELECTIVELY:** V1 chỉ dùng các phần đã xác minh hợp lý: TikTok connector, normalization, demo/connection, các hợp đồng live và kiểm thử liên quan. Không bê nguyên scene/camera/ritual V1.
3. **DESIGN BEFORE TASK:** chỉ thay đổi `Design/**` trong giai đoạn này, chưa tạo `Task/` khi owner chưa duyệt.
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
