---
name: ai-ecommerce-project-context
description: Cung cấp bối cảnh đầy đủ về dự án AutoMatch AI (ai_ecommerce) — hệ thống tìm kiếm ô tô thông minh ứng dụng Agentic RAG, Vector Search (Supabase pgvector), SSE Streaming và xử lý mâu thuẫn (Conflict-Aware). LUÔN dùng skill này khi làm việc trong repo ai_ecommerce, khi được hỏi về kiến trúc dự án, viết code mới, sửa bug, review code, làm việc với backend FastAPI, mobile app React Native Expo, web app Next.js hoặc Supabase SQL schema.
---

# AutoMatch AI (ai_ecommerce) — Project Context

File này là điểm truy cập chính (entry point) cho Skill của dự án AutoMatch AI. Giữ ngắn gọn và mạch lạc. Chi tiết sâu hơn nằm ở các tài liệu chuyên biệt trong thư mục `references/`.

## 1. Tổng quan nhanh

- **Tên dự án:** AutoMatch AI - Conflict-Aware Conversational E-commerce System for Automobiles.
- **Mục tiêu:** Trợ lý tìm kiếm & tư vấn mua xe thông minh sử dụng ngôn ngữ tự nhiên, kết hợp Agentic RAG, Hybrid Search và cơ chế tự nới lỏng mâu thuẫn (Constraint Relaxation & Soft Penalty Scoring).
- **Đối tượng sử dụng:** Khách hàng mua sắm ô tô trực tuyến, showroom/nhân viên tư vấn ô tô.
- **Trạng thái:** Đang phát triển MVP (Production-ready Architecture).

## 2. Tech Stack Tổng Quan

| Thành phần | Công nghệ chính | Ghi chú |
|---|---|---|
| Frontend Mobile | React Native (Expo) + TypeScript + Nitro SSE | App di động trong `ecommerce-car/` |
| Frontend Web | Next.js (App Router) + Vercel AI SDK | Generative UI render thẻ xe, bảng so sánh |
| State Management | Zustand | Tách biệt hoàn toàn khỏi API callers |
| AI Backend | Python FastAPI + LangChain + SSE Streaming | Microservice xử lý RAG & Re-ranking trong `backend/` |
| Database & Search | Supabase (PostgreSQL + `pgvector`) | Quản lý data, RLS, Hybrid Vector Search |
| Embedding & LLM | Gemini API (`gemini-embedding-2`, Gemini Flash/Pro) | Embeddings 768 dimensions |

## 3. Bản đồ thư mục dự án

```
ai_ecommerce/
├── sql/
│   └── master_schema.sql     # Database master schema (bảng, RLS, RPC functions)
├── backend/                  # Python FastAPI AI microservice (RAG, LangChain, SSE)
├── ecommerce-car/            # App mobile React Native Expo
│   └── src/
│       ├── api/              # Supabase Client configuration
│       ├── services/         # Pure API callers (SoC rule: NO React state)
│       ├── store/            # Zustand reactive state management
│       └── types/            # TypeScript models & DTOs
├── data_pipeline/            # Scripts xử lý dữ liệu ô tô, embedding & seed DB
├── PROJECT.md                # Bản thiết kế kiến trúc kỹ thuật chi tiết
└── .claude/skills/           # Skill context dự án dành cho Claude Code / Agent
```

## 4. Quy ước kiến trúc & Code (SoC Enforcement)

- **Separation of Concerns (SoC)**:
  1. `src/services/`: Chỉ chứa hàm async tương tác Supabase hoặc backend REST/SSE API. Trả về data hoặc ném Error. Không import React/Zustand.
  2. `src/store/`: Quản lý reactive state của ứng dụng bằng Zustand. Gọi `services`, xử lý `isLoading` / `error`.
  3. `src/components/` & Screens: Chỉ dùng store hooks (`useAuthStore`, `useCarStore`...), không trực tiếp gọi `supabase` client.
- **Code Style**: TypeScript strict, naming camelCase cho hàm/biến, PascalCase cho Types/Interfaces/Components, kebab-case cho file services/stores.

## 5. Luồng làm việc thường gặp (Commands)

**Khởi tạo Backend Virtualenv:**
```bash
source .venv/bin/activate
pip install -r backend/requirements.txt
```

**Chạy kiểm tra Type trong Mobile App:**
```bash
cd ecommerce-car
npx tsc --noEmit
```

Chi tiết các luồng làm việc: `references/workflows.md`.

## 6. Kiến trúc 5 Tầng (Summary)

1. **Layer 1: Data Ingestion & Storage** (Supabase pgvector + Metadata GIN Index + HNSW Index).
2. **Layer 2: Query Parsing & Sanity Check** (Trích xuất hard constraints & soft intent, kiểm tra mâu thuẫn).
3. **Layer 3: Hybrid Retrieval & Conflict Resolution** (Nới lỏng ràng buộc & Soft Penalty Scoring).
4. **Layer 4: Re-ranking Layer** (Cross-Encoder reranking top candidate cars).
5. **Layer 5: Generation & Generative UI** (LLM Stream tư vấn + Generative UI Component / SSE Stream).

Chi tiết sơ đồ kiến trúc: `references/architecture.md`.

## 7. Danh sách tài liệu tham khảo (Progressive Disclosure)

| File | Khi nào đọc |
|---|---|
| `references/architecture.md` | Cần hiểu chi tiết 5 tầng RAG, luồng SSE streaming và re-ranking |
| `references/conventions.md` | Viết code mới, refactor, kiểm tra tuân thủ SoC |
| `references/db-schema.md` | Viết query Supabase, kiểm tra RLS, gọi RPC (`match_cars`, `checkout_cart`) |
| `references/workflows.md` | Chạy dự án, test, build hoặc deploy |
| `references/domain-glossary.md` | Tra cứu thuật ngữ chuyên môn (Constraint Relaxation, Soft Penalty...) |
| `references/troubleshooting.md` | Xử lý lỗi liên quan tới RLS, SSE connection, UUID format, TypeScript |
| `references/api-endpoints.md` | Tra cứu các API endpoints của FastAPI Backend và RPC Functions của DB |
