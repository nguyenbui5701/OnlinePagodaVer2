# CODEX 26 · Chuẩn bị tuyến camera cinematic QUALITY

Candidate PR #31 `610b8c738c5925b722b028de7067fedcfaaafd06`. Đã đối chiếu HEAD trên remote và merge-base với PR #30 `22b036775d96fe75756b3290b4cb6e097ad635fc`. Worktree quan sát detached từ đúng candidate. Nhánh dành cho implementation là `feature/v2-p10c0-cinematic-rotation`, target `feature/v2-p10b9-live-reliability`. Remote chưa có nhánh C0 tại thời điểm kiểm tra. [Rules](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/345afbe209bf0fc8404be7f280bf68475fc835d0/Design/07_WORK_RULES.md) · [Design 34](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/345afbe209bf0fc8404be7f280bf68475fc835d0/Design/34_P10C0_CINEMATIC_CAMERA_ROTATION.md) · [CODEX 26 §9](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/345afbe209bf0fc8404be7f280bf68475fc835d0/Task/CODEX_26_P10C0_CINEMATIC_CAMERA_ROTATION.md#9-current-controlling-c0-preparation-contract--quality-only-2026-11-28)

## Quan sát baseline

Build Viewer từ source detached thành công. Quan sát bằng Edge native/WebGL, Intel UHD, 720×1280, seed 9. Thiết lập gửi qua Gateway là QUALITY / R18a / Gold / lush / B9 On / rings / rich / hero. Báo cáo Overlay xác nhận R18a nạp đúng SHA, lush và B9 thực chạy. Không tìm thấy `chuav2.mp4` trong repo hoặc cây workspace đã tra cứu. Sáu bố cục đề xuất bám ý đồ Design 34 và dữ liệu cảnh hiện có.

- **Offline**: `/overlay/` đã attach nhưng provider chưa chạy. 220 mẫu từ 1,968 đến 42,002 giây có đủ năm nhãn hero. Cả XYZ, hướng nhìn và FOV đều thay đổi. Tái dựng pose từ `createHeroRoutes` với clock rAF làm tròn đến mili giây khớp toàn bộ mẫu. Hiện tượng đứng một góc **NOT_REPRODUCED** trong fixture foreground này.
- **Synthetic LIVE**: Connect qua Dashboard, fixture cấp ba ghế cho A/B/C. Reload Dashboard vẫn chỉ có một phiên worker được khởi động. Ba Gift Final đi qua Mapper/Gateway, ACK **7/7** gồm session open, ba Member và ba Gift Final. Overlay render focus A → B → C, đúng seat-1/2/3 và có ba cue giọng cảm ơn generic với ghế tương ứng. Trace có cả `CINE_RETURN` và lần đầu quay về `CINEMATIC`.
- **Return hiện tại**: Quà được gửi khi render ở **52,092 s / COMMUNITY**. Khi trở về lúc **71,286 s**, XYZ/target/FOV thực khớp tuyến hero tại **42,672 s / HERO_WIDE_TREE_REFLECTION**, sai số dưới 1e-5; chênh **28,614 s** so với render clock. Giá trị routeTime này được suy ra từ pose, vì baseline chỉ xuất elapsed/shot/cycle. Việc quay lại vùng mở đầu là hành vi có bằng chứng, chưa giải thích lần Owner thấy đứng một góc.
- **Phạm vi bằng chứng**: Fixture được điều khiển foreground bởi Playwright. Dữ liệu synthetic xác minh camera và binding cue trong phiên này. Kết quả QUALITY nền thông thường, lease, PCM và Master OFF/ON vẫn tham chiếu biên bản PR #31 R2. Các mốc FPS trong trace là thống kê render của máy Intel lúc quan sát. Nghiệm thu OBS/Studio, RTX, phòng thật, nghe âm thanh Owner và chính sách chuông khi ẩn đang chờ.

[Trace gốc](native-baseline/camera.jsonl) · [Tổng hợp pose](native-summary.json) · [Cảnh và hash thực nạp](native-baseline/loaded-scene.json) · [Top Ring baseline](native-baseline/offline-HERO_TOP_RING.png) · [Gift C](native-baseline/gift-C.png) · [Sau return](native-baseline/synthetic-return.png) · [Audio marks](native-baseline/audio-marks.json)

## Audit source và phương án tích hợp

