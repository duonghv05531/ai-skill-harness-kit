# 📌 TICKET SPECIFICATION: [TICKET_ID] - [Tên Task]

> **Trạng thái**: `👉 IN_PROGRESS [ACTIVE]` | `🧪 READY_FOR_TEST [feat/[TICKET_ID]]` | `🐞 BUG_FOUND [feat/[TICKET_ID]]` | `👀 READY_TO_MERGE [feat/[TICKET_ID]]` | `👀 READY_FOR_REVIEW [MERGED]` | `✅ DONE`
> **Nhóm Thực thi (Wave)**: `[🔒 SEQ-X (Tuần tự) | ⚡ PARA-WX (Có thể làm song song cùng: TASK-00Y, TASK-00Z)]`
> **Nhánh & Worktree Cô lập**: Nhánh `feat/[TICKET_ID]` tại thư mục `.worktrees/[TICKET_ID]/`
> **Vùng File Được Phép Chạm (File Ownership Boundary)**: `[VD: src/modules/module-a/, test/module-a/]`
> **Tài liệu BA tham chiếu**: [PRD.md](./PRD.md) | [SRS.md](./SRS.md) | Sơ đồ trực quan tại `docs/product/diagrams/`
> **Lệnh thực thi ở đoạn chat mới**: Mở đoạn chat mới và gõ `/dev [TICKET_ID]` (hoặc `/dev`)

---

## 1. Góc nhìn Nghiệp vụ & Thông tin Chạy Song Song

### User Story & Mục tiêu
> **Là một** [Loại người dùng / Hệ thống],
> **Tôi muốn** [Hành động / Tính năng],
> **Để có thể** [Giá trị / Lợi ích đạt được].

### Đánh giá Chạy Song Song & Chống Conflict (Parallel Safety)
- **Các Ticket có thể mở tab chat làm đồng thời với Ticket này**: `[Không có (Chạy tuần tự) | Có thể chạy đồng thời cùng TASK-00Y, TASK-00Z]`
- **Thư mục cô lập chính (Primary Folder)**: `[src/modules/...]`
- **Các file dùng chung chỉ được thêm dòng mới (Shared Files Touchpoint)**: `[VD: src/app.module.ts, .env.example, README.md]` *(Skill `/merge` sẽ tự động hợp nhất các file này)*.

---

## 2. Điều kiện Nghiệm thu (Acceptance Criteria - AC)

Developer Agent (`/dev`) bắt buộc phải thoả mãn các tiêu chí sau:
- [ ] **AC-1 (Happy Path)**: Khi [điều kiện đầu vào hợp lệ], hệ thống phải [kết quả mong đợi].
- [ ] **AC-2 (Validation / Edge Case)**: Khi [dữ liệu thiếu / sai định dạng / trùng lặp], hệ thống phải trả về lỗi rõ ràng với mã trạng thái phù hợp.
- [ ] **AC-3 (State / Persistence)**: Dữ liệu được lưu trữ/cập nhật chính xác theo đúng ràng buộc nghiệp vụ.

---

## 3. Đặc tả Kỹ thuật cho Developer Agent (Trích xuất từ `SRS.md`)

### A. Cấu trúc File / Module Cần Tạo hoặc Chỉnh Sửa
- Liệt kê cụ thể các file/thư mục dự kiến trong ranh giới `File Ownership Boundary`.

### B. Thiết kế Database Schema / Migration (Nếu có)
- Các bảng, cột, kiểu dữ liệu, khoá ngoại (FK), và index cần tạo.
- **Quy tắc bắt buộc**: Nếu thêm database trigger trong migration, bắt buộc phải có `DROP TRIGGER IF EXISTS ...` trước khi tạo trigger.

### C. Thiết kế API Contract / Giao diện (Nếu có)
- **Method & Endpoint**: `POST /api/v1/...`
- **Request Payload / Params**:
  ```json
  {
    "field": "type (validation rule)"
  }
  ```
- **Response Codes**: `200/201`, `400 Bad Request`, `401/403`, `404 Not Found`, `409 Conflict`.

### D. Các Trường hợp Biên cần xử lý (Edge Cases)
1. **[Edge Case 1]**: ...
2. **[Edge Case 2]**: ...

---

## 4. Các Bước Triển khai trên Git Worktree (Implementation Steps)

Khi chạy `/dev [TICKET_ID]`, Developer Agent sẽ thực hiện tuần tự:
- [ ] **Bước 1 (Cô lập Worktree)**: Tạo/chuyển vào Git Worktree `.worktrees/[TICKET_ID]` với nhánh riêng `feat/[TICKET_ID]`.
- [ ] **Bước 2 (Database & Core Logic)**: Tạo Migration (nếu có) & triển khai Repository/Service trong vùng file được phân công.
- [ ] **Bước 3 (API & Swagger)**: Triển khai Controller/Route, Validation và cập nhật **Swagger / OpenAPI**.
- [ ] **Bước 4 (Test, Docs & Commit)**: Viết **Unit Test**, cập nhật **`.env.example`** & **Documentation (`README.md`)**, chạy test pass và commit lên nhánh `feat/[TICKET_ID]`.

---

## 5. Definition of Done (DoD)

- [ ] Thoả mãn toàn bộ **Acceptance Criteria (AC)** bên trên.
- [ ] Tuân thủ đúng **File Ownership Boundary** để hạn chế tối đa conflict với các ticket song song cùng Wave.
- [ ] Toàn bộ comment trong code đều được viết bằng **tiếng Anh**.
- [ ] Nếu có thêm trigger trong migration: đã có `DROP TRIGGER IF EXISTS` phía trước.
- [ ] Đã viết/cập nhật **Unit Test** cho tính năng mới và chạy pass.
- [ ] Đã cập nhật **Swagger / OpenAPI**, **`.env.example`**, và **Documentation (`README.md`)**.
- [ ] Đã commit code sạch sẽ trên nhánh `feat/[TICKET_ID]` để sẵn sàng cho lệnh `/merge`.

---

## 6. Nhật ký Dev, Tester, Merge & Nghiệm thu của PO
*(1. Dev `/dev` bàn giao & đổi sang `🧪 READY_FOR_TEST`; 2. Tester `/tester` kiểm thử tính năng/hệ thống & đổi sang `👀 READY_TO_MERGE` hoặc `🐞 BUG_FOUND`; 3. `/merge` gộp nhánh & đổi sang `👀 READY_FOR_REVIEW [MERGED]`; 4. `/po` nghiệm thu `✅ DONE`)*
