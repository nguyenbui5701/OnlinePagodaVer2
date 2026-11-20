# 02 — Requirements & video-fidelity checklist

**Status:** DRAFT; mục tiêu: visual fidelity cao nhất với video mẫu, rồi mới tối ưu tài nguyên.

## Product goal

Một không gian thiền **vườn sen 3D** livestream TikTok bằng Windows/Electron capture 9:16. Nhiều người ngồi thiền trên lá sen, cây anh đào hồng khổng lồ, hồ phản chiếu, sương và núi xa; camera bay mượt quanh scene. TikTok users tương tác tạo hiệu ứng trong thế giới mà không ảnh hưởng luồng LIVE V1.

## P0 bắt buộc

| ID | Requirement | Acceptance |
|---|---|---|
| VIS-01 | Không gian 3D thật, camera tự do tiến/lùi/xoay/độ cao | Demo chuyển từ close -> flyover -> under-tree -> close không đổi bitmap nền |
| VIS-02 | Hồ rộng màu xanh lam-tím, gợn nước/sương, nhiều lá sen nổi | Có phản sáng mềm, độ sâu trước/sau, bố trí không trùng lá |
| VIS-03 | Cây anh đào lớn, tán dày, gốc sẫm, hoa hồng sáng | Giữ vị trí landmark ở shot 14s, dưới gốc ở shot 19s |
| VIS-04 | Chibi ngồi xếp bằng trên lá sen | Đúng pose, tỷ lệ đầu/toàn thân, idle breathing, hair/outfit variants |
| VIS-05 | Quần thể nhiều người: nhóm cận và quang cảnh đông | Test 10, 30, 100 avatars; không hiện chữ chồng kín overview |
| VIS-06 | Ít nhất 4 mode camera: CLOSE, COMMUNITY, AERIAL, UNDER_TREE | Có choreography/replay lặp lại; chuyển động không giật |
| VIS-07 | Độ sáng hồng/tím, núi nhiều lớp, fog xa, petals | 6 screenshot goldens đạt review bằng mắt với cùng FOV |
| LIVE-01 | Reuse TikTok connector/mapper, demo/provider, được kiểm thử | Chat, member, gift, like, viewer-total qua demo fixture |
| LIVE-02 | Avatar/name identity ổn định, bounded | Event lặp không spawn 2; queue/backpressure; nickname Việt có dấu |
| LIVE-03 | Khi ghi nhận quà hợp lệ, focus góc cận đúng avatar người tặng, nameplate và gift FX; nếu nhiều người tặng, FIFO theo người; hết queue trở về cinematic | 4 kịch bản A/B/C và no-gift ở 09 phải PASS; combo progress/confirmed không đếm trùng |
| APP-01 | Capture dọc TikTok LIVE Studio, tách V1 | Không đụng repo/cấu hình/session V1; capture riêng |
| APP-02 | Cấu hình scene, camera, quality, trigger, max avatars | Có mode DEMO và diagnostics |
| CAM-08 | Cinematic chạy liên tục khi không có gift; chỉ chuyển sang GIFT_FOCUS khi có item hợp lệ trong queue | No-gift không bị kẹt, queue B/C đúng thứ tự sau A, return mượt |
| PERF-01 | Profile ECO cho RTX 3050 Ti 4GB; QUALITY cho RTX 3060 8GB | Chạy demo cùng LIVE Studio, report FPS/VRAM/load, không suy đoán máy |
| PERF-02 | Duy trì camera và gift focus ưu tiên trước hạt/sương/shadow khi quá tải | Preset tự hạ visual effects, không bỏ gift focus |

## P1 nên có

- Petal particles, water ripple, shallow glow, sparkling fireflies, white/pink lotus, falling blossoms, distant mountain layers.
- Viewer focus/short callout, chat bubble và hộp tên (billboard sprite 3D; culling theo khoảng cách).
- Auto camera pacing, ưu tiên gift nhưng không cắt ngang panorama mỗi khi burst gift; manual override.
- Performance LOD / GPU instancing / quality presets, thân thiện máy Windows livestream.

## Không làm trong phase 1

- Bê chánh điện Phật, Quan Âm, cảnh hành lễ, quẻ, hoa đăng, leaderboard V1 vào V2.
- Tự động giả lập toàn bộ TikTok phone UI; sao chép avatar/brand của Roblox hay texture từ video để phát lại.
- Thay thế, sửa, deploy, tái cấu hình source V1 đang chạy.

## Quality gates

1. AI Visual cung cấp **moodboard & asset specifications** trước khi AI Code nhận task.
2. Renderer spike xác nhận **camera/parallax/pose/fog** đạt yêu cầu bằng 4 shot sớm; không xây business logic trước.
3. Mock first; LIVE only after event and reconnect tests.
4. 30fps mục tiêu ban đầu ở 720×1280, cần đo trên **RTX 3050 Ti 4GB với LIVE Studio**, và đánh giá preset trên **RTX 3060 8GB**; thử 1080×1920 chỉ khi được benchmark chứng minh. Test 10/30/100 avatars, CPU/GPU/VRAM, queue A/B/C, ổn định ít nhất 30 phút (ngưỡng nghiệm thu điều chỉnh theo phần cứng).
5. V1 không bị thay đổi.
