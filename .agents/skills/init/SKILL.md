---
name: init
description: >-
  Bootstrap and install the 6 workflow skills (/ba, /harness, /po, /dev, /tester, /merge),
  archify, 6 role subagents, and Global Shared Harness onto the current machine when the
  user chats "init", "init đi", "setup", or "cài skill" inside this repository.
---

# Repository Onboarding Skill (`init` / `"init đi"`)

Activate this skill immediately whenever the user pulls this repository onto a machine and says **`init`**, **`init đi`**, **`setup`**, or **`cài skill`**.

Do **NOT** ask the user to type terminal commands themselves. You handle asking the options in chat and running the installer script directly.

---

## Step 1 — Hỏi Gì (Ask Options in Chat UI)

Use your interactive question tool (`ask_question` on Antigravity/Gemini, `AskUserQuestion` on Claude Code, or a short numbered question on Codex) to ask **2 quick questions** in Vietnamese:

1. **Cài đặt cho Agent nào trên máy này?**
   - `(Recommended) Cả 3: Gemini (Antigravity) + Claude Code + OpenAI Codex` -> `--target all`
   - `Chỉ Google Gemini / Antigravity` -> `--target gemini`
   - `Chỉ Anthropic Claude Code` -> `--target claude`
   - `Chỉ OpenAI Codex` -> `--target codex`

2. **Chọn cấu hình Model & Effort cho 6 Skill (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`)?**
   - `(Recommended) Tháp Tối Ưu Mặc Định (Optimal — Cân bằng Trí tuệ & Chi phí)` -> `--preset optimal`
   - `Tùy chỉnh Model riêng cho từng Skill theo từng Agent (Custom)` -> custom per-agent flags
   - `Max Intelligence (Mạnh nhất cho cả 6 skill)` -> `--preset max`
   - `Economy (Tiết kiệm Token tối đa)` -> `--preset economy`

### If the user selects `Tùy chỉnh Model riêng (Custom)`:
Ask a follow-up question **only for the Agent(s) chosen in Question 1** using that agent's valid model/effort catalog (you can also inspect `./bin/skill-gen.mjs models` if needed):
- **Google Gemini / Antigravity (`gemini`)**:
  - Allowed models: `pro`, `flash`, `flash_lite`, `inherit`
  - Recommended baseline: `ba=pro,harness=pro,po=flash,dev=pro,tester=flash,merge=flash`
- **Anthropic Claude Code (`claude`)**:
  - Allowed models: `opus`, `sonnet`, `haiku`, `inherit` | Allowed efforts: `low`, `medium`, `high`, `max`
  - Recommended baseline: `ba=opus:high,harness=sonnet:high,po=haiku:medium,dev=opus:high,tester=haiku:high,merge=sonnet:medium`
- **OpenAI Codex (`codex`)**:
  - Allowed models: `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `o3`, `o4-mini` | Allowed efforts: `low`, `medium`, `high`
  - Recommended baseline: `ba=gpt-5.4:high,harness=gpt-5.4:medium,po=gpt-5.4-mini:medium,dev=gpt-5.4:high,tester=gpt-5.4-mini:high,merge=gpt-5.4:medium`

---

## Step 2 — Chạy File Nào (Run `./bin/skill-gen.mjs` Without `&&`)

Run each command separately (never chain commands with `&&`):

1. **Execute installation**:
   - If using a preset (`optimal`, `max`, or `economy`):
     ```bash
     node "./bin/skill-gen.mjs" init --target <target> --preset <preset> --yes
     ```
   - If using `Custom` per-agent models:
     ```bash
     node "./bin/skill-gen.mjs" init --target <target> --yes --gemini-models "<...>" --claude-models "<...>" --codex-models "<...>"
     ```
     *(Include only the `--<agent>-models` flag(s) for the selected target agent(s).)*

2. **Verify health via `doctor`**:
   ```bash
   node "./bin/skill-gen.mjs" doctor
   ```

---

## Step 3 — Cài Gì & Báo Cáo Kết Quả (What Was Installed)

Confirm in **Vietnamese** that the following components are now installed globally on this machine:
1. **6 Workflow Skills + `archify`**: `/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`, and `archify`.
2. **6 Auto-Switched Role Subagents**: `ba`, `harness`, `po`, `dev`, `tester`, `merge` pre-configured with the exact chosen Model & Effort per agent.
3. **Global Shared Harness & Safety Guard**: `harness.mjs`, `pre-tool-hook.mjs` (blocks `&&`), and Global Engineering Rules (`GEMINI.md` / `CLAUDE.md` / `AGENTS.md`).
4. If `gemini` (Antigravity) was installed, remind the user to **reload Antigravity once** so all 6 subagents appear in `Available subagents`.
