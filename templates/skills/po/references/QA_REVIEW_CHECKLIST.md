# PO & Tech Lead QA / Code Review Checklist

Use this reference guide whenever the Developer (user) submits a completed ticket for review (Phase 5).

---

## 1. Inspection Workflow

1. **Check Git Status & Diff**:
   - Inspect untracked and modified files using `git status` and `git diff` (do not chain shell commands with `&&`).
2. **Read Changed Code**:
   - Read the actual implementation files, tests, migrations, and documentation files touched by the user.
3. **Run Verification Commands**:
   - Run the project's test suite and build/typecheck commands if configured.

---

## 2. Evaluation Rubric

### A. Product & Business Requirements (PO Hat)
- Does the feature fulfill every **Acceptance Criterion (AC)** listed in `docs/product/CURRENT_TICKET.md`?
- Does the happy path work smoothly end-to-end?
- Are user-facing error messages or API error responses clear and helpful?
- Did the Developer stay within scope, or did they accidentally miss part of the requirement?

### B. Engineering & Architecture (Tech Lead Hat)
- **Correctness & Edge Cases**: Are null values, empty arrays, boundary numbers, duplicate entries, and invalid states handled safely?
- **Data Integrity**: Are database transactions, indexes, constraints, and foreign keys properly defined?
- **Security**: Is user input validated/sanitized? Are secrets kept out of source code? Are authorization checks in place?
- **Maintainability**: Are functions/classes modular with clear single responsibilities and meaningful naming?

### C. Mandatory Global User Rules (Strict Enforcement)
- [ ] **English Comments Only**: Are all code comments and docstrings written in **English**? (Flag any Vietnamese comments in code as `[MAJOR]`).
- [ ] **Safe Trigger Migrations**: If any SQL/DB migration adds a trigger, does it include `DROP TRIGGER IF EXISTS` before creating the trigger? (Flag missing drop statements as `[BLOCKER]`).
- [ ] **Unit Tests**: Were unit tests added/updated for the new feature, and do they test both happy path and edge cases? (Flag missing tests as `[MAJOR]`).
- [ ] **Swagger / OpenAPI**: If API routes or DTOs were added/modified, was the Swagger documentation updated? (Flag missing Swagger updates as `[MAJOR]`).
- [ ] **Project Documentation**: If a new feature, library, or setup step was introduced, was `README.md` or relevant documentation updated? (Flag missing docs as `[MINOR]` or `[MAJOR]`).

---

## 3. Review Output Format (in Vietnamese)

Present the review results clearly in Vietnamese using this structure:

```markdown
## 📋 Kết quả Nghiệm thu & Review: [TICKET_ID] - [Tên Task]

**Quyết định**: `✅ APPROVED (Đạt chuẩn - Hoàn thành Task)` hoặc `🔄 CHANGES REQUESTED (Cần bổ sung/chỉnh sửa)`

### 1. Điểm làm tốt (Highlights)
- Khen ngợi các điểm Dev đã thiết kế hoặc xử lý tốt (cấu trúc code, cách bắt lỗi, test coverage...).

### 2. Kiểm tra Acceptance Criteria & Definition of Done
- [x] AC-1: ...
- [x] AC-2: ...
- [x] Comment tiếng Anh
- [x/ ] Unit Test
- [x/ ] Swagger / Documentation
- [x/ ] Migration Trigger rule (nếu có)

### 3. Chi tiết Feedback cần xử lý (Nếu có)
- 🔴 **[BLOCKER]** [ten_file.ts](file:///duong/dan/tuyet/doi/ten_file.ts#L10-L20): Mô tả vấn đề nghiêm trọng (lỗi chạy, sai yêu cầu cốt lõi, thiếu `DROP TRIGGER IF EXISTS`...) và gợi ý hướng sửa (không viết sẵn toàn bộ code thay Dev).
- 🟠 **[MAJOR]** [ten_file.ts](file:///duong/dan/tuyet/doi/ten_file.ts#L30-L45): Thiếu xử lý edge case, thiếu unit test, thiếu Swagger, hoặc comment bằng tiếng Việt.
- 🟡 **[MINOR / NIT]** [ten_file.ts](file:///duong/dan/tuyet/doi/ten_file.ts#L50): Gợi ý tối ưu cách đặt tên, tách hàm, cải thiện hiệu năng.

### 4. Bước tiếp theo (Next Steps)
- Nếu `APPROVED`: Đã cập nhật `BACKLOG.md` sang `DONE`. Bạn đã sẵn sàng nhận `TASK-00X` tiếp theo chưa?
- Nếu `CHANGES REQUESTED`: Hãy sửa các mục 🔴 và 🟠 bên trên rồi nhắn mình review lại nhé!
```
