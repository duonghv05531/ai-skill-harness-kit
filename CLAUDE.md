# AI Skill & Harness Kit — Claude Code Instructions

This repository is the portable installer for the **6 Product Lifecycle Skills (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`) + `archify` + 6 Auto-Switched Role Subagents + Two-Tier Harness** across **Google Gemini (Antigravity)**, **Anthropic Claude Code**, and **OpenAI Codex**.

## Mandatory Onboarding Trigger: When User Says `"init"` / `"init đi"` / `"cài skill"`

Whenever the user opens this repository on a machine and chats **`init`**, **`init đi`**, **`setup`**, or **`cài đặt`**, read [`.claude/skills/init/SKILL.md`](./.claude/skills/init/SKILL.md) and execute this exact 3-step flow:

1. **Hỏi gì (Ask via `AskUserQuestion` or concise multiple-choice prompt)**:
   - **Question 1 — Chọn Agent cần cài trên máy này**:
     - `(Recommended) Cả 3: Gemini (Antigravity) + Claude Code + OpenAI Codex` (`all`)
     - `Chỉ Anthropic Claude Code` (`claude`)
     - `Chỉ Google Gemini / Antigravity` (`gemini`)
     - `Chỉ OpenAI Codex` (`codex`)
   - **Question 2 — Chọn cấu hình Model & Effort cho 6 Skill (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`)**:
     - `(Recommended) Tháp Tối Ưu Mặc Định (Optimal — Cân bằng Trí tuệ & Chi phí)` (`optimal`)
     - `Tùy chỉnh Model riêng cho từng Skill theo từng Agent (Custom)` (`custom`)
     - `Max Intelligence (Mạnh nhất cho cả 6 skill: pro / opus:high / gpt-5.4:high)` (`max`)
     - `Economy (Tiết kiệm Token tối đa)` (`economy`)
   - **If user chooses `Custom`**: Ask which model (and effort) they want for the 6 skills **only for the Agent(s) selected in Question 1**:
     - `claude`: models `opus`, `sonnet`, `haiku`, `inherit` + effort `low`, `medium`, `high`, `max` (Default: `ba=opus:high,harness=sonnet:high,po=haiku:medium,dev=opus:high,tester=haiku:high,merge=sonnet:medium`)
     - `gemini`: `pro`, `flash`, `flash_lite`, `inherit` (Default: `ba=pro,harness=pro,po=flash,dev=pro,tester=flash,merge=flash`)
     - `codex`: models `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `o3`, `o4-mini` + effort `low`, `medium`, `high` (Default: `ba=gpt-5.4:high,harness=gpt-5.4:medium,po=gpt-5.4-mini:medium,dev=gpt-5.4:high,tester=gpt-5.4-mini:high,merge=gpt-5.4:medium`)

2. **Chạy file nào (Run Installer & Health Check — NEVER use `&&`)**:
   - Run `./bin/skill-gen.mjs` with `--yes` and the user's selected flags:
     ```bash
     node "./bin/skill-gen.mjs" init --target <all|gemini|claude|codex> --preset <optimal|max|economy> --yes
     ```
     *(If `Custom`, append `--claude-models "..."`, `--gemini-models "..."`, and/or `--codex-models "..."`.)*
   - Verify health in a separate command (never use `&&`):
     ```bash
     node "./bin/skill-gen.mjs" doctor
     ```

3. **Cài gì & Báo cáo**:
   - Installs all 6 skills (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`), `archify`, 6 auto-switched subagents, Global Shared Harness (`harness.mjs`), `PreToolUse` `&&` hook, and Global Engineering Rules.
   - Reply concisely in **Vietnamese** summarizing what was installed.

## Repository Engineering Rules
- Always reply to the user in **Vietnamese**.
- Always write source code comments in **English**.
- Never chain shell commands using `&&`.
