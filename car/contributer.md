1. Car Features and MSRP Dataset (Khuyên dùng cho Core Database - Thông số cứng)
Đây là bộ dữ liệu chứa thông số kỹ thuật chuẩn và giá niêm yết (MSRP) của gần 12.000 dòng xe/phiên bản khác nhau. Mỗi dòng dữ liệu là một thực thể xe độc lập (Ví dụ: BMW 3 Series 2020 330i).

Tại sao phù hợp: Dữ liệu vô cùng sạch, chứa đầy đủ các trường cấu trúc quan trọng (Make, Model, Year, Engine HP, Engine Cylinders, Transmission Type, Vehicle Style, MSRP) cần thiết để làm điều kiện lọc (Hard Constraints) cho SQL. Không chứa rác (như tình trạng xe cũ, tọa độ đăng bán).
Kích thước: ~2MB (CSV).
Link Kaggle: CooperUnion/cardataset

2. Edmunds Consumer Car Ratings and Reviews (Bổ sung cho RAG & LLM - Ngữ cảnh mềm)
Nếu bạn muốn hệ thống có khả năng tư vấn theo cảm tính của người dùng (ví dụ: "xe bốc", "cách âm tốt", "phù hợp đi dạo phố" như trong PROJECT.md), đây là bộ dataset cực kỳ giá trị để kết hợp.

Tại sao phù hợp: Chứa hàng trăm ngàn lượt đánh giá (Reviews) chi tiết bằng văn bản tự nhiên từ người tiêu dùng thật trên Edmunds. Khi gộp chung các review này vào cột `Make + Model + Year` tương ứng ở Dataset 1, ta sẽ có được một đoạn miêu tả hoàn hảo để nhúng (Embedding) vào Vector DB, giúp AI hiểu được "ngữ cảnh mềm" của xe.
Kích thước: ~52MB.
Link Kaggle: ankkur13/edmundsconsumer-car-ratings-and-reviews