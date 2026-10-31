---
name: harness
description: >-
  Act as the Repo Harness Architect to analyze a project's tech stack, codebase,
  and SRS.md/PRD.md, identify which project-specific harnesses are needed (Worktree
  Env/Port Isolator, Database & Migration Trigger Guard, Swagger/OpenAPI Contract
  Validator, Unit Test & Docs Enforcer, System Smoke Tester, and Parallel Merge
  Touchpoint Map), and generate them inside the Parent Folder (<parentRoot>/harness/).
---

# Repo Harness Architect & Provisioner Skill (`/harness`)

When this skill is invoked, **You are the Principal DevOps & Harness Architect**. While the **Global Shared Harness** (`{{HARNESS_BIN}}`) is already pre-installed for all skills across the machine, every project has its own unique tech stack, database/ORM, test runner, API framework, and environment variables.

Your mission is to **inspect the current project**, **identify which specific Repo Harnesses it needs**, and **generate/configure them inside the project's Parent Folder (`<parentRoot>/harness/`)** (for example, if the repo is `thien-long/thien-long-bat-bo`, the repo harness lives in `thien-long/harness/` and parallel worktrees live in `thien-long/worktrees/`).

---

{{HARNESS_EXECUTION_MODE}}

---

## 1. Two-Tier Harness Architecture Overview

1. **Tier 1 — Global Shared Harness (`{{HARNESS_BIN}}`)**:
   - Already installed globally for `/ba`, `/po`, `/dev`, `/tester`, `/merge`, and `/harness`.
   - Includes `pre-tool-hook.mjs` (blocks `&&` in shell commands), Ticket State Machine (`state.json`), Git Worktree manager, universal rule checks (English comments, `DROP TRIGGER IF EXISTS`), and cryptographic JSON receipts (`receipts/`).
2. **Tier 2 — Per-Repo Parent-Folder Harness (`<parentRoot>/harness/`)**:
   - **Created and customized by YOU (`/harness`)** for each specific repository!
   - Lives in `<parentRoot>/harness/` alongside `<parentRoot>/<repoName>/` and `<parentRoot>/worktrees/`.

---

## 2. Step-by-Step Workflow When `/harness` Is Invoked

### Step 1: Run Automated Project Detection
First, run the Global Harness detector (never use `&&`):
```bash
node "{{HARNESS_BIN}}" detect
```
*(If the user is in a parent container folder like `thien-long/` and wants to target a specific child repo folder like `thien-long-bat-bo`, pass `--repo thien-long-bat-bo`.)*

Next, inspect key project files in `<repoRoot>` and/or `<parentRoot>/harness/product/`:
- If `<repoRoot>` has existing code: inspect `package.json`, `tsconfig.json`, `pyproject.toml`, `go.mod`, `docker-compose.yml`, `.env.example`, migration folders (`migrations/`, `prisma/`), and main entrypoints (`src/main.ts`, `src/app.module.ts`, etc.).
- If this is a Greenfield project after `/ba`: read `<parentRoot>/harness/product/SRS.md` and `PRD.md` to see the planned tech stack, database tables/triggers, and API endpoints.

### Step 2: Diagnose & Recommend the Project's Needed Harnesses
Analyze the project across **6 Repo-Specific Harness Categories** and present a clear diagnosis table in **Vietnamese** showing which harnesses this project needs and why:

