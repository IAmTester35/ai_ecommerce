# Skill Context: AutoMatch AI (ai_ecommerce)

Thư mục này chứa Custom Skill được thiết kế theo đúng quy chuẩn 3 tầng (Progressive Disclosure) cho dự án **AutoMatch AI**.

## Cấu trúc thư mục Skill

- `SKILL.md`: Điểm truy cập chính chứa metadata YAML và tổng quan dự án.
- `references/`: Thư mục tài nguyên tra cứu chuyên sâu (chỉ đọc khi tác vụ chạm tới).
  - `architecture.md`: Chi tiết kiến trúc 5 tầng, luồng Agentic RAG & SSE Streaming.
  - `conventions.md`: Quy ước mã nguồn, cấu trúc layers và quy tắc SoC (Separation of Concerns).
  - `db-schema.md`: Chi tiết schema Supabase PostgreSQL, RLS policies và SQL Functions.
  - `workflows.md`: Quy trình cài đặt môi trường, kiểm thử và chạy dự án.
  - `domain-glossary.md`: Thuật ngữ chuyên môn ngành ô tô và AI Search.
  - `troubleshooting.md`: Lỗi hay gặp và cách xử lý nhanh.
  - `api-endpoints.md`: Danh sách API FastAPI & Supabase RPC functions.
- `scripts/`:
  - `setup_env.sh`: Script kiểm tra & khởi tạo môi trường làm việc.
  - `run_tests.sh`: Script chạy type-check & unit tests.
- `assets/`:
  - `commit-template.txt`: Template quy chuẩn commit message.

## Cách kích hoạt & cài đặt

Skill này được lưu tự động trong repo dự án tại `.claude/skills/ai-ecommerce-project-context/`.
Khi bạn làm việc trong dự án này bằng Claude Code / Antigravity IDE, agent sẽ tự động phát hiện và nạp skill khi có câu hỏi hoặc yêu cầu liên quan tới dự án `ai_ecommerce`.
