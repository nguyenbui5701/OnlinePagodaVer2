# P1.0-B2 — TikTok LIVE Gateway

`P10B2_REAL_GATEWAY_SA_REVIEW_REQUIRED`

Base PR #22 `b529010956420946447e652b1bcf922d7f8dbd16`. Gateway dùng `tiktok-live-connector@2.5.0`, lockfile ghim chính xác tarball của V1. Worker riêng giữ các tùy chọn V1: không batch lịch sử, không xác thực WebSocket bằng phiên TikTok, không mobile, timeout kết nối hữu hạn. Tiến trình worker chỉ nhận tên kênh đã kiểm tra từ gateway. Nó gọi TikTok và dịch vụ ký mặc định của connector. [V1 được tham chiếu](https://github.com/nguyenbui5701/OnlinePagoda/tree/9ffa2718723b11284dccdf35595c759576672f93/apps/server/src/tiktok) · [LICENSE Connector 2.5.0](https://github.com/zerodytrash/TikTok-Live-Connector/blob/v2.5.0/LICENSE)

## Cài đặt và build lần đầu trên Windows

Từ root branch `feature/v2-p10b2-real-event-gateway`, với Node 24 và Git:

```powershell
Set-Location packages/v2-events
npm.cmd ci --ignore-scripts --no-fund --no-audit
npm.cmd run build
Set-Location ../../apps/v2-viewer
npm.cmd ci --ignore-scripts --no-fund --no-audit
npm.cmd run assets:p08
npm.cmd run assets:p012b
npm.cmd run assets:p012d
npm.cmd run assets:r17b
npm.cmd run build
npm.cmd run capture:p10b2
```

Giữ terminal Viewer ở cổng 5189. Mở terminal thứ hai tại root và chạy gateway ở cổng 5203.

```powershell
Set-Location packages/v2-live-gateway
npm.cmd ci --ignore-scripts --no-fund --no-audit

npm.cmd start
```

## Worktree đã cài

Dừng hai tiến trình cũ rồi chạy `git pull --ff-only` từ root worktree đang ở branch `feature/v2-p10b2-real-event-gateway`. Trong `apps/v2-viewer`, chạy `npm.cmd run build` rồi `npm.cmd run capture:p10b2`. Trong tab PowerShell thứ hai, chạy `npm.cmd start` từ `packages/v2-live-gateway`. Có thể dùng lại các dependency và asset đã stage từ PR #23.

