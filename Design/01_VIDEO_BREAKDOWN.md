# 01 — Video breakdown: chuav2.mp4

**Nguồn sự thật thị giác:** video user upload; dài 46.87 giây, khung 720×1556 (tỉ lệ gần 9:19.45 vì recording điện thoại, KHÔNG phải output khuyến nghị), 30fps. Các mốc ghi dưới đây là mô tả từ việc xem ảnh từng giây và video; không khẳng định cơ chế backend Roblox phía sau.

## A. Timeline chi tiết

| Giây | Quan sát THỰC TẾ từ video | Bắt buộc tái hiện |
|---|---|---|
| 0–4 | Góc camera thấp gần mặt hồ tím xanh. Avatar kiểu chibi tóc đen, mặt đơn giản, áo sáng ngồi xếp bằng từng lá sen. Tên chữ trắng trên đầu. Bầu trời hồng tím sáng; đốm sáng/cánh hoa hồng bay. | Low close view, chibi sitting animation, billboard name, reflective water and dusk |
| 4–8 | Camera di chuyển lùi/đi ngang; hàng avatar/lá sen mở rộng chiều sâu. Mặt nước tối, sen xanh, hoa hồng xuất hiện; có người với ngoại hình khác. | Cụm avatar nhiều tầng foreground/middle/background; pan/orbit nhẹ, không chuyển cảnh đột ngột |
| 8–12 | Góc tăng cao dần; càng thấy nhiều lá sen dàn trải thành các dải và cây anh đào hồng trên một đảo nhỏ. | Transition camera nâng cao, silhouette hoa anh đào làm điểm nhấn |
| 12–17 | Góc rất cao nhìn xuống. Cây hoa anh đào tán rộng hồng nằm trong/đầu hồ; lá sen xếp thành các hàng/chuỗi hình vòng cung (không có bằng chứng là vòng tròn hoàn hảo). Số avatar và lá sen lớn, ở xa thu nhỏ do perspective. | Bắt buộc high-angle flyover, scene quy mô đông, các cụm lá sen, LOD/instancing |
| 17–23 | Camera di chuyển qua tán cây/gốc cây, góc nhìn thấp hơn. Bóng thân cây và các nhánh màu tối tương phản rực với nền sáng hồng nhạt; nhiều avatar ngồi trên lá sen và sương hồng che phía xa. | Sakura canopy/trunk silhouette, pink fog and blossom particles; định hướng camera dưới tán |
| 23–28 | Góc cận nhóm avatar; nameplates, bubble nói, gift/rose card ở vùng UI TikTok và thông điệp scene. Cây và hồ vẫn là hậu cảnh. | Cụm 2–8 avatar, bubble gần nhân vật, UI tương tác không chặn scene |
| 28–34 | Camera liên tục chọn nhóm nhân vật khác, có shot khá sát 1 avatar ngồi; tên phía trên; hiệu ứng cánh hoa và vòng nước. | Focus mode, billboard collision handling, smooth reframing |
| 34–40 | Cận hơn một số avatar, khoảng trống màu xanh đậm và lá sen hồng ở phía trước. Tên nhân vật thu nhỏ/đổi vị trí theo camera. | Portrait crop linh hoạt, avatar variants and floating seat |
| 40–45 | Cảnh nhóm đông ở gần máy quay, màu hồng ấm / hiệu ứng sen nổi, sương/ánh sáng. | Community hero scene; gentle haze, warm rim lighting |
| 45–46.87 | Cửa sổ/lớp điều khiển điện thoại trên bản ghi. | KHÔNG tái hiện lớp điện thoại |

## B. Các phân biệt quan trọng

- Các thanh thống kê, nút follow, emoji quà, comment dưới, hộp nhập, badge và các thông báo native TikTok là **giao diện ứng dụng điện thoại ghi hình**, không bắt buộc thuộc 3D world. Chỉ mô phỏng các phần thực sự nổi **trong** scene: nameplates, câu chúc, chat bubble, ripple/rose FX.
- Không suy diễn rằng người xem *chỉ cần xem* là avatar xuất hiện: video không chứng minh cơ chế spawn; rule spawn phải cấu hình được.
- Không đoán game engine hoặc asset gốc từ video; chỉ quan sát hiệu ứng hình ảnh và thiết kế tương đương bằng asset có bản quyền hợp lệ.
- Không kết luận toàn bộ người trên màn hình là viewer đang online: có thể là NPC/demo/nhân vật lưu từ phiên. V2 yêu cầu test dữ liệu giả lập.

## C. 6 frame vàng để visual acceptance

1. **A—Close (3–4 s):** mặt nước xanh, một hàng chibi ngồi trên lá sen, tên trên đầu, cánh hoa rơi.
2. **B—Medium (8–9 s):** 10–30 avatar trong cùng khung, bầu trời hồng tím, núi mờ.
3. **C—Overview (14–16 s):** trục nhìn từ cao, cây hoa anh đào và hàng chục/hàng trăm lá sen/nhân vật.
4. **D—Under Tree (18–21 s):** tán/gốc cây, ánh hồng ngược sáng, sương và tập trung đông người.
5. **E—Focus (30–35 s):** 1–3 avatar lớn, nameplate, chat bubble/gift feedback.
6. **F—Community (40–44 s):** cảnh nhóm và hồ sen, màu ấm, FX mềm.

**Chấp nhận visual:** đối chiếu screenshot V2 với 6 frame từ video, cùng FOV tương đương, nền/cây/cụm avatar/camera và tone màu. Không dùng một poster tĩnh để giả nhiều góc; phải quay camera thật.

## D. Chưa thể xác nhận từ clip

- Thực tế có bao nhiêu seat/nhân vật; nguyên tắc spawn và thời gian tồn tại.
- Tần suất trigger camera bởi quà/tín hiệu thời gian; cần làm tương đương về ngoại hình bằng scene director cấu hình.
- Mức light physically based, shader water hay pre-rendered: phải đo benchmark, không suy từ video.