| Thành phần | Baseline đã kiểm tra | Chuẩn bị cho implementation |
| --- | --- | --- |
| `camera.ts` | Bốn tuyến legacy 40 s, chọn seed/đổi hướng theo vòng. Catmull-Rom kín cho vị trí, khoảng nhìn và FOV, quaternion cho hướng nhìn. Lọc ở 60 Hz bằng bán kính theo dải cao độ, khoảng nhìn, FOV và delta. | Giữ sampler và logic rollback. Số đo legacy dùng làm giới hạn tham khảo. |
| `hero-camera.ts` | Hai tuyến gương 40 s, Catmull-Rom kín cho eye/target/lens. Nhãn lấy theo mốc 0/9/16/26/33 s, độc lập chuyển động. Trả `rejected: []` cố định. | Module route C0 riêng với duration 68 s và mốc thời gian thực cho từng spline. Đánh giá khe nối giữa hai hướng và giữa hai vòng. |
| `slice-camera.ts` | `routeSeconds` gắn cứng với 40 s, reset về `floor(clock/40)*40 + 1.2` khi mất focus. `move` blend XYZ/target/FOV từ pose đã xuất bằng quintic, 1.050 ms khi vào gift, 1.450 ms khi return. Blend tuyến tính tọa độ đích chưa kiểm hình học. | Chỉ thay policy cho C0. Lưu phase ngay khi enter gift từ cinematic, giữ phase xuyên qua các donor. Sau kết thúc queue, blend từ pose đã render cuối đến phase lưu, cho tuyến đích tiến trong return và ghép tiếp tuyến tại điểm kết thúc. Gift đến trong return dùng pose hiện thời và phase đang tái nối. Giữ thời lượng scheduler; nếu một pose hoặc blend không an toàn, đổi hành lang hoặc loại tuyến candidate. |
| `main.ts` / Worker / receiver | `advanceLive` gọi Driver, AudioManager và poll/ACK. Render lấy `livePresentation` gần nhất và tính visual time từ rAF. Sau WebGL render thành công, `shownFocus` được xác nhận ở `GIFT_FOCUS` khi visible, dựa trên request/actor/seat. Hidden, WebGL loss, draw cũ và khoảng freeze có guard riêng. | Route phase chỉ do lớp camera tiêu thụ. Không tick lại Engine, ACK hay AudioManager ở render. Dồn phase theo elapsed visible, giữ phase tại gap lớn hoặc WebGL loss, rồi nối từ pose cuối sau khi có render và snapshot hợp lệ. Theo dõi render clock và worker tick riêng. Giữ semantics shownFocus, AudioManager, poll và lease 15 s. |
| Engine / ghế / nameplate | Scheduler giữ một active và hàng FIFO, dedup/cộng Gift Final và reserve actor; Driver lấy actor từ snapshot hợp lệ. `seatPose` dùng head, origin, hướng thật của ghế. Nameplate chiếu anchor và kiểm che bởi cây. | Giữ quyền của Engine và projections. Tuyến mới phải nhường cho A → B → C, quà trong return, no-seat và mất/reconnect session. Giọng có tên chỉ khi render trả đúng request/actor/seat. |
| `twilight.ts` / B9 layout | Look Gold là trọng số cố định. Twilight động đọc routeTime modulo 40. B9 sinh bố cục bằng 534 mẫu x 0,3 s của tuyến đang chọn, lọc y < 2,3. Hero seed 9 lấy 0 mẫu thấp. | Với C0, giữ clock appearance legacy cho look động, tách khỏi phase 68 s. Tạo danh sách loại vùng trồng theo sampler hero được duyệt, giữ layout seed và các khóa instance. Clearance của tuyến thấp dùng bố cục đã sinh. So sánh ID, transform, tone và số lượng giữa hero và C0. |
| Dashboard / Overlay / settings | `shots` allowlist `hero/default`, mặc định `hero`. Dashboard ghi desired revision. Apply chỉ khi offline và queue cạn, Overlay tự tải lại. `overlay-entry` đặt query qua settings; `inspect/time/view` có đường review riêng. | Thêm opt-in `shots=cinematic` cho QUALITY vào allowlist/type và render chọn tuyến. Giữ migration lịch sử và revision. Chặn lưu tổ hợp cinematic ngoài QUALITY; query sai rơi về hero với lý do trong diagnostics. Dùng Save + Apply offline hiện có. Báo rõ requested/effective và fallback trong diagnostic giới hạn kích thước; Overlay sạch 9:16. Hoãn hot toggle, speed selector, manual lock và endpoint mới. |

