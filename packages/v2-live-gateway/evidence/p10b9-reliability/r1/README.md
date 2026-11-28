# CODEX 26A · PR #31 · SA R1

Baseline `85c3e8ac9c02badd3faeee611564f84c9c08a013`. Runtime dùng cho bằng chứng `b3e127e3a3618badaf30fd16d1802e8d55a4d174`. Build ghi hậu tố `-working-tree` vì runner và test đang được chỉnh. Diff từ SHA này đến HEAD bàn giao chỉ gồm runner, test và biên bản. Chỉ QUALITY được dùng trong phép thử trình duyệt R1, theo [Rules tại HEAD Owner](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/03f7b56209b431de0ee02630df74274dadc5dc7e/Design/07_WORK_RULES.md).

## P1-01 · Ưu tiên sự kiện đủ điều kiện

| Loại sự kiện | Trần IPC đang chờ | Trần hàng Gateway |
| --- | ---: | ---: |
| Chỉ cập nhật tương tác hoặc lặp cùng nguồn và ID | 208 | 192 |
| Like đủ điều kiện | 216 | 200 |
| Chat đủ điều kiện | 232 | 216 |
| Member đủ điều kiện | 240 | 224 |
| Gift Final và điều khiển | 256 | 256, cùng slot disconnect hiện có |

Các trần áp dụng trên hàng tổng, từ thấp đến cao. Worker nhận chính sách admission khi khởi động và khi Dashboard cập nhật. Gateway kiểm tra cùng chính sách và giữ giới hạn 3 giây cho Like có định danh. Chat và Member là hai nguồn riêng. Một Chat bị tắt auto-join hoặc một Like đã xếp không chiếm ưu tiên Member đến sau từ cùng ID. Gateway tính cả prefix đã gửi và đang chờ ACK để nhận diện gói lặp. Khi drop trước khi vào hàng, ID sự kiện còn hợp lệ để thử lại. Thứ tự và nội dung các gói đã gửi giữ theo seq ban đầu.

Đối chiếu trước/sau với 250 Like có ID khi auto-join Like tắt cho thấy baseline gửi 240 gói vào IPC và bỏ Member tiếp theo. Candidate gửi 208 gói Like vào IPC và chuyển Member tiếp theo. Với Chat OFF và Member ON, baseline bỏ Member khi trùng ID với Chat đang chờ. Candidate nhận Member. Với Chat lặp mà gói trước đã được offer, baseline cho gói lặp vào vùng dự phòng và candidate tính là drop do áp lực. [Đối chiếu baseline/candidate](priority-before-after.jsonl)

Kiểm thử đối soát mapped = handoff + IPC pressure + IPC error trước terminal, và mapped Gateway = queued + coalesced + dedup + pressure + throttled + overflow + invalid. Mất gói do Worker quá tải terminal vẫn báo lỗi giao nhận theo hợp đồng Gift Final; Gateway đếm một phiên có báo cáo cuối thiếu, kể cả khi chỉ nhận exit code 2. Phiên có cờ này không đủ dữ liệu cho đối soát cuối. Các kiểm thử còn kiểm tra FIFO A → B → C, tổng Gift Final, contiguous ACK, thử lại sau ACK và slot session disconnect.

**168 test dùng chung và hai build đạt.** Gateway 34, Event Engine 22, Viewer 104 và Voice 8. Log chạy toàn bộ có 33 Gateway test trước khi thêm thử nghiệm IPC error; log Gateway cuối có 34. [Regression và build](regression.log.txt) · [Gateway cuối](gateway-final-tests.log.txt)

## Chạy P1-02 trên Windows

Dùng Node.js 24 và Edge cài sẵn. Stage tài nguyên đã khóa và build Viewer theo hướng dẫn PR #31. Từ thư mục `apps/v2-viewer`, sau khi `npm.cmd ci` ở cả Viewer và Gateway, chạy lệnh dưới đây. Hai cổng mặc định 5189 và 5203 phải trống. Runner tự khởi động Viewer và Gateway cục bộ, chọn QUALITY và gửi sự kiện giả lập có ID. [Hướng dẫn stage](../../../P10B9_LIVE_RELIABILITY.md)

```powershell
npm.cmd run build
node scripts/evidence-live-reliability-r1.mjs
```

Dùng desktop Windows hoạt động. Runner mở profile Edge tạm, điều khiển tab và cửa sổ native qua DevTools, giữ hành vi occlusion và throttling mặc định của Edge. Analyser đọc PCM lấy từ đầu ra cùng mixer đang nối tới loa, không có MediaRecorder hoặc MediaStreamDestination hoạt động. Thiết lập nguồn OBS/Studio, phòng TikTok thực và giọng gTTS thực tế cần biên bản Owner riêng. Quà ngoài khung hình dùng chuông không gắn ghế, còn lời cảm ơn có tên yêu cầu Gift Camera đã hiển thị đúng nhân vật.

## P1-02 · Kết quả QUALITY

Edge 158.0.4370.45 trên Windows và Intel UHD, với cửa sổ được đưa lên trước qua Windows. Overlay ẩn liên tục **65,338 giây** khi dùng tab Dashboard. Cả 91 mẫu PCM trong khoảng đó đều khác 0, RMS từ 0,000675 đến 0,049680. Log ghi bốn idle cue hoàn tất và một chuông Gift Final với RMS 0,016778 tại lúc ACK. Member mới vào ghế và được ACK trong 702 ms. ACK tiến từ 1 đến 4, owner giữ nguyên, một lần khởi động provider giả lập và không còn entry chờ. Đối soát 3 callback mapped/handoff, 3 gói dữ liệu cộng 1 session open đều đã ACK.

Master OFF đưa PCM về 0 khi Overlay còn ẩn. Master ON khôi phục PCM trước khi quay lại. Sau khi tab Overlay hiện lại và có tín hiệu liên tục 2,5 giây, vẫn chỉ ghi một lần phát chuông quà và không có lần đọc tên. Cửa sổ riêng có ID khác và lấy focus, Overlay vẫn visible với RMS 0,001055. Khi cửa sổ Overlay minimize, `document.hidden` là true và RMS 0,001369. [Raw JSONL](quality-normal.jsonl)

Các lượt thử trước ghi nhận timeout khi Playwright chờ nút Dashboard ổn định và có lúc Windows báo Overlay vẫn bị che khi khởi động hoặc khôi phục sau minimize. Runner cuối xác nhận quay về Overlay bằng chuyển tab trước bước thử cửa sổ riêng và minimize, đồng thời dùng thao tác foreground native của Windows. Sau khi kết thúc minimize, runner đóng phiên thử. [Dashboard timeout](quality-dashboard-click-timeout.jsonl) · [Khôi phục sau minimize](quality-return-occluded.jsonl) · [Startup visibility](quality-startup-visibility.jsonl)

Chi phí 0 VND.

**STOP `P10B9_LIVE_RELIABILITY_SA_REVIEW_REQUIRED`.**
