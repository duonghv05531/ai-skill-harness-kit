# Software Requirements Specification (SRS): [Tên Dự Án]

> **Người lập**: Business Analyst & System Analyst (`/ba`)
> **Tài liệu liên kết**: [PRD.md](./PRD.md) | Sơ đồ trực quan tại `docs/product/diagrams/`
> **Mục đích**: Làm nguồn đầu vào chuẩn xác để Project Owner (`/po`) bóc tách thành các Ticket và đánh dấu các **Nhóm Làm Song Song (Parallel Waves)** trong `BACKLOG.md` và `CURRENT_TICKET.md`.

---

## 1. Thiết kế Cơ sở Dữ liệu Chi tiết (Database Schema & ERD)

> **Quy tắc Migration bắt buộc**: Khi thêm migration có chứa trigger, bắt buộc phải có `DROP TRIGGER IF EXISTS ...` trước câu lệnh tạo trigger.

### 1.1. Bảng `[table_name]`
| Cột (Column) | Kiểu dữ liệu (Type) | Ràng buộc (Constraints) | Mô tả (Description) |
| :--- | :--- | :--- | :--- |
| `id` | `UUID / BIGINT` | `PK` | Định danh duy nhất |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Thời điểm tạo |

- **Indexes**: `[Danh sách index cần đánh]`
- **Triggers (nếu có)**: `[Mô tả trigger + lưu ý DROP TRIGGER IF EXISTS]`

---

## 2. Đặc tả Chi tiết Từng Phân hệ & Ranh giới File (Functional Specs & File Boundaries)

### [F-01] Tên Tính năng 1
- **Actor**: [Người dùng / Hệ thống]
- **Ranh giới Thư mục / Module (File Ownership Boundary)**: `src/modules/[module-a]/` *(Cô lập để tránh conflict khi chạy song song)*
- **Bảng DB sử dụng**: `[table_a]`
- **Mô tả luồng chính (Main Flow)**:
  1. Bước 1...
  2. Bước 2...
- **Quy tắc Nghiệp vụ (Business Rules)**:
  - `BR-01`: ...
- **Đặc tả API (API Contracts)**:
  - **Endpoint**: `POST /api/v1/...`
  - **Request Body / Query**:
    ```json
    {
      "field": "type (validation rules)"
    }
    ```
  - **Response**: `200/201`, `400`, `401/403`, `404`, `409`.
- **Các Trường hợp Biên & Ngoại lệ (Edge Cases)**:
  - `EC-01`: ...
- **Điều kiện Nghiệm thu Chuẩn (Acceptance Criteria)**:
  - [ ] `AC-1`: ...
  - [ ] `AC-2`: ...

---

## 3. Phân tích Khả năng Chạy Song Song & Chống Conflict (Parallel Execution Matrix)

*BA đánh giá sự phụ thuộc và vùng chạm file để đề xuất gom nhóm các task có thể mở nhiều Git Worktrees làm đồng thời:*

| Đợt (Wave) | Chế độ | Các Tính năng / Module trong Đợt | Vùng File Chạm (File Boundaries) | Lý do không Conflict / Lưu ý khi Merge (`/merge`) |
| :--- | :---: | :--- | :--- | :--- |
| **WAVE-1 (Nền tảng)** | `Tuần tự (Sequential)` | Khởi tạo Project, DB Schema gốc, Auth cơ bản | `src/config/`, `migrations/`, `src/common/` | Phải hoàn thành trước để làm khung cho các nhánh song song. |
| **WAVE-2 (Song song A)** | `⚡ Song song (Parallel)` | `[F-01]` Module A + `[F-02]` Module B | `src/modules/a/` vs `src/modules/b/` | Hoàn toàn tách biệt thư mục; chỉ chạm chung file đăng ký route gốc (`app.module` / `routes/index`). |
| **WAVE-3 (Song song B)** | `⚡ Song song (Parallel)` | `[F-03]` Module C + `[F-04]` Module D | `src/modules/c/` vs `src/modules/d/` | Độc lập logic và bảng dữ liệu. |

---

## 4. Quy chuẩn Kỹ thuật Toàn Dự án (Global Engineering Constraints)
1. **Comment tiếng Anh**: Toàn bộ comment trong source code phải viết bằng **tiếng Anh**.
2. **Database Trigger Rule**: Mọi migration tạo trigger phải có `DROP TRIGGER IF EXISTS` phía trước.
3. **Tự động cập nhật đầy đủ**: Mỗi khi thêm tính năng hoặc thư viện mới, Developer (`/dev`) bắt buộc phải cập nhật **Unit Test**, **Swagger / OpenAPI**, **`.env.example`**, và **Documentation (`README.md`)**.
