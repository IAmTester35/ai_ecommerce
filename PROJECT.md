# 📌 ĐỀ CƯƠNG DỰ ÁN KỸ THUẬT: HỆ THỐNG TÌM KIẾM Ô TÔ THÔNG MINH (CONFLICT-AWARE CAR RETRIEVAL SYSTEM)

Dưới đây là bản **Đề cương Kỹ thuật (Technical Proposal) hoàn chỉnh và cực kỳ chi tiết**, tổng hợp các quyết định kiến trúc xuất sắc nhất nhằm xây dựng hệ thống trợ lý AI chuyên biệt cho lĩnh vực kinh doanh Ô tô (Car E-commerce). Bản thiết kế này (Architecture Blueprint) đạt chuẩn sản xuất (Production-ready), kết hợp giữa Agentic RAG, Hybrid Search, LLM Reasoning và Cơ chế Xử lý Mâu thuẫn Logic.

---

## 1. Thông Tin Chung
*   **Tên Tiếng Việt:** Nghiên cứu và phát triển hệ thống Thương mại điện tử hội thoại phân phối Ô tô, ứng dụng Tìm kiếm Vector, RAG và Cơ chế Xử lý Mâu thuẫn.
*   **Tên Tiếng Anh:** Conflict-Aware Conversational E-commerce System for Automobiles using Vector Search and RAG.
*   **Tên thương hiệu/MVP:** **AutoMatch AI** - Trợ lý Tìm kiếm & Tư vấn Xe Thông minh.

## 2. Mô Tả & Mục Tiêu Đề Tài

**Vấn đề (Pain-point):** 
Giao diện e-commerce truyền thống trong lĩnh vực ô tô thường dựa trên các bộ lọc cứng nhắc (Giá, Hãng, Đời xe). Điều này khiến người dùng khó tìm kiếm theo "ngữ cảnh" hay "nhu cầu thực tế" (VD: *"Tôi cần một chiếc xe V12, thiết kế thể thao để đi dạo phố, nhưng giá phải dưới 1 tỷ"*). Hơn nữa, khi các yêu cầu của người dùng chứa các **mâu thuẫn logic** (như xe động cơ V12 nhưng giá rẻ), các hệ thống cũ thường trả về kết quả "Không tìm thấy", gây trải nghiệm tồi tệ.

**Giải pháp (Solution):** 
Xây dựng một hệ thống **Agentic RAG kết hợp Xử lý Mâu thuẫn (Conflict-Aware)**. Biến thanh tìm kiếm thành một Trợ lý AI có khả năng:
- Hiểu ngôn ngữ tự nhiên và ngữ cảnh sâu xa của khách hàng.
- Bóc tách giữa các yêu cầu cứng (Ngân sách, Số chỗ ngồi) và yêu cầu mềm (Cảm giác lái, Phong cách).
- Chủ động phát hiện mâu thuẫn trong yêu cầu của khách hàng.
- Áp dụng chiến lược "nới lỏng ràng buộc" (Constraint Relaxation) và thuật toán "phạt điểm" (Soft Penalty Scoring) để vẫn đưa ra được các gợi ý xe thay thế tốt nhất thay vì báo lỗi.

### 🌟 Core Features (Tính năng cốt lõi MVP)
1.  **Natural Language Product Search:** Tìm kiếm xe bằng ngôn ngữ tự nhiên, không cần khớp chính xác từ khóa kỹ thuật.
2.  **Conflict-Aware Logic:** Tự động phát hiện các yêu cầu vô lý (ví dụ: siêu xe nhưng ngân sách hẹp) và điều chỉnh linh hoạt.
3.  **Hybrid RAG Engine & Soft Penalty:** Kết hợp tìm kiếm Vector (Semantic) với lọc dữ liệu cấu trúc (Metadata). Sử dụng công thức toán học để xếp hạng lại (Re-rank) khi phải nới lỏng ngân sách.
4.  **Generative UI (UI Động):** Trả về giao diện thẻ thông tin xe (Car Cards), bảng so sánh thông số kỹ thuật, và biểu đồ so sánh giá trực tiếp bên trong cửa sổ chat.
5.  **Smart Car Comparison & Booking:** Thêm xe vào danh sách so sánh hoặc đặt lịch lái thử trực tiếp qua chatbot.

---

## 🛠️ 3. Tech Stack Chốt Hạ (Modern & Production-Ready)

Kiến trúc này được thiết kế phân lớp rõ ràng, tối ưu tốc độ phát triển (DX), trải nghiệm mượt mà của UI/UX và sức mạnh suy luận của AI.

### 🌐 Frontend & Luồng Hội Thoại (Web App)
*   **Framework:** **Next.js (App Router)** + TypeScript.
*   **AI Orchestration:** **Vercel AI SDK**. 
    *   Sử dụng tính năng **Generative UI (`ai/rsc`)** và **Tool Calling** để render trực tiếp các Component React (Thẻ Xe, Thông số kỹ thuật 3D, Bảng so sánh) vào luồng chat một cách real-time.
