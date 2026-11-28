# P1.0-B9 · Người xem LIVE và âm thanh nền

Baseline [PR #30](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/30) tại `22b036775d96fe75756b3290b4cb6e097ad635fc`. Ba ghế thật và chín vị trí trang trí dùng bố cục B9 đã duyệt.

## Chạy trên hai máy Windows

Dùng Node.js 24 và PowerShell. Chạy từ thư mục repo, tạo checkout riêng để giữ cấu hình bản đang dùng.

```powershell
git fetch origin feature/v2-p10b9-live-reliability
git worktree add --detach .p10b9-live-review origin/feature/v2-p10b9-live-reliability
Set-Location .p10b9-live-review
git rev-parse HEAD
Set-Location apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd run assets:p012b
npm.cmd run assets:p012d
npm.cmd run assets:r17b
npm.cmd run assets:r18a
npm.cmd run assets:b9
npm.cmd run build
npm.cmd run capture:p10b2
```

Ở PowerShell thứ hai, từ root của checkout mới, chạy Gateway.

```powershell
Set-Location packages/v2-live-gateway
npm.cmd ci
npm.cmd start
```

Gateway dùng cổng 5203 và Viewer dùng 5189 trên localhost. Dừng preview hoặc Gateway cũ nếu chúng đang giữ hai cổng này. Mở Dashboard và Overlay, chờ Overlay sẵn sàng rồi nhập username của phòng được phép thử. Bật Master Audio theo nhu cầu, bấm vùng cảnh Overlay một lần để mở âm thanh theo chính sách autoplay. Trong OBS hoặc LIVE Studio, giữ nguồn trình duyệt hoạt động khi đổi cảnh. Đóng hoặc hủy nguồn sẽ giải phóng quyền nhận và lần tải mới cần thao tác mở âm thanh. [Dashboard](http://127.0.0.1:5189/dashboard/) · [Overlay 720×1280](http://127.0.0.1:5189/overlay/)

## Đọc trạng thái Presence

- Worker đếm callback Member, Chat, Like, RoomUser và Gift trước khi lọc. Gateway hiển thị số đã nhận từ Worker, số định danh quan sát được trong phiên, số loại vì phòng/thời gian/schema/định danh/message, số dồn gói, trùng, throttled và áp lực IPC/hàng đợi. Gói có thể còn chờ ACK. Báo cáo Worker là ảnh chụp tích lũy theo chu kỳ, nên một Worker bị dừng đột ngột có thể chưa kịp gửi mẫu cuối.
- Số người do TikTok báo là số tổng. Số định danh quan sát được là những người có ít nhất một sự kiện đủ thông tin mà ứng dụng thấy, với bộ nhớ cố định. Seat và hàng chờ phản ánh Event Engine, còn số tên hiển thị đến từ lần vẽ thực tế. Người chỉ xem thụ động có thể xuất hiện trong số tổng dù Connector chưa nhận callback định danh.
- Member và Chat tiếp tục cấp ghế theo cấu hình. `Tự cấp ghế từ Like có định danh` mặc định tắt. Khi bật, chỉ Like có ID TikTok hợp lệ mới có thể cấp ghế, tối đa một xét duyệt cho mỗi ID trong 3 giây. Like tổng hợp vẫn cập nhật đếm tương tác. Hết hạn ghế dựa trên tương tác, không xác nhận người đó đã rời LIVE.
- Queue Gateway dành chỗ cho định danh mới khi có nhiều cập nhật lặp và giữ vùng dự phòng gift/session. Gói tràn được đếm. Nếu vùng dành cho gift final hết chỗ, Gateway báo lỗi giao nhận và kết thúc phiên theo cơ chế hiện có.

### Kết quả audit baseline

Connector 2.5.0 dùng protobuf v3. Kiểm thử encode/decode Like với ID `9223372036854775807` cho thấy trường `user.id` đi qua dạng chuỗi chính xác. Mapper từ chối Number vượt phạm vi an toàn, kiểm tra phòng, thời gian và `msgId`, đồng thời giữ `processInitialData: false`. Worker đếm riêng callback nhận trước khi có room ID. Một Like thiếu định danh vẫn đi theo đường đếm tổng hợp.

Trong phép thử áp lực, 230 Chat lặp đến trước một Member có ID mới. Baseline bỏ Member khi queue đạt 224, rồi dedup cả bản gửi lại sau khi ACK hết queue. Candidate tiếp nhận Member ở độ dài 193. Bản gửi lại sau khi đã giao bị dedup. Biên bản candidate khớp 232 đầu vào với 192 gói được xếp, 39 gói bị drop do áp lực và một bản trùng. Trong 193 entry đã ACK có một session open. [Log đối chiếu](evidence/p10b9-reliability/presence-pressure.stdout.txt)

Trên Edge native, baseline phát âm thanh khi Overlay ở foreground. PCM về 0 và Gateway báo MUTED sau khi Dashboard lên trước, dù AudioContext còn running. Candidate dùng Worker 100 ms và giữ lease 15 giây. Worker ghi nhận giao nhận đều đặn khi không còn rAF. [Trace baseline](evidence/p10b9-reliability/baseline-eco.json)

## Âm thanh và vòng đời nguồn

Overlay tiếp tục nhận, xử lý, ACK và cập nhật âm thanh trên đồng hồ Worker khi tab ngừng vẽ. Chuyển tab hoặc cửa sổ giữ nguyên trạng thái Master. Nếu AudioContext bị trình duyệt treo, Overlay thử phục hồi có giới hạn và Dashboard báo trạng thái cho phép thao tác lại trên Overlay. Master OFF, mất phiên, đóng trang và mất quyền Web Locks vẫn cắt tiếng. OS sleep hoặc trang bị browser freeze có thể tạm dừng mọi xử lý.

Gift đã xác nhận khi Overlay đang ẩn phát chime trung tính. Giọng tên theo camera yêu cầu đúng request, nhân vật và ghế đã thực sự lên hình, trong thời hạn focus. Gift trễ xử lý vẫn được ACK theo kết quả Event Engine. Cue quá hạn được bỏ qua để tránh phát lại khi trở về tab.

## Fixture và kiểm thử

Fixture dùng bản build, Chromium Edge native, các sự kiện giả lập có ID và tài nguyên âm thanh đã có. Nó ghi đầu ra PCM của bộ trộn, thu WebM/Opus từ cùng đầu ra, đo thời điểm cấp ghế và kiểm tra ACK trong lúc tab ẩn. Fixture không gọi TikTok hoặc gTTS. Việc thử phòng thật, nghe trên máy Owner và xác nhận vòng đời nguồn trên OBS/Studio vẫn cần biên bản riêng.

```powershell
# Từ packages/v2-live-gateway
npm.cmd test
# Từ packages/v2-events
npm.cmd ci
npm.cmd test
npm.cmd run build
# Từ packages/v2-voice
node --test
# Từ apps/v2-viewer, sau khi stage assets và cài dependency Gateway
npm.cmd test
npm.cmd run build
$env:V2_SOAK_PROFILE = 'eco'
node scripts/evidence-live-reliability.mjs
$env:V2_SOAK_PROFILE = 'quality'
node scripts/evidence-live-reliability.mjs
```

Fixture dùng cổng preview test 5196 và một cổng Gateway tạm, giữ nguyên Origin 5189 và Host 5203 khi gửi yêu cầu. Có thể đặt `V2_FIXTURE_VIEWER_PORT` nếu 5196 bận. Log và âm thanh ghi vào [thư mục bằng chứng](evidence/p10b9-reliability/).

Để tái hiện baseline âm thanh, tạo worktree detached ở SHA PR #30 nêu trên, stage và build Viewer trong worktree đó. Từ `apps/v2-viewer` của nhánh 26A, đặt `V2_PR30_APP` thành đường dẫn tuyệt đối đến `apps/v2-viewer` đã build của baseline, rồi chạy `node scripts/evidence-live-reliability.mjs --baseline`.

Fixture kiểm tra trạng thái hiển thị native của tab/cửa sổ, bỏ lệnh giả lập focus do Playwright mặc định gửi và xác nhận cửa sổ được minimize bằng CDP. Trong profile Edge tạm của fixture, cờ `CalculateNativeWinOcclusion` được tắt để loại ảnh hưởng của các tiến trình tự động hóa khác trên desktop. Các lần chạy ứng dụng và các file cấu hình triển khai dùng thiết lập trình duyệt bình thường.

## Biên bản SA

Execution SHA `76d26f863bfe04319c08f9475b890f65a56a0a0e`. 161 test qua gồm Gateway 27, Event Engine 22, Voice 8 và Viewer 104. Build Event Engine và Viewer exit 0. Các commit sau execution SHA bổ sung runner và bằng chứng. [Regression và build](evidence/p10b9-reliability/regression.log.txt)

| Edge native 158.0.4370.45 | ECO | QUALITY |
| --- | ---: | ---: |
| Soak đổi foreground/background | 305,207 giây | 305,135 giây |
| Khoảng từ sự kiện đến ACK dài nhất trong các đoạn soak | 607 ms | 604 ms |
| Ba lượt từ callback định danh đến ghế + ACK | 355 / 569 / 605 ms | 288 / 533 / 572 ms |
| Member thứ tư hiện trong danh sách chờ | 608 ms | 605 ms |
| Chuông quà không gắn ghế được ghi nhận | 11 | 11 |
| RMS nhỏ nhất tại các điểm đo hidden trong soak | 0,000894 | 0,000654 |
| WebM giải mã bằng FFmpeg | 331,44 giây | 333,18 giây |

Join-to-seat với ghế trống đạt p50 533 ms, p95 605 ms theo nearest rank trên 6 lượt giả lập. QUALITY đối soát đủ 32 callback qua Worker/Gateway và 34 entry đã xử lý và ACK, gồm cả session open/close. ECO ngắn đối soát 7 callback và 9 entry, ECO dài có ACK đến entry 32 trong soak. Không thấy thất thoát nội bộ trong workload đối soát. Trường hợp overload có lý do và số drop riêng trong bài test áp lực. [Kiểm tra PCM và đối soát](evidence/p10b9-reliability/pcm-verification.json)

Cả hai profile đo PCM khác 0 khi chuyển Dashboard, tab khác, cửa sổ riêng và khi minimize. Master OFF và disconnect đưa PCM về 0. Master ON khôi phục được sau thao tác mở âm thanh ban đầu. Web Audio báo trạng thái suspended và trở lại running, có tín hiệu PCM. Giọng cảm ơn quay lại với Gift Camera khi Overlay đã hiện, và quà đã nhận khi ẩn không bị phát lại. Native smoke WebGL 720×1280 xác nhận R18a, lotus lush và cảnh quan B9 hoạt động. [ECO WebM](evidence/p10b9-reliability/eco-output.webm) · [QUALITY WebM](evidence/p10b9-reliability/quality-output.webm) · [ECO WebGL](evidence/p10b9-reliability/eco-overlay.png) · [QUALITY WebGL](evidence/p10b9-reliability/quality-overlay.png)

Lượt ECO dài hoàn thành soak, thu âm và đo im lặng sau disconnect. CDP đóng target khi runner tạo tab mới sau đó, nên bằng chứng ECO về mở lại Overlay và thao tác mở tiếng lấy từ một lượt native ngắn độc lập trên cùng runtime. Lượt QUALITY hoàn thành toàn bộ. Hai lượt automation chạy song song trước đó cũng dừng sớm khi CDP đóng target. [ECO raw](evidence/p10b9-reliability/eco.stdout.log.txt) · [ECO lỗi mở lại](evidence/p10b9-reliability/eco-reopen.stderr.log.txt) · [ECO vòng đời riêng](evidence/p10b9-reliability/eco-lifecycle.json) · [QUALITY raw](evidence/p10b9-reliability/quality.json)

Xác nhận với phòng TikTok do Owner kiểm soát, nghe trên hai máy Owner và kiểm tra vòng đời nguồn trong OBS/Studio vẫn chờ biên bản thực tế. Chi phí triển khai và kiểm thử 0 VND.

**STOP `P10B9_LIVE_RELIABILITY_SA_REVIEW_REQUIRED`.**
