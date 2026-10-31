# Product Backlog & Parallel Roadmap: [Tên Dự Án]

> **Tài liệu liên kết**: [PRD.md](./PRD.md) | [SRS.md](./SRS.md) | 📌 **Con trỏ Ticket / Đợt Hiện Tại**: [CURRENT_TICKET.md](./CURRENT_TICKET.md)
> **Tiến độ MVP**: `0 / N` Tickets hoàn thành

---

## Quy ước Trạng thái & Nhóm Song Song (Legend)
- `TODO`: Chưa bắt đầu
- `👉 IN_PROGRESS [ACTIVE]`: **Đang được PO (`/po`) mở khoá trong `CURRENT_TICKET.md`** — Bạn có thể gõ `/dev <TICKET_ID>` để làm
- `🌿 WORKTREE_CODING [feat/TASK-XXX]`: Đang được Dev (`/dev`) code trên nhánh worktree riêng `.worktrees/TASK-XXX`
- `🧪 READY_FOR_TEST [feat/TASK-XXX]`: Dev đã code xong, chờ gọi `/tester` để kiểm thử tính năng & bắt lỗi hệ thống
- `🐞 BUG_FOUND [feat/TASK-XXX]`: Tester (`/tester`) phát hiện lỗi, chờ gọi `/dev <TICKET_ID>` để sửa bug
- `👀 READY_TO_MERGE [feat/TASK-XXX]`: Tester đã xác nhận PASS, chờ gọi `/merge` để gộp về nhánh chính
- `👀 READY_FOR_REVIEW [MERGED]`: Đã `/merge` về nhánh chính và pass test tích hợp, chờ PO (`/po`) nghiệm thu
- `🔄 CHANGES_REQUESTED [ACTIVE]`: PO (`/po`) yêu cầu Dev (`/dev`) sửa lại
- `✅ DONE`: Đã được PO (`/po`) nghiệm thu hoàn tất

### Quy ước Cột "Nhóm Song Song (Parallel Wave)"
- `🔒 SEQ-1`, `🔒 SEQ-2`: **Tuần tự (Sequential)** — Phải làm từng ticket một vì các task sau phụ thuộc vào khung/DB của task này.
- `⚡ PARA-W1`, `⚡ PARA-W2`: **Song song (Parallel Wave)** — Các ticket có **cùng mã `⚡ PARA-W*`** đã được BA & PO kiểm tra khác vùng file (File Boundary), bạn có thể **mở nhiều đoạn chat chạy `/dev TASK-00X` cùng một lúc** trên các Git Worktree riêng mà không sợ conflict code!

---

## Đợt 1 (Foundation - Chạy Tuần Tự): Khởi tạo Khung & Database Nền tảng
*Mục tiêu: Tạo cấu trúc dự án và DB nền tảng trước khi tách nhánh làm song song.*

| Ticket ID | Tên Task (Title) | Nhóm Song Song (Wave) | Vùng File Chạm (File Boundary) | Phụ thuộc | File Chi Tiết | Trạng thái |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **TASK-001** | Khởi tạo cấu trúc dự án, `.env.example` & Swagger | `🔒 SEQ-1` | `src/config/`, `src/main.*` | - | [TASK-001.md](./tickets/TASK-001.md) | `👉 IN_PROGRESS [ACTIVE]` |
| **TASK-002** | Thiết kế Database Schema & Migration nền tảng | `🔒 SEQ-2` | `migrations/`, `src/database/` | TASK-001 | [TASK-002.md](./tickets/TASK-002.md) | `TODO` |

---

## Đợt 2 (Core Features - ⚡ Chạy Song Song Được): Các Phân hệ Nghiệp vụ Độc lập
*Mục tiêu: Các ticket cùng thuộc `⚡ PARA-W1` chạm vào các thư mục module hoàn toàn tách biệt. Bạn có thể mở nhiều tab chat và chạy `/dev TASK-003`, `/dev TASK-004` cùng lúc!*

| Ticket ID | Tên Task (Title) | Nhóm Song Song (Wave) | Vùng File Chạm (File Boundary) | Phụ thuộc | File Chi Tiết | Trạng thái |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **TASK-003** | [Tính năng A] *(Làm song song được với TASK-004)* | `⚡ PARA-W1` | `src/modules/module-a/` | TASK-002 | [TASK-003.md](./tickets/TASK-003.md) | `TODO` |
| **TASK-004** | [Tính năng B] *(Làm song song được với TASK-003)* | `⚡ PARA-W1` | `src/modules/module-b/` | TASK-002 | [TASK-004.md](./tickets/TASK-004.md) | `TODO` |

---

## Đợt 3 (Integration & Polish): Hoàn thiện & Kiểm thử Tích hợp

| Ticket ID | Tên Task (Title) | Nhóm Song Song (Wave) | Vùng File Chạm (File Boundary) | Phụ thuộc | File Chi Tiết | Trạng thái |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **TASK-005** | Validation tổng thể, Error Handling & Integration Tests | `🔒 SEQ-3` | `src/common/`, `test/` | TASK-003, TASK-004 | [TASK-005.md](./tickets/TASK-005.md) | `TODO` |

---

## Nhật ký Nghiệm thu của PO (Completed Log)
- *(Chưa có ticket nào hoàn thành)*
