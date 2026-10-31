# Product Requirements Document (PRD): [Tên Dự Án]

> **Người lập**: Business Analyst (`/ba`)
> **Trạng thái**: Draft | Approved for PO Backlog
> **Tài liệu kỹ thuật đi kèm**: [SRS.md](./SRS.md)

---

## 1. Tầm nhìn & Bài toán (Problem & Value Proposition)
- **Vấn đề cốt lõi (Problem Statement)**: Người dùng gặp khó khăn gì?
- **Giải pháp (Value Proposition)**: Sản phẩm giải quyết vấn đề đó như thế nào?
- **Anti-Goals (Những thứ KHÔNG làm)**: Giới hạn rõ để tránh lan man.

## 2. Chân dung Người dùng (Target Personas & Roles)
| Role / Persona | Mô tả | Quyền hạn chính | Nhu cầu cốt lõi |
| :--- | :--- | :--- | :--- |
| **[Role 1]** | [Mô tả] | [Quyền hạn] | [Mục tiêu] |

## 3. Bản đồ Trực quan Hệ thống (Archify Interactive Diagrams)
*Mở các file HTML tương tác dưới đây bằng trình duyệt để xem luồng và cấu trúc chi tiết:*
- 🗺️ **One-Page Explainer / Tổng quan**: [overview-explainer.html](./diagrams/overview-explainer.html)
- 🔄 **Luồng Nghiệp vụ Chính (Workflow)**: [user-workflow.html](./diagrams/user-workflow.html)
- 🏛️ **Kiến trúc Hệ thống (Architecture)**: [system.architecture.html](./diagrams/system.architecture.html)
- 🗄️ **Sơ đồ Cơ sở Dữ liệu (ERD)**: [database-schema.erd.html](./diagrams/database-schema.erd.html)

## 4. Phạm vi Tính năng theo MoSCoW (Feature Scope)

### Must-Have (Bắt buộc cho MVP)
- [ ] **[F-01] Tên tính năng 1**: Mô tả ngắn gọn & giá trị mang lại.
- [ ] **[F-02] Tên tính năng 2**: Mô tả ngắn gọn & giá trị mang lại.

### Should-Have (Phiên bản v1.1 ngay sau MVP)
- [ ] **[F-03] Tên tính năng 3**: Mô tả ngắn gọn.

### Could-Have (Phiên bản v2.0 mở rộng)
- [ ] **[F-04] Tên tính năng 4**: Mô tả ngắn gọn.

### Won't-Have (Ngoài phạm vi)
- ❌ [Tính năng loại bỏ khỏi giai đoạn hiện tại]

## 5. Công nghệ Sử dụng (Tech Stack)
- **Backend**: [VD: Node.js / NestJS / Go / .NET / Python...]
- **Frontend**: [VD: Next.js / React / Vue...]
- **Database & Cache**: [VD: PostgreSQL, Redis...]
- **Testing & API Docs**: Unit Test framework, Swagger / OpenAPI.
