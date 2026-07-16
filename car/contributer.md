1. Craigslist Used Cars & Trucks Dataset (Khuyên dùng cho Core Database)
Đây là bộ dữ liệu khổng lồ chứa hơn 400.000+ tin đăng bán xe ô tô cũ trên Craigslist, vô cùng sát với thực tế của một nền tảng E-commerce.

Tại sao phù hợp: Nó chứa đầy đủ các trường Metadata cứng (Price, Year, Manufacturer, Model, Condition, Cylinders, Drive, Type) và đặc biệt là trường description chứa nội dung mô tả xe dài (rất tốt cho RAG và Semantic Search).
Kích thước: ~275MB.
Link Kaggle: austinreese/craigslist-carstrucks-data
2. Edmunds Consumer Car Ratings and Reviews (Bổ sung cho RAG & LLM Reasoning)
Nếu bạn muốn hệ thống có khả năng tư vấn theo cảm tính của người dùng (ví dụ: "xe bốc", "cách âm tốt", "phù hợp đi dạo phố" như trong PROJECT.md), đây là bộ dataset cực kỳ giá trị để augment dữ liệu.

Tại sao phù hợp: Chứa hàng trăm ngàn lượt đánh giá (Reviews) chi tiết bằng văn bản tự nhiên từ người tiêu dùng thật trên Edmunds cho 62 thương hiệu xe lớn. Rất tuyệt vời để đưa vào Vector DB, giúp Gemini hiểu được "ngữ cảnh mềm".
Kích thước: ~52MB.
Link Kaggle: ankkur13/edmundsconsumer-car-ratings-and-reviews