*   **Styling:** Tailwind CSS + Shadcn UI (Nhanh, gọn, chuẩn UI/UX hiện đại, phong cách Premium phù hợp ngành Ô tô).

### 🗄️ Backend, Database & AI Core
*   **Backend:** **Next.js Route Handlers** cho các API giao tiếp Frontend, kết hợp một **Python Microservice (FastAPI)** để xử lý các thuật toán nặng.
    *   *(Chốt FastAPI: Tốc độ cao, hỗ trợ Async/Await native cực tốt cho các luồng gọi LLM).*
*   **Database:** **Supabase (PostgreSQL + `pgvector`)**.
    *   *(Chốt Supabase: Thay vì phải dùng 2 database (1 DB cho thông tin xe, 1 DB Vector như Qdrant/Milvus cho tìm kiếm), Supabase cho phép gộp chung tất cả vào một nơi bằng pgvector. Điều này giúp đồng bộ dữ liệu dễ dàng, dễ bảo trì và tiết kiệm server).*
    *   Lưu trữ dữ liệu: `users`, `cars`, `test_drives`, `saved_cars`.
    *   Xử lý Vector: Dùng `pgvector` để lưu embedding và viết hàm RPC (SQL) thực hiện **Hybrid Search** (Tìm Vector + Lọc WHERE giá/danh mục).
*   **Framework xây dựng luồng LLM:** **LangChain**.
    *   *(Chốt LangChain: Hiện đang là chuẩn công nghiệp (Industry Standard) cho việc xây dựng AI Agent. Cộng đồng cực lớn, nhiều tài liệu, tích hợp rất tốt với FastAPI và dễ dàng scale các chain suy luận phức tạp).*

### 🧠 AI & LLM Models
*   **LLM Engine:** Hệ sinh thái **Google Gemini API**. Sử dụng **Gemini 2.5 Flash** cho các tác vụ cần tốc độ mili-giây (Trích xuất Entity), và **Gemini 1.5 Pro** cho bước suy luận logic phân tích mâu thuẫn.
*   **Embedding Model:** **Google `gemini-embedding-2` (Gemini API)**.
    *   *(Chốt sức mạnh của Gemini Embedding: Đây là quyết định sáng suốt. So với `BAAI/bge-m3` (một model mã nguồn mở phải tự host gây tốn RAM/GPU), embedding của Google vượt trội hoàn toàn. Nó được Google train trên kho dữ liệu khổng lồ, hiểu ngữ cảnh Tiếng Việt cực sâu sắc, tốc độ phản hồi qua API chớp nhoáng và đặc biệt là đang có chính sách miễn phí (Free Tier) siêu hào phóng từ Google. Gần như không có đối thủ về P/P (Performance/Price) cho sinh viên/startup).*
*   **Cross-Encoder Model:** Dùng để Re-ranking Top kết quả ở giai đoạn cuối nhằm tối đa hóa độ chính xác (Chạy cục bộ trên Python Microservice).

### 📊 Data Pipeline (Chuẩn bị Dữ liệu Ô tô)
*   **Nguồn dữ liệu:** Dữ liệu xe thực tế từ các bộ dataset mã nguồn mở hoặc crawl từ các trang mua bán ô tô uy tín.
*   **Xử lý (Python/Pandas):** Tách bạch rõ ràng Metadata (Giá, Đời xe, Số chỗ, Động cơ) và Unstructured Data (Mô tả cảm giác lái, Đánh giá chuyên gia).
*   **Vector hóa:** Chạy script tạo embedding cho phần văn bản mô tả và đẩy vào Database.

---

## 🏗️ 4. Bóc Tách 5 Tầng Kiến Trúc Hệ Thống (Architecture Blueprint)

Hệ thống được chia thành 5 tầng xử lý (Layers) để giải quyết trọn vẹn từ lúc nhận câu hỏi đến lúc xuất giao diện.

### 🟢 Tầng 1: Tầng Dữ liệu (Data Ingestion & Storage Layer)
Tầng này chịu trách nhiệm chuẩn bị "kiến thức" cho hệ thống. Phân tách rõ ràng giữa dữ liệu cứng (số liệu) và dữ liệu mềm (ngữ nghĩa).
*   **Metadata (Dữ liệu cấu trúc):** Các thông số bất biến như Giá niêm yết, Đời xe (Year), Số chỗ ngồi, Loại động cơ (V12, I4, Điện), Dung tích xi-lanh. Lưu dưới dạng Column trong DB.
*   **Unstructured Data (Dữ liệu phi cấu trúc):** Các bài đánh giá, mô tả cảm giác lái (ví dụ: "xe bốc", "cách âm tốt", "phù hợp đi dạo phố").
*   **Vector Database:** Mỗi Record của một chiếc xe trong hệ thống sẽ bao gồm: `[ID, Car_Name, Metadata (JSON), Vector_Embedding]`.