Nguồn chính nằm trong `apps/v2-viewer/src/{camera,hero-camera,slice-camera,main,slice-driver,seat-scene,nameplates,twilight,lotus-density,pond-environment,live-settings,dashboard,overlay-entry,live-receiver}.ts`, `packages/v2-events/src/focus.ts` và `packages/v2-live-gateway/{gateway,server}.mjs`.

## Tuyến đề xuất 68 giây

Tất cả khoảng dưới đây tính cả blend. Eye/aim/FOV dẫn liên tục theo thời gian, ít nhất C1 ở nút và seam, với acceleration được kiểm qua các nút. Dùng seed để lặp lại biến thể. Hai hướng chỉ được bật nếu cùng đạt clearance và cùng khớp pose/đạo hàm ở điểm nối. Đặt các điểm dựa trên cảnh đã nạp, rồi tune bố cục bằng 9:16.

| Giây | Góc | Điều cần thấy và anchor |
| --- | --- | --- |
| 0–12 | **HERO_WIDE** | Trục mở trên hồ phía trước. Hướng nhìn gối thân và tán R18a, thấy dải phản chiếu và đường chân trời. Quét ngang nhẹ để thấy parallax. |
| 12–24 | **COMMUNITY** | Hạ đến phía ngoài các cụm ghế, aim giữa ba vị trí thật. Dành vùng biên an toàn cho nameplate. Giữ cây làm mốc và không đưa camera qua ghế. |
| 24–34 | **LOW_WATER_KOI** | Quét ngang thấp theo hành lang nước giữa các cụm sen. Điểm nhìn trên nước; aim giao vùng koi theo quỹ đạo B9 và còn dải vàng trên mặt nước. |
| 34–46 | **AERIAL_RING** | Nâng cao dọc khoảng nước đã kiểm, góc xiên đọc được các vòng/cụm sen và phân biệt ghế thật. Giữ roll bằng 0 và tránh góc nhìn thẳng đứng suy biến. |
| 46–56 | **UNDER_TREE_GOLD** | Từ ngoài tán, đi theo khe giữa rìa cành và gốc. Aim thân và tán từng lớp để thấy vân vàng, kiểm thân/cành/cụm hoa trước khi hạ. |
| 56–68 | **FAR_ATMOSPHERE** | Quét ngang rộng có đường chân trời và ba lớp terrain B9, thấy parallax với thân cây. Hành lang cuối gặp tiếp tuyến của HERO_WIDE. |

Đề xuất bắt đầu ở eye ≤8 m cảnh/s, gia tốc ≤6 m cảnh/s², góc nhìn ≤0,27 rad/s, target ≤6 m cảnh/s, FOV 40–64° và tốc độ FOV ≤3°/s cho tuyến idle gồm seam. Đây là ngưỡng thiết kế ban đầu từ route hero 60 Hz đo được 6,25 m cảnh/s, 3,69 m cảnh/s², 0,177 rad/s, target 3,76 m cảnh/s và 2,19°/s, đối chiếu giới hạn legacy 13,2 m cảnh/s, 1,5 rad/s, target 18 m cảnh/s và 6°/s. Gift/return cần đối chiếu riêng cùng workload và giới hạn thời lượng hiện hành; động học của tuyến idle không được áp trực tiếp vào một cú đổi phối cảnh gift. Nếu cần, dời điểm quay hoặc giảm tầm sweep trước khi xin thay đổi ngưỡng.

## Clearance dựa trên geometry

