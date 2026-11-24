# P1.0-B2 — TikTok LIVE Gateway

`P10B2_REAL_GATEWAY_SA_REVIEW_REQUIRED`

Base PR #22 `b529010956420946447e652b1bcf922d7f8dbd16`. Gateway dùng `tiktok-live-connector@2.5.0`, lockfile ghim chính xác tarball của V1. Worker riêng giữ các tùy chọn V1: không batch lịch sử, không xác thực WebSocket bằng phiên TikTok, không mobile, timeout kết nối hữu hạn. Tiến trình worker chỉ nhận tên kênh đã kiểm tra từ gateway. Nó gọi TikTok và dịch vụ ký mặc định của connector. [V1 được tham chiếu](https://github.com/nguyenbui5701/OnlinePagoda/tree/9ffa2718723b11284dccdf35595c759576672f93/apps/server/src/tiktok) · [LICENSE Connector 2.5.0](https://github.com/zerodytrash/TikTok-Live-Connector/blob/v2.5.0/LICENSE)

## Build trên Windows

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

Giữ terminal Viewer ở cổng 5189. Mở terminal thứ hai tại root, tạo mã phiên cục bộ và chạy gateway ở cổng 5203. Lệnh này dùng trên Windows PowerShell 5.1 và PowerShell 7.

```powershell
Set-Location packages/v2-live-gateway
npm.cmd ci --ignore-scripts --no-fund --no-audit
$pagodaLiveKey = New-Object byte[] 32
$pagodaLiveRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$pagodaLiveRng.GetBytes($pagodaLiveKey)
$pagodaLiveRng.Dispose()
$env:V2_LIVE_TOKEN = [BitConverter]::ToString($pagodaLiveKey).Replace('-', '').ToLowerInvariant()
Set-Clipboard -Value $env:V2_LIVE_TOKEN
npm.cmd start
```

[Mở Viewer LIVE ECO 720×1280](http://127.0.0.1:5189/?source=live&profile=eco&clean=1&seed=9&look=twilight&tree=r17b&botanicals=on&diversity=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero&blessing=on).

1. Dùng đúng địa chỉ `127.0.0.1`. Cuộn xuống dưới cảnh 3D để mở bảng điều khiển. Nhập username của phòng đang LIVE mà bạn được phép truy cập. Dán mã gateway từ clipboard vào ô mật khẩu và bấm **Connect**. Xóa clipboard sau khi dán.
2. **CONNECTING** là đang thử kết nối. **CONNECTED_NO_EVENTS** là provider báo kết nối nhưng chưa nhận gói hợp lệ. **EVENTS_VERIFIED** là đã nhận ít nhất một gói được mapper xác nhận. Các bộ đếm trên bảng điều khiển là số gói hợp lệ theo loại, còn tổng quà trong Engine dùng số lượng gift final.
3. Bấm **Disconnect** để dừng nhận. Trong pilot, giữ một tab điều khiển và một receiver cho phòng. Gateway đóng worker khi mất poll từ tab điều khiển quá 15 giây. Mã phiên hết hạn sau tám giờ. Nếu liên kết cục bộ đã mất, tải lại trang sau khi phiên cũ kết thúc. Nếu cổng đã được dùng, dừng tiến trình cũ do bạn khởi động hoặc dùng lại đúng preview.
4. `ROOM_OFFLINE`, `ACCESS_DENIED`, `PAID_ROUTE`, `RATE_LIMITED` và `SIGNING_FAILED` được báo riêng. Rate limit dừng các lần kết nối trong tiến trình hiện tại. Chờ hết giới hạn của provider trước khi khởi động lại. Lỗi mạng tạm thời thử lại tối đa hai lần. `DEGRADED` báo khi gateway không thể ánh xạ hoặc giao một gift final. Cảnh vẫn do Engine điều khiển.

Gateway xác thực mã phiên qua header, kiểm tra Host/Origin chính xác và giữ một con trỏ giao gói cho tab đang điều khiển. Backend chỉ giữ bộ đệm hữu hạn trong RAM, ưu tiên gift final và kết thúc phiên với trạng thái lỗi khi hết dung lượng cho final. Event Engine 0.2.0 tiếp tục sở hữu 3 ghế thật, gift FIFO và camera focus. Chat không cấp ghế, member mặc định OFF. Provider gift ID giữ nguyên dạng số, dùng hiển thị quà trung tính của Viewer. Pilot LIVE tắt AudioManager cho nguồn này. DEMO giữ đường âm thanh riêng ở baseline.

## Kiểm thử

- `npm.cmd test` trong `packages/v2-live-gateway`, `packages/v2-events` và `apps/v2-viewer`.
- Từ root, `node --test packages/v2-voice/worker.test.mjs`.
- Với Viewer đang chạy tại cổng 5189 và cổng 5203 còn trống, chạy `node scripts/evidence-live-gateway.mjs` từ `apps/v2-viewer`. Runner dùng browser Edge, gateway HTTP thật và provider fixture chỉ trong test. Chỉ số và ảnh WebGL 720×1280 lưu tại `evidence/` của package này. Test worker riêng nạp đúng connector đã cài và kiểm tra IPC khởi động.

Chưa có username phòng đang hoạt động được chỉ định để Codex kiểm thử. Bằng chứng hiện tại kiểm tra đường truyền cục bộ và fixture qua Viewer, chưa có lần gọi provider, entitlement thực tế, sự kiện LIVE thật hoặc Studio capture. Kiểm tra đoạn này trên phòng được phép theo bước Connect ở trên. Không cần phát công khai để kiểm thử giao diện hoặc mua quà để kiểm thử.
## Kết quả SA

106 tests PASS gồm 79 Viewer, 12 Event Engine, 8 voice worker và 7 gateway. Cả hai build Viewer và Engine PASS. CLI gateway đã khởi động với connector được nạp riêng trong worker, preflight loopback trả 204, sai mã trả 401 và poll trước khi có phiên trả 409.

Bản build Viewer chạy trong Edge, với gateway HTTP cục bộ và fixture được tiêm từ runner. Các checkpoint xác nhận OFFLINE, CONNECTED_NO_EVENTS, EVENTS_VERIFIED, focus đúng seat-1 và Disconnect. Fixture có chat, member, like, room, gift progress, bốn gift final và một final lặp. Engine ghi bốn quà, ba ghế, và số người xem 16. [Biên bản browser](evidence/browser.json) · [Ảnh WebGL 720×1280](evidence/fixture-focus.png)