# AI Skill & Two-Tier Harness Kit (`Gemini` · `Claude Code` · `OpenAI Codex`)

Bộ cài đặt toàn bộ **6 Skill phát triển sản phẩm (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`) + `archify` + 6 Role Subagents tự động đổi Model/Effort + Global Shared Harness** cho cả 3 công cụ AI: **Google Gemini (Antigravity)**, **Anthropic Claude Code**, và **OpenAI Codex**.

---

## 1. Cách Cài Trên Máy Khác (Đơn Giản Nhất)

1. Clone repo về máy mới:
   ```bash
   git clone git@github.com:duonghv05531/ai-skill-harness-kit.git
   ```
2. Mở thư mục `ai-skill-harness-kit` bằng **Gemini (Antigravity)**, **Claude Code**, hoặc **OpenAI Codex** và nhắn vào khung chat:
   > **`init đi`**

Ngay lập tức, Agent đọc sẵn chỉ dẫn trong repo ([`AGENTS.md`](./AGENTS.md), [`CLAUDE.md`](./CLAUDE.md) và skill [`init`](./.agents/skills/init/SKILL.md)) để tự xử lý từ A–Z:
- **Tự biết hỏi gì**: Hiện câu hỏi trắc nghiệm ngay trên khung chat để bạn chọn cài cho Agent nào (`all` / `gemini` / `claude` / `codex`) và chọn cấu hình Model cho 6 skill (`Optimal` mặc định hoặc `Custom` tùy chỉnh riêng từng skill theo từng agent).
- **Tự biết chạy file nào**: Tự chạy `node "./bin/skill-gen.mjs" init ... --yes` và kiểm tra bằng `node "./bin/skill-gen.mjs" doctor`.
- **Tự biết cài gì**: Cài đủ 6 skill, `archify`, 6 role subagents, Global Harness (`harness.mjs`), hook chặn `&&` (`pre-tool-hook.mjs`) và Global Rules vào máy.

*(Tùy chọn dự phòng nếu muốn chạy tay trên Terminal không qua AI: `npm run init`)*

---

## 2. Danh Mục Model & Effort Mặc Định Theo Từng Agent (`Optimal`)

| Skill | Gemini / Antigravity (`gemini`) | Claude Code (`claude`) | OpenAI Codex (`codex`) |
| :--- | :--- | :--- | :--- |
| **`/ba`** | `pro` | `opus` (`effort: high`) | `gpt-5.4` (`reasoning_effort: high`) |
| **`/dev`** | `pro` | `opus` (`effort: high`) | `gpt-5.4` (`reasoning_effort: high`) |
| **`/harness`** | `pro` | `sonnet` (`effort: high`) | `gpt-5.4` (`reasoning_effort: medium`) |
| **`/merge`** | `flash` | `sonnet` (`effort: medium`) | `gpt-5.4` (`reasoning_effort: medium`) |
| **`/tester`** | `flash` | `haiku` (`effort: high`) | `gpt-5.4-mini` (`reasoning_effort: high`) |
| **`/po`** | `flash` | `haiku` (`effort: medium`) | `gpt-5.4-mini` (`reasoning_effort: medium`) |

---

## 3. Cấu Trúc Thư Mục Chính

- [`AGENTS.md`](./AGENTS.md) & [`CLAUDE.md`](./CLAUDE.md): Chỉ dẫn tự động để Gemini, Codex và Claude Code hiểu ngay lệnh chat **`"init đi"`** khi vừa mở repo.
- [`.agents/skills/init/SKILL.md`](./.agents/skills/init/SKILL.md), [`.claude/skills/init/SKILL.md`](./.claude/skills/init/SKILL.md), [`.codex/skills/init/SKILL.md`](./.codex/skills/init/SKILL.md): Skill onboarding nội bộ cho cả 3 agent.
- [`bin/skill-gen.mjs`](./bin/skill-gen.mjs) & [`src/`](./src/): Bộ CLI và nhân sinh skill, subagent, harness, hook, rules.
- [`templates/`](./templates/): Bản mẫu gốc của 6 skill, `archify`, `harness.mjs`, `pre-tool-hook.mjs` và `ENGINEERING_RULES.md`.
- [`docs/openapi.yaml`](./docs/openapi.yaml) & [`tests/generator.test.mjs`](./tests/generator.test.mjs): Đặc tả OpenAPI (`v1.4.0`) và bộ Unit Test tự động (`npm test`).