### 🟡 Tầng 2: Phân tích Truy vấn & Kiểm tra Mâu thuẫn (Query Parsing & Sanity Check)
Khi người dùng nhập: *"Đề xuất chiếc xe V12, đi dạo phố, giá dưới 1 tỷ"*.
1.  **Trích xuất Thực thể (Entity Extraction):**
    Sử dụng Gemini với tính năng *Tool Calling/JSON Mode* để ép định dạng đầu ra.
    *   `hard_constraints`: `{"max_price": 1000000000, "engine_type": "V12"}`
    *   `soft_intent`: `"xe đi dạo phố, phong cách thể thao"`
2.  **Kiểm tra Logic & Mâu thuẫn (Sanity Check):**
    *   Hệ thống chạy truy vấn nhanh (Count query): *Có bao nhiêu xe động cơ V12, giá <= 1 tỷ?* -> Kết quả: 0.
    *   **Cờ cảnh báo (Conflict Flag)** bật lên: Báo hiệu mâu thuẫn giữa `engine_type = V12` và `max_price = 1 Tỷ`.

### 🟠 Tầng 3: Truy xuất Lai & Giải quyết Mâu thuẫn (Hybrid Retrieval & Conflict Resolution)
Khi Conflict Flag bật, luồng tìm kiếm thông thường bị chặn, hệ thống chuyển sang cơ chế xử lý ngoại lệ.
1.  **Chiến lược Nới lỏng Ràng buộc (Constraint Relaxation):**
    *   Giữ lại ràng buộc quan trọng nhất (Ngân sách: `<= 1 tỷ`).
    *   "Mềm hóa" ràng buộc kỹ thuật (`engine_type = V12` bị loại khỏi điều kiện SQL cứng, chuyển thành từ khóa tìm kiếm ngữ nghĩa).
    *   *Truy vấn Vector mới:* "Xe đi dạo phố, có cảm giác lái mạnh mẽ, thể thao, gia tốc tương tự động cơ V12".
2.  **Thuật toán Trừng phạt Điểm số (Soft Penalty Scoring):**
    Không loại bỏ ngay các xe vượt ngân sách một chút, áp dụng công thức để chấm điểm:
    $$S_{final} = \alpha \cdot \text{sim}(V_{query}, V_{item}) - \lambda \cdot \max(0, P_{item} - B_{user})$$
    *(Trong đó: $S_{final}$ là điểm cuối, $\text{sim}$ là độ tương đồng Vector, $P_{item}$ là Giá xe, $B_{user}$ là Ngân sách, $\lambda$ là hệ số phạt).* Xe vượt giá càng cao, bị trừ điểm càng nặng.

### 🔴 Tầng 4: Tầng Xếp hạng lại (Re-ranking Layer)
*   **Đầu vào:** Top 20 xe tiềm năng từ Tầng 3 (ví dụ: Honda Civic RS, Mazda 3 bản cao cấp, hoặc xe Đức đời cũ).
*   **Xử lý:** Điểm Vector Cosine đôi khi thiếu chính xác do ngữ cảnh phức tạp. Đưa Top 20 qua mô hình **Cross-Encoder**. Cross-Encoder sẽ đọc đồng thời cả yêu cầu của khách hàng và mô tả của từng chiếc xe để chấm điểm lại mức độ phù hợp.
*   **Đầu ra:** Top 3 - Top 5 chiếc xe xuất sắc nhất thực sự khớp với nhu cầu.

### 🔵 Tầng 5: Tầng Tạo Phản hồi (Generation Layer & Generative UI)
Biến số liệu khô khan thành lời tư vấn thấu cảm và hiển thị UI trực quan.
*   **Prompt Inject vào LLM ở chặng cuối:** 
    > *"Khách muốn: Xe dạo phố, động cơ V12, giá < 1 tỷ. Hệ thống phát hiện mâu thuẫn (Không có xe V12 giá này). Top 3 xe thay thế hệ thống đã chọn: [Honda Civic RS, Mazda 3 2.0, Kia K3 Turbo]. Hãy tư vấn khéo léo, giải thích mâu thuẫn giá cả, và đề xuất 3 mẫu xe này."*
*   **Generative UI Response:** 
    *   Vercel AI SDK nhận phản hồi từ LLM, tự động render **React Components** (Thẻ xe, Thông số 3D, Nút đặt lái thử) trực tiếp vào khung chat của khách hàng, tạo trải nghiệm tương tác liền mạch, hiện đại.

---

## 🚀 5. Tổng Kết Giá Trị Đề Tài
Với kiến trúc bóc tách lớp chuyên sâu này, đề tài không chỉ dừng lại ở một ứng dụng chat thông thường, mà trở thành một **Hệ chuyên gia (Expert System)** thực thụ trong ngành phân phối Ô tô. Hệ thống thể hiện tư duy xử lý tình huống linh hoạt như một nhân viên Sale cao cấp: Biết lắng nghe khách hàng, hiểu rõ kho hàng, phát hiện yêu cầu vô lý và tư vấn lựa chọn thay thế tối ưu nhất.