- Dùng đúng GLB QUALITY có hash đã pin. Phép đo đọc bằng GLTFLoader và cập nhật `matrixWorld`. R18a có bounds khoảng `[-14,179, -0,518, -13,425] → [14,490, 26,480, 14,411]` và 26 mesh boxes. R17B có cùng vertex bounds tổng nhưng 23 mesh boxes; R16 còn 11 và footprint hẹp hơn. Terrain có 30 mesh boxes, ba lớp. Sample hai vòng hero ở 60 Hz cho cận dưới eye–mesh-AABB **20,025** với R18a và **26,161** với terrain. Camera hero thấp nhất **y = 8,751**, không đại diện cho tuyến thấp, Gift Camera hay C0. [Bounds, SHA và số đo](geometry-baseline.json)
- Lấy B9 scene đã attach làm đầu vào: 12 slots gồm ba ghế thật, lush seed 9 gồm 52 pad, 120 leaf, 56 bloom, 40 bud ngoài layout ghế. Từ mesh đã áp transform lấy collider per mesh hoặc instance cho canopy/trunk, terrain, pad/hoa/nụ, ghế, avatar và envelope idle. Dùng chung hình học với bounds khác theo world transform mỗi instance. Dùng mặt nước thật y=0 và baseline floor eye y≥0,8 làm mốc chuẩn bị. Xác nhận mesh rễ đi qua nước và B9 terrain có thể nằm dưới mặt nước; một AABB chung cho mọi mesh sẽ loại nhầm hành lang.
- Broad phase theo mesh AABB/BVH. Narrow phase sweep capsule theo đoạn spline, kiểm khoảng cách tới triangle hai mặt và containment. Gồm near plane theo FOV/aspect, near=0,05, bán kính bao từ eye tối đa 0,0616 ở 64°; margin khởi điểm 0,10, bán kính test 0,17. Chia adaptively cubic cho sai số dây cung ≤0,025, cộng phần sai số chưa giải vào biên sweep. Kiểm luôn khe nối gương, hành lang từ sáu vùng cắt sang mỗi gift seat, handoff donor kế tiếp, interruption và return. `p08Review.treeCollisions` hiện ray test đường tâm có ích làm đối chiếu; nghiệm thu cần thể tích sweep và nhiều nhóm geometry hơn.
- Tách collision từ visibility. Với mỗi ảnh proof, projection thật kiểm clip/che của trunk, canopy, koi, nameplate và botanicals. Actor phải còn thẩm quyền ghế. Low water dùng đường nước trống sau khi layout đã sinh, ưu tiên sửa path. Khi thiếu koi/terrain hoặc fallback GLB, đo lại trên phiên bản QUALITY thực nạp. Nếu mất một lớp bố cục, ghi rõ fallback; khi route không an toàn, chọn hero hoặc route rollback đã kiểm và báo nguyên nhân.

## Trình tự khi có implementation GO

1. SA chốt parent sau phản hồi PR #31 của Owner, xác minh lại remote và nhánh dự kiến. Tạo worktree/branch riêng chỉ sau gate. Commit sampler/clock và adapter legacy trước, tiếp theo clearance, Dashboard opt-in và diagnostics. Trace mới cần raw routeTime, mode/hold reason, requested/effective, bounds/route fallback, XYZ/aim/FOV và frame/worker tick.
2. Test quyết định trên seed 9/71/1337; sample duration/param, seam, derivative/acceleration, target/FOV, fallback R18a/R17B/R16, geometry, unchanged instance IDs, hidden/context recovery và setting/migration. Đối chiếu gift A/B/C, một gift đến trong return, gift không ghế, no stale replay, hold/recovery, ACK prefix và Dashboard reload/close giữa phiên. Chạy test dùng chung và build. 168 test và hai build của PR #31 là biên bản predecessor; đợt này chỉ build Viewer cho quan sát.
3. Native QUALITY 720×1280, hai vòng no-gift tối thiểu 136 s, đủ sáu ảnh bố cục và clip chuyển động ghi kèm camera trace. Có lượt offline, synthetic ACTIVE và gift/return với ảnh full Overlay gồm nameplates. Đo A/B PR #31 ↔ C0 cùng setting/seed/workload, giữ bounds/asset hash, frame p50/p95/p99, draw calls, triangles, heap và context loss. Đo tiếp 30+ phút với OBS/Studio và RTX trên máy Owner sau gate riêng; dùng ~30 FPS làm mục tiêu thực đo.

Chạy lại quan sát từ thư mục hồ sơ bằng Node 24. Worktree `baseline-610b8c7` có Viewer đã build và thư mục asset staged; hai cổng 5189/5203 cần trống. Các lệnh này chạy fixture local và phân tích bằng chứng.

```powershell
node observe-baseline.mjs
node summarize-baseline.mjs
node geometry-baseline.mjs
```

Runtime và frozen PR #31 giữ nguyên. Owner verification và quyền triển khai C0 tiếp tục chờ. Chi phí **0 VND**.

**STOP `P10C0_PREPARATION_READY`.**
