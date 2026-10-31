# AI Skill & Harness Kit — Repository Agent Instructions

This repository is the portable installer for the **6 Product Lifecycle Skills (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`) + `archify` + 6 Auto-Switched Role Subagents + Two-Tier Harness** across **Google Gemini (Antigravity)**, **Anthropic Claude Code**, and **OpenAI Codex**.

## Mandatory Onboarding Trigger: When User Says `"init"` / `"init đi"` / `"cài skill"`

Whenever the user opens this repository on a machine and says **`init`**, **`init đi`**, **`setup`**, or **`cài đặt`**, read [`.agents/skills/init/SKILL.md`](./.agents/skills/init/SKILL.md) and execute this exact 3-step flow:

1. **Hỏi gì (Ask via Interactive Chat UI — `ask_question` or concise numbered options)**:
   - **Question 1 — Chọn Agent cần cài trên máy này**:
     - `(Recommended) Cả 3: Gemini (Antigravity) + Claude Code + OpenAI Codex` (`all`)
     - `Chỉ Google Gemini / Antigravity` (`gemini`)
     - `Chỉ Anthropic Claude Code` (`claude`)
     - `Chỉ OpenAI Codex` (`codex`)
   - **Question 2 — Chọn cấu hình Model & Effort cho 6 Skill (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`)**:
     - `(Recommended) Tháp Tối Ưu Mặc Định (Optimal — Cân bằng Trí tuệ & Chi phí)` (`optimal`)
     - `Tùy chỉnh Model riêng cho từng Skill theo từng Agent (Custom)` (`custom`)
     - `Max Intelligence (Mạnh nhất cho cả 6 skill: pro / opus:high / gpt-5.4:high)` (`max`)
     - `Economy (Tiết kiệm Token tối đa)` (`economy`)
   - **If user chooses `Custom`**: Ask the user which model (and effort) they want for the 6 skills **only for the Agent(s) selected in Question 1**, using each agent's valid options:
     - `gemini`: `pro`, `flash`, `flash_lite`, `inherit` (Default optimal: `ba=pro,harness=pro,po=flash,dev=pro,tester=flash,merge=flash`)
     - `claude`: models `opus`, `sonnet`, `haiku`, `inherit` + effort `low`, `medium`, `high`, `max` (Default optimal: `ba=opus:high,harness=sonnet:high,po=haiku:medium,dev=opus:high,tester=haiku:high,merge=sonnet:medium`)
     - `codex`: models `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `o3`, `o4-mini` + effort `low`, `medium`, `high` (Default optimal: `ba=gpt-5.4:high,harness=gpt-5.4:medium,po=gpt-5.4-mini:medium,dev=gpt-5.4:high,tester=gpt-5.4-mini:high,merge=gpt-5.4:medium`)

2. **Chạy file nào (Run Installer & Health Check — NEVER use `&&`)**:
   - Execute `./bin/skill-gen.mjs` non-interactively with the user's answers:
     ```bash
     node "./bin/skill-gen.mjs" init --target <all|gemini|claude|codex> --preset <optimal|max|economy> --yes
     ```
     *(If `Custom`, append `--gemini-models "..."`, `--claude-models "..."`, and/or `--codex-models "..."` matching their choices.)*
   - Run verification right after (as a separate command, never chained with `&&`):
     ```bash
     node "./bin/skill-gen.mjs" doctor
     ```

3. **Cài gì & Báo cáo (What Gets Installed)**:
   - Installs globally into `~/.gemini/config/`, `~/.claude/`, and/or `~/.codex/`:
     - All 6 skills (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`) + `archify`
     - All 6 auto-switched role subagents (`ba`, `harness`, `po`, `dev`, `tester`, `merge`) with the chosen models & efforts
     - Global Shared Harness (`harness.mjs`), `PreToolUse` `&&` guard hook (`pre-tool-hook.mjs`), and Global Engineering Rules
   - Always reply in **Vietnamese** with a brief summary of installed targets/models (and remind the user to reload Antigravity once if `gemini` was installed).

## Repository Engineering Rules
- Always reply to the user in **Vietnamese**.
- Always write source code comments in **English**.
- Never chain shell commands using `&&`.