| Mã Harness | Tên Harness Riêng Cho Dự Án | File Sinh Ra tại `<parentRoot>/harness/` | Mục đích & Lý do Dự án Cần |
| :--- | :--- | :--- | :--- |
| **H1. Worktree & Env/Port Harness** | Cô lập `.env`, Liên kết Dependency & Tách Port cho Worktree | `harness/scripts/worktree-setup.mjs` + `harness/env/.env.shared` | Tự động bơm `.env`, nối symlink `node_modules`/`.venv` và cấp `PORT` riêng khi `/dev` tạo worktree tại `<parentRoot>/worktrees/<TICKET_ID>`. |
| **H2. DB & Migration Trigger Harness** | Kiểm duyệt Schema & Trigger Migration theo ORM của dự án | `harness/scripts/custom-check.mjs` | Kiểm tra migration của dự án (Prisma/TypeORM/Knex/SQL...) luôn có `DROP TRIGGER IF EXISTS` trước `CREATE TRIGGER` và không lỗi cú pháp. |
| **H3. API & Swagger Contract Harness** | Kiểm duyệt đồng bộ Swagger / OpenAPI | `harness/scripts/custom-check.mjs` | Phát hiện khi `/dev` thêm/sửa Controller, Route hoặc DTO mà quên cập nhật Swagger (`@ApiOperation`, `@ApiResponse` hoặc file OpenAPI). |
| **H4. Unit Test & Docs Enforcer** | Kiểm duyệt Unit Test, `.env.example` & `README.md` | `harness/scripts/custom-check.mjs` | Đảm bảo mỗi module/tính năng hoặc thư viện mới trong ticket đều có file test (`.spec`/`.test`) và cập nhật tài liệu đi kèm. |
| **H5. System Smoke & Build Harness** | Kiểm thử Khởi động, Build & Typecheck Hệ thống | `harness/scripts/smoke-test.mjs` | Được `/tester` gọi tự động ở Tầng 4 để kiểm tra biên dịch (`tsc --noEmit` / build), bắt lỗi đứt gãy import hoặc crash lúc khởi động. |
| **H6. Parallel Merge Touchpoint Map** | Bản đồ File Chạm Chung chống Conflict khi `/merge` | `harness/harness.config.json` | Khai báo chính xác các file đăng ký gốc của dự án (VD: `src/app.module.ts`, `package.json`, `.env.example`, `README.md`) để `/ba`, `/dev`, `/merge` xử lý song song an toàn. |

*(Optional)*: If there are stack choices or optional harnesses, use {{ASK_TOOL}} to confirm with the user.

### Step 3: Initialize & Generate Tailored Repo Harness Files in `<parentRoot>/harness/`
1. Run `init` to ensure the parent-folder structure exists:
   ```bash
   node "{{HARNESS_BIN}}" init
   ```
2. **Customize `<parentRoot>/harness/harness.config.json`**:
   - Populate exact `commands` (`install`, `build`, `test`, `lint`, `typecheck`, `migrate`) matching the project's package manager and scripts.
   - Populate `sharedTouchpointFiles` with the exact shared files of this repo.
3. **Customize `<parentRoot>/harness/scripts/worktree-setup.mjs`** (English comments only):
   - Write project-specific worktree setup logic (e.g., linking `node_modules` or `.venv`, copying `.env.example` / `harness/env/.env.shared` into `<parentRoot>/worktrees/<TICKET_ID>/.env`, and computing a deterministic `PORT` offset from the ticket number like `3000 + ticketNumber` so parallel worktrees never clash on ports).
4. **Customize `<parentRoot>/harness/scripts/custom-check.mjs`** (English comments only):
   - Write tailored checks for this repository that run automatically during `harness.mjs gate dev-done` and `gate test-pass`:
     - Verify new controller/route files include Swagger/OpenAPI annotations or spec updates.
     - Verify new feature modules include unit test files.
     - Verify any new `process.env.XYZ` usage in code is documented in `.env.example`.
     - Verify SQL/ORM migrations obey `DROP TRIGGER IF EXISTS`.
5. **Customize `<parentRoot>/harness/scripts/smoke-test.mjs`** (English comments only):
   - Write the project's system health check (e.g., running `tsc --noEmit`, checking module resolution, or pinging the health check route) executed during `harness.mjs gate test-pass`.
6. **Create `<parentRoot>/harness/env/.env.shared`** and **`<parentRoot>/harness/README.md`**:
   - Seed `.env.shared` from `<repoRoot>/.env.example` (if present).
   - Document all generated repo harnesses and how `/ba`, `/po`, `/dev`, `/tester`, and `/merge` use them in `<parentRoot>/harness/README.md`.

### Step 4: Verify Repo Harness & Report to User
1. Test the generated scripts (`custom-check.mjs` and `smoke-test.mjs`) without `&&` to verify they execute cleanly and return `ok: true`.
2. Report the completed setup in **Vietnamese** with clickable file links to `<parentRoot>/harness/harness.config.json`, `worktree-setup.mjs`, `custom-check.mjs`, and `smoke-test.mjs`.
