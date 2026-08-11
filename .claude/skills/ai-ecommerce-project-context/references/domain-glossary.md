# Thuật ngữ Nghiệp vụ (Domain Glossary) — AutoMatch AI

| Thuật ngữ | Định nghĩa trong dự án này | Phân biệt / Dễ nhầm lẫn với |
|---|---|---|
| **Hard Constraints** | Yêu cầu cứng bất biến của khách hàng (Giá tối đa, Đời xe tối thiểu, Động cơ, Nhiên liệu) trích xuất bằng Gemini JSON mode. | **Soft Intent** (Cảm giác lái, phong cách thể thao, đi dạo phố). |
| **Sanity Check** | Bước kiểm tra số lượng xe thỏa mãn 100% Hard Constraints trước khi thực hiện RAG search. | **Vector Search** (Tìm kiếm tương đồng ngữ nghĩa). |
| **Conflict Flag** | Cờ cảnh báo bật khi Sanity Check trả về 0 xe (người dùng yêu cầu vô lý như siêu xe V12 giá dưới 1 tỷ). | **Lỗi hệ thống** (System Error). |
| **Constraint Relaxation** | Chiến lược nới lỏng các yêu cầu cứng thành các tiêu chí mềm để vẫn tìm được xe thay thế phù hợp. | **Soft Penalty Scoring** (Công thức trừ điểm phạt khi vượt ngân sách). |
| **Soft Penalty Scoring** | Công thức trừng phạt điểm tương đồng dựa trên khoảng chênh lệch giữa giá xe và ngân sách khách hàng: $S_{final} = \alpha \cdot \text{sim} - \lambda \cdot \max(0, P_{item} - B_{user})$. | **Cosine Similarity thuần** (chỉ đo khoảng cách vector). |
| **Generative UI** | Khả năng render trực tiếp các React component (Thẻ xe, Bảng so sánh 3D, Nút bấm) vào luồng chat thông qua SSE events và Tool Calling. | **Markdown text đơn thuần**. |
| **Nitro SSE** | Thư viện native SSE client (`react-native-nitro-sse`) sử dụng cho ứng dụng di động Expo để stream dữ liệu tư vấn real-time. | **WebSocket / REST polling**. |