[Mở Viewer LIVE ECO 720×1280](http://127.0.0.1:5189/?source=live&profile=eco&clean=1&seed=9&look=twilight&tree=r17b&botanicals=on&diversity=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero&blessing=on).

1. Dùng đúng địa chỉ `127.0.0.1`. Cuộn xuống dưới cảnh 3D để mở bảng điều khiển. Nhập username của phòng đang LIVE mà bạn được phép truy cập. Bấm **Connect**.
2. **CONNECTING** là đang thử kết nối. **CONNECTED_NO_EVENTS** là provider báo kết nối nhưng chưa nhận gói hợp lệ. **EVENTS_VERIFIED** là đã nhận ít nhất một gói được mapper xác nhận. Các bộ đếm trên bảng điều khiển là số gói hợp lệ theo loại, còn tổng quà trong Engine dùng số lượng gift final.
3. Bấm **Disconnect** để dừng nhận. Trong pilot, giữ một tab điều khiển và một receiver cho phòng. Gateway đóng worker khi mất poll từ tab điều khiển quá 15 giây. Nếu liên kết cục bộ đã mất, tải lại trang sau khi phiên cũ kết thúc. Nếu cổng đã được dùng, dừng tiến trình cũ do bạn khởi động hoặc dùng lại đúng preview.
4. `ROOM_OFFLINE`, `ACCESS_DENIED`, `PAID_ROUTE`, `RATE_LIMITED` và `SIGNING_FAILED` được báo riêng. Rate limit dừng các lần kết nối trong tiến trình hiện tại. Chờ hết giới hạn của provider trước khi khởi động lại. Lỗi mạng tạm thời thử lại tối đa hai lần. `DEGRADED` báo khi gateway không thể ánh xạ hoặc giao một gift final. Cảnh vẫn do Engine điều khiển.

Gateway chỉ lắng nghe tại 127.0.0.1:5203 và chỉ chấp nhận đúng Host cùng Origin http://127.0.0.1:5189. Dùng trên máy cục bộ tin cậy. Tiến trình khác trên cùng máy có thể giả mạo yêu cầu cục bộ. Viewer tự tạo client ID để giữ quyền điều khiển một tab và theo dõi ACK theo phiên. Backend chỉ giữ bộ đệm hữu hạn trong RAM, ưu tiên gift final và kết thúc phiên với trạng thái lỗi khi hết dung lượng cho final. Event Engine 0.2.0 tiếp tục sở hữu 3 ghế thật, gift FIFO và camera focus. Chat không cấp ghế, member mặc định OFF. Provider gift ID giữ nguyên dạng số, dùng hiển thị quà trung tính của Viewer. Pilot LIVE tắt AudioManager cho nguồn này. DEMO giữ đường âm thanh riêng ở baseline.

## Kiểm thử

- `npm.cmd test` trong `packages/v2-live-gateway`, `packages/v2-events` và `apps/v2-viewer`.
- Từ root, `node --test packages/v2-voice/worker.test.mjs`.
- Với Viewer đang chạy tại cổng 5189 và cổng 5203 còn trống, chạy `node scripts/evidence-live-gateway.mjs` từ `apps/v2-viewer`. Runner dùng browser Edge, gateway HTTP thật và provider fixture chỉ trong test. Chỉ số và ảnh WebGL 720×1280 lưu tại `evidence/` của package này. Test worker riêng nạp đúng connector đã cài và kiểm tra IPC khởi động.

Chưa có username phòng đang hoạt động được chỉ định để Codex kiểm thử. Bằng chứng hiện tại kiểm tra đường truyền cục bộ và fixture qua Viewer, chưa có lần gọi provider, entitlement thực tế, sự kiện LIVE thật hoặc Studio capture. Kiểm tra đoạn này trên phòng được phép theo bước Connect ở trên. Không cần phát công khai để kiểm thử giao diện hoặc mua quà để kiểm thử.
## Kết quả SA

106 tests PASS gồm 79 Viewer, 12 Event Engine, 8 voice worker và 7 gateway. Cả hai build Viewer và Engine PASS. Baseline CLI gateway đã khởi động và kiểm tra ranh giới loopback. Test worker riêng xác nhận connector đã nạp và gửi thông báo IPC sẵn sàng.

Bản build Viewer chạy trong Edge, với gateway HTTP cục bộ và fixture được tiêm từ runner. Các checkpoint xác nhận OFFLINE, CONNECTED_NO_EVENTS, EVENTS_VERIFIED, focus đúng seat-1 và Disconnect. Fixture có chat, member, like, room, gift progress, bốn gift final và một final lặp. Engine ghi bốn quà, ba ghế, và số người xem 16. [Biên bản browser](evidence/browser.json) · [Ảnh WebGL 720×1280](evidence/fixture-focus.png)
## SA R1 — P1-01

Viewer gửi ACK theo sequence liên tục đã được Engine xử lý. Poll lặp trong lúc render tạm dừng chỉ thấy lại batch đang chờ (tối đa 48 gói). Reconnect giữ cursor và cờ lỗi của cùng phiên giao nhận. Gift final bị từ chối hoặc Engine chạm giới hạn phiên chặn ACK tại sequence lỗi và được báo cho gateway. Khi đóng Viewer hoặc lease hết hạn, gateway đánh dấu gift final chưa có ACK là chưa xác minh giao nhận. Cảnh báo được giữ trong tiến trình gateway để hiển thị ở lần kết nối sau.

**113 tests PASS** (83 Viewer, 12 Event Engine, 8 voice worker, 10 gateway). Viewer và Engine build PASS. Fixture trên Edge ghi ACK 5 trong ba poll khi render dừng; sau một poll bị ngắt và render tiếp tục, ACK lên 10, Engine xác nhận đúng 4 quà. Khi đóng Viewer với sequence 11 còn chờ, ACK giữ ở 10 và gateway ghi nhận giao nhận chưa xác minh. [Biên bản R1](evidence/delivery-r1.json)

Chạy lại từ Viewer đã build bằng `node scripts/evidence-live-gateway.mjs --delivery-r1` khi preview 5189 đang chạy và cổng 5203 còn trống. Bằng chứng PR23 ban đầu giữ nguyên.
## Kiểm chứng luồng chỉ nhập username

113 tests và hai build PASS. Lệnh npm.cmd start khởi động gateway tại 127.0.0.1:5203, preflight hợp lệ trả 204. Test HTTP xác nhận từ chối Host/Origin sai, giới hạn một tab và chấp nhận poll sau khi đồng hồ mô phỏng vượt mốc tám giờ.

Bản build Viewer trong Edge kết nối fixture chỉ với username. Ba poll lúc dừng render giữ ACK ở 5. Sau một poll bị ngắt và render tiếp tục, ACK lên 10, Engine ghi đúng bốn quà. Đóng Viewer khi gói 11 còn chờ giữ cảnh báo giao nhận chưa xác minh. Runner dùng preview tĩnh riêng ở cổng 5191 và giữ Origin của Viewer ở cổng 5189 trong trình duyệt. [Biên bản token-free](evidence/token-free.json)
