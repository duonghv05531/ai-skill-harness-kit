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

## Step 1 — Hỏi Gì (Ask Options in Chat)

Ask **2 concise multiple-choice questions** in Vietnamese:

1. **Cài đặt cho Agent nào trên máy này?**
   - `(Recommended) Cả 3: Gemini (Antigravity) + Claude Code + OpenAI Codex` -> `--target all`
   - `Chỉ OpenAI Codex` -> `--target codex`
   - `Chỉ Google Gemini / Antigravity` -> `--target gemini`
   - `Chỉ Anthropic Claude Code` -> `--target claude`

2. **Chọn cấu hình Model & Effort cho 6 Skill (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`)?**
   - `(Recommended) Tháp Tối Ưu Mặc Định (Optimal — Cân bằng Trí tuệ & Chi phí)` -> `--preset optimal`
   - `Tùy chỉnh Model riêng cho từng Skill theo từng Agent (Custom)` -> custom per-agent flags
   - `Max Intelligence (Mạnh nhất cho cả 6 skill)` -> `--preset max`
   - `Economy (Tiết kiệm Token tối đa)` -> `--preset economy`

### If the user selects `Tùy chỉnh Model riêng (Custom)`:
Ask which model & effort they want **only for the Agent(s) chosen in Question 1**:
- **OpenAI Codex (`codex`)**:
  - Allowed models: `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `o3`, `o4-mini` | Allowed efforts: `low`, `medium`, `high`
  - Recommended baseline: `ba=gpt-5.4:high,harness=gpt-5.4:medium,po=gpt-5.4-mini:medium,dev=gpt-5.4:high,tester=gpt-5.4-mini:high,merge=gpt-5.4:medium`
- **Google Gemini / Antigravity (`gemini`)**:
  - Allowed models: `pro`, `flash`, `flash_lite`, `inherit`
  - Recommended baseline: `ba=pro,harness=pro,po=flash,dev=pro,tester=flash,merge=flash`
- **Anthropic Claude Code (`claude`)**:
  - Allowed models: `opus`, `sonnet`, `haiku`, `inherit` | Allowed efforts: `low`, `medium`, `high`, `max`
  - Recommended baseline: `ba=opus:high,harness=sonnet:high,po=haiku:medium,dev=opus:high,tester=haiku:high,merge=sonnet:medium`

---

## Step 2 — Chạy File Nào (Run `./bin/skill-gen.mjs` Without `&&`)

Run each command separately (never chain commands with `&&`):

1. **Execute installation**:
   - Preset mode:
     ```bash
     node "./bin/skill-gen.mjs" init --target <target> --preset <preset> --yes
     ```
   - Custom per-agent mode:
     ```bash
     node "./bin/skill-gen.mjs" init --target <target> --yes --codex-models "<...>" --gemini-models "<...>" --claude-models "<...>"
     ```

2. **Verify health via `doctor`**:
   ```bash
   node "./bin/skill-gen.mjs" doctor
   ```

---

## Step 3 — Cài Gì & Báo Cáo Kết Quả

Confirm in **Vietnamese** that all 6 skills (`/ba`, `/harness`, `/po`, `/dev`, `/tester`, `/merge`), `archify`, 6 auto-switched subagents, `harness.mjs`, `pre-tool-hook.mjs`, and Global Engineering Rules are installed and verified!